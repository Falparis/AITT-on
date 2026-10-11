import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as sdk from "@stellar/stellar-sdk";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK = sdk.Networks.TESTNET;
const xdr = sdk.xdr;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const hashes = {};

async function poll(hash, server, label) {
  hashes[label] = hash;
  for (let i = 0; i < 90; i++) {
    const r = await server.getTransaction(hash);
    if (r.status === "SUCCESS") { console.log(`  \u2713 ${label}  ${hash}`); return r; }
    if (r.status === "FAILED") {
      const n = r.resultXdr?.switch?.()?.name ?? "FAILED";
      throw new Error(`  \u2717 ${label}: ${n}`);
    }
    await sleep(3000);
  }
  throw new Error(`  \u2717 ${label}: timed out`);
}

const strArg = (v) => sdk.nativeToScVal(v, { type: "string" });
const u32Arg = (v) => sdk.nativeToScVal(v, { type: "u32" });
const u64Arg = (v) => sdk.nativeToScVal(BigInt(v), { type: "u64" });
const addrArg = (pub) => new sdk.Address(pub).toScVal();

function enumArg(tag, ...payload) {
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(tag), ...payload]);
}

async function call(server, kp, cid, func, args, label) {
  const contractAddr = new sdk.Address(cid);
  const invokeArgs = new xdr.InvokeContractArgs({
    contractAddress: contractAddr.toScAddress(),
    functionName: func, args,
  });
  const hostFn = xdr.HostFunction.hostFunctionTypeInvokeContract(invokeArgs);
  const opBody = xdr.OperationBody.invokeHostFunction(
    new xdr.InvokeHostFunctionOp({ hostFunction: hostFn, auth: [], footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }) })
  );
  const op = new xdr.Operation({ body: opBody });
  const tx = new sdk.TransactionBuilder(await server.getAccount(kp.publicKey()), {
    fee: "100000", networkPassphrase: NETWORK,
  }).addOperation(op).setTimeout(30).build();
  let sim;
  for (let attempt = 0; attempt < 3; attempt++) {
    sim = await server.simulateTransaction(tx);
    if (sim.error && sim.error.includes("MissingValue") && attempt < 2) {
      console.log(`  (retry ${attempt + 1}…)`);
      await sleep(5000);
      continue;
    }
    break;
  }
  const prepared = sdk.rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const sent = await server.sendTransaction(prepared);
  return poll(sent.hash, server, label);
}

async function main() {
  const server = new sdk.rpc.Server(RPC_URL);
  const accounts = JSON.parse(readFileSync(join(__dir, "..", "test-accounts.json"), "utf-8"));
  const [w01, w02, w03, w04, w05] = accounts;

  const admin = sdk.Keypair.fromSecret(w01.secretKey);
  const subA = sdk.Keypair.fromSecret(w02.secretKey);
  const subB = sdk.Keypair.fromSecret(w03.secretKey);
  const wl = sdk.Keypair.fromSecret(w04.secretKey);
  const wl2 = sdk.Keypair.fromSecret(w05.secretKey);

  const wasm = readFileSync(join(__dir, "..", "target/wasm32v1-none/release/document_verification_system.wasm"));
  const wasmHash = sdk.hash(wasm);
  console.log(`WASM: ${wasm.length}B\n`);

  // 1. Install
  console.log("=== 1. Install ===\n");
  let src = await server.getAccount(admin.publicKey());
  let tx = new sdk.TransactionBuilder(src, { fee: "100000", networkPassphrase: NETWORK })
    .addOperation(sdk.Operation.uploadContractWasm({ wasm })).setTimeout(30).build();
  let sim = await server.simulateTransaction(tx);
  let p = sdk.rpc.assembleTransaction(tx, sim).build();
  p.sign(admin);
  await poll(await server.sendTransaction(p).then(s => s.hash), server, "install-wasm");

  // 2. Deploy
  console.log("\n=== 2. Deploy ===\n");
  src = await server.getAccount(admin.publicKey());
  tx = new sdk.TransactionBuilder(src, { fee: "100000", networkPassphrase: NETWORK })
    .addOperation(sdk.Operation.createCustomContract({ wasmHash, salt: sdk.Keypair.random().rawPublicKey(), address: sdk.Address.fromString(admin.publicKey()) }))
    .setTimeout(30).build();
  sim = await server.simulateTransaction(tx);
  p = sdk.rpc.assembleTransaction(tx, sim).build();
  p.sign(admin);
  const deployResult = await poll(await server.sendTransaction(p).then(s => s.hash), server, "deploy-contract");
  const cid = sdk.scValToNative(deployResult.returnValue);
  console.log(`  Contract: ${cid}\n`);

  // 3. Init
  console.log("=== 3. Init ===\n");
  await call(server, admin, cid, "init", [addrArg(admin.publicKey())], "init");

  // 4. Add sub-admins
  console.log("\n=== 4. Sub-Admins ===\n");
  await call(server, admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subA.publicKey())], "add-sub-A");
  await call(server, admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subB.publicKey())], "add-sub-B");

  // 5. Whitelist
  console.log("\n=== 5. Whitelist ===\n");
  await call(server, admin, cid, "whitelist_address", [addrArg(wl.publicKey())], "whitelist-w04");
  await call(server, admin, cid, "whitelist_address", [addrArg(wl2.publicKey())], "whitelist-w05");

  // 6. Threshold
  console.log("\n=== 6. Threshold ===\n");
  await call(server, admin, cid, "set_threshold", [addrArg(admin.publicKey()), u32Arg(2)], "set-threshold");

  // 7. Store doc
  console.log("\n=== 7. Store Document ===\n");
  const docName = "Q4-Audit-Report.pdf";
  const docHash = "e2e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f";
  await call(server, wl, cid, "store_document", [addrArg(wl.publicKey()), strArg(docName), strArg(docHash)], "store-doc");
  await call(server, admin, cid, "read_document", [strArg(docHash)], "read-doc");

  // 8. Reviews
  console.log("\n=== 8. Reviews ===\n");
  await call(server, subA, cid, "submit_review", [addrArg(subA.publicKey()), strArg(docHash), enumArg("ApprovedWithRecommendations"), u32Arg(85), strArg("ipfs://QmReviewA")], "review-A");
  await call(server, subB, cid, "submit_review", [addrArg(subB.publicKey()), strArg(docHash), enumArg("Approved"), u32Arg(92), strArg("ipfs://QmReviewB")], "review-B");

  // 9. RevokeCertificate
  console.log("\n=== 9. Revoke Multi-Sig ===\n");
  const cp1 = await call(server, subA, cid, "create_proposal", [addrArg(subA.publicKey()), enumArg("RevokeCertificate", strArg(docHash))], "create-prop1");
  const pid1 = Number(sdk.scValToNative(cp1.returnValue));
  console.log(`  Proposal: ${pid1}`);
  await call(server, subA, cid, "approve_proposal", [addrArg(subA.publicKey()), u64Arg(pid1)], "approve1-A");
  await call(server, subB, cid, "approve_proposal", [addrArg(subB.publicKey()), u64Arg(pid1)], "approve1-B");
  // Proposal auto-executes when threshold (2) is met on approve1-B

  // 10. UpdateThreshold
  console.log("\n=== 10. UpdateThreshold Multi-Sig ===\n");
  const cp2 = await call(server, subB, cid, "create_proposal", [addrArg(subB.publicKey()), enumArg("UpdateThreshold", u32Arg(2))], "create-prop2");
  const pid2 = Number(sdk.scValToNative(cp2.returnValue));
  console.log(`  Proposal: ${pid2}`);
  await call(server, subA, cid, "approve_proposal", [addrArg(subA.publicKey()), u64Arg(pid2)], "approve2-A");
  await call(server, subB, cid, "approve_proposal", [addrArg(subB.publicKey()), u64Arg(pid2)], "approve2-B");
  // Auto-executes on approve2-B with threshold 2

  // Save
  const result = {
    network: "testnet",
    rpcUrl: RPC_URL,
    contractId: cid,
    wasmHash: wasmHash.toString("hex"),
    transactions: hashes,
    mainAdmin: { id: w01.id, publicKey: w01.publicKey, secretKey: w01.secretKey },
    subAdmins: [
      { id: w02.id, publicKey: w02.publicKey, secretKey: w02.secretKey },
      { id: w03.id, publicKey: w03.publicKey, secretKey: w03.secretKey },
    ],
    whitelistedUsers: [
      { id: w04.id, publicKey: w04.publicKey, secretKey: w04.secretKey },
      { id: w05.id, publicKey: w05.publicKey, secretKey: w05.secretKey },
    ],
    document: { name: docName, hash: docHash },
  };
  writeFileSync(join(__dir, "..", "deployment-result.json"), JSON.stringify(result, null, 2));
  console.log("\n=== DONE ===\ndeployment-result.json saved");
}

main().catch(e => { console.error("\nFATAL:", e.message?.substring(0, 500)); process.exit(1); });
