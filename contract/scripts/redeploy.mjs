import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as sdk from "@stellar/stellar-sdk";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK = sdk.Networks.TESTNET;
const xdr = sdk.xdr;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function poll(hash, label) {
  const server = new sdk.rpc.Server(RPC_URL);
  for (let i = 0; i < 90; i++) {
    const r = await server.getTransaction(hash);
    if (r.status === "SUCCESS") { console.log(`  ✓ ${label}`); return r; }
    if (r.status === "FAILED") throw new Error(`${label} FAILED`);
    await sleep(3000);
  }
  throw new Error(`${label} timed out`);
}

async function main() {
  const server = new sdk.rpc.Server(RPC_URL);
  const accounts = JSON.parse(readFileSync(join(__dir, "..", "test-accounts.json"), "utf-8"));
  const w01 = accounts[0];
  const admin = sdk.Keypair.fromSecret(w01.secretKey);

  const wasm = readFileSync(join(__dir, "..", "target/wasm32v1-none/release/document_verification_system.wasm"));
  const wasmHash = sdk.hash(wasm);
  console.log(`WASM: ${wasm.length}B | hash: ${wasmHash.toString("hex")}\n`);

  // Install
  let src = await server.getAccount(admin.publicKey());
  let tx = new sdk.TransactionBuilder(src, { fee: "100000", networkPassphrase: NETWORK })
    .addOperation(sdk.Operation.uploadContractWasm({ wasm })).setTimeout(30).build();
  let sim = await server.simulateTransaction(tx);
  let p = sdk.rpc.assembleTransaction(tx, sim).build();
  p.sign(admin);
  const sent1 = await server.sendTransaction(p);
  await poll(sent1.hash, "install");

  // Deploy
  src = await server.getAccount(admin.publicKey());
  tx = new sdk.TransactionBuilder(src, { fee: "100000", networkPassphrase: NETWORK })
    .addOperation(sdk.Operation.createCustomContract({
      wasmHash, salt: sdk.Keypair.random().rawPublicKey(),
      address: sdk.Address.fromString(admin.publicKey()),
    }))
    .setTimeout(30).build();
  sim = await server.simulateTransaction(tx);
  p = sdk.rpc.assembleTransaction(tx, sim).build();
  p.sign(admin);
  const sent2 = await server.sendTransaction(p);
  const deployResult = await poll(sent2.hash, "deploy");
  const cid = sdk.scValToNative(deployResult.returnValue);
  console.log(`Contract: ${cid}\n`);

  // Init
  const addrArg = (pub) => new sdk.Address(pub).toScVal();
  const invokeArgs = new xdr.InvokeContractArgs({
    contractAddress: new sdk.Address(cid).toScAddress(),
    functionName: "init",
    args: [addrArg(admin.publicKey())],
  });
  const hostFn = xdr.HostFunction.hostFunctionTypeInvokeContract(invokeArgs);
  const opBody = xdr.OperationBody.invokeHostFunction(
    new xdr.InvokeHostFunctionOp({ hostFunction: hostFn, auth: [], footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }) })
  );
  const op = new xdr.Operation({ body: opBody });
  src = await server.getAccount(admin.publicKey());
  tx = new sdk.TransactionBuilder(src, { fee: "100000", networkPassphrase: NETWORK })
    .addOperation(op).setTimeout(30).build();
  sim = await server.simulateTransaction(tx);
  p = sdk.rpc.assembleTransaction(tx, sim).build();
  p.sign(admin);
  const sent3 = await server.sendTransaction(p);
  await poll(sent3.hash, "init");

  // Save
  const result = {
    network: "testnet",
    rpcUrl: RPC_URL,
    contractId: cid,
    wasmHash: wasmHash.toString("hex"),
    mainAdmin: { id: w01.id, publicKey: w01.publicKey, secretKey: w01.secretKey },
    accountsFile: "test-accounts.json",
  };
  writeFileSync(join(__dir, "..", "deployment-result.json"), JSON.stringify(result, null, 2));
  console.log("\ndeployment-result.json saved");
}

main().catch(e => { console.error("\nFATAL:", e.message.substring(0, 500)); process.exit(1); });
