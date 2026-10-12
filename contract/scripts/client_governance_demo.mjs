// Client governance demo on Stellar testnet.
//
// Deploys a fresh contract with the main admin key (wallet-01 from
// test-accounts.json), creates + funds new sub-admin / company keys, then runs:
//   add_sub_admin -> set_threshold(2) -> create_proposal(RevokeCertificate)
//   -> approvals reaching the threshold -> auto-executed revocation.
// Also proves the pre-mainnet guards (init can't be re-called, threshold is
// bounded by the sub-admin count) via simulation.
//
// Writes demo-result.json (no secrets) and GOVERNANCE-TESTNET-PROOF.md.
// New keys are saved to demo-accounts.json (gitignored).
//
// Usage: stellar contract build && node scripts/client_governance_demo.mjs
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as sdk from "@stellar/stellar-sdk";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const EXPLORER = "https://stellar.expert/explorer/testnet";
const NETWORK = sdk.Networks.TESTNET;
const xdr = sdk.xdr;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = new sdk.rpc.Server(RPC_URL);

const steps = []; // { label, hash } in execution order

const strArg = (v) => sdk.nativeToScVal(v, { type: "string" });
const u32Arg = (v) => sdk.nativeToScVal(v, { type: "u32" });
const u64Arg = (v) => sdk.nativeToScVal(BigInt(v), { type: "u64" });
const addrArg = (pub) => new sdk.Address(pub).toScVal();
const enumArg = (tag, ...payload) => xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(tag), ...payload]);
// Contract enums decode as ["Variant"]; return the variant name.
const certStatus = (doc) => [].concat(doc.certificate_status)[0];

async function poll(hash, label) {
  for (let i = 0; i < 90; i++) {
    const r = await server.getTransaction(hash);
    if (r.status === "SUCCESS") {
      steps.push({ label, hash });
      console.log(`  ✓ ${label}  ${hash}`);
      return r;
    }
    if (r.status === "FAILED") throw new Error(`${label} failed: ${hash}`);
    await sleep(2000);
  }
  throw new Error(`${label}: timed out`);
}

async function submit(kp, op, label) {
  const tx = new sdk.TransactionBuilder(await server.getAccount(kp.publicKey()), {
    fee: "100000", networkPassphrase: NETWORK,
  }).addOperation(op).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  if (sdk.rpc.Api.isSimulationError(sim)) throw new Error(`${label} simulation failed: ${sim.error}`);
  const prepared = sdk.rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error(`${label} rejected by RPC`);
  return poll(sent.hash, label);
}

const invokeOp = (cid, func, args) =>
  sdk.Operation.invokeContractFunction({ contract: cid, function: func, args });

const call = (kp, cid, func, args, label) => submit(kp, invokeOp(cid, func, args), label);

// Read-only / expected-failure checks: simulate only, no transaction submitted.
async function simulate(kp, cid, func, args) {
  const tx = new sdk.TransactionBuilder(await server.getAccount(kp.publicKey()), {
    fee: "100", networkPassphrase: NETWORK,
  }).addOperation(invokeOp(cid, func, args)).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  if (sdk.rpc.Api.isSimulationError(sim)) return { ok: false, error: sim.error };
  return { ok: true, value: sdk.scValToNative(sim.result.retval) };
}

const read = async (kp, cid, func, args) => {
  const r = await simulate(kp, cid, func, args);
  if (!r.ok) throw new Error(`${func} read failed: ${r.error}`);
  return r.value;
};

// Release WASM strips panic messages, so a rejected call shows up as a VM trap.
async function expectRejected(kp, cid, func, args, description) {
  const r = await simulate(kp, cid, func, args);
  const rejected = !r.ok && r.error.includes("UnreachableCodeReached");
  console.log(`  ${rejected ? "✓" : "✗"} rejected: ${description}`);
  if (!rejected) throw new Error(`expected rejection: ${description}`);
  return description;
}

async function fund(pub) {
  const res = await fetch(`${FRIENDBOT}?addr=${pub}`);
  if (res.ok) return;
  // Friendbot refuses accounts that are already funded; that's fine.
  try { await server.getAccount(pub); } catch {
    throw new Error(`friendbot failed for ${pub}: ${res.status}`);
  }
}

async function main() {
  // ---- Keys ----
  console.log("=== Keys ===\n");
  const accounts = JSON.parse(readFileSync(join(ROOT, "test-accounts.json"), "utf-8"));
  const admin = sdk.Keypair.fromSecret(accounts[0].secretKey);
  await fund(admin.publicKey()); // no-op if already funded
  console.log(`  main admin  ${admin.publicKey()}`);

  const roles = ["subAdminA", "subAdminB", "subAdminC", "company"];
  const kp = {};
  for (const role of roles) {
    kp[role] = sdk.Keypair.random();
    await fund(kp[role].publicKey());
    console.log(`  ${role.padEnd(11)} ${kp[role].publicKey()} (new, funded)`);
    await sleep(500);
  }
  writeFileSync(join(ROOT, "demo-accounts.json"), JSON.stringify(
    [{ role: "mainAdmin", publicKey: admin.publicKey(), secretKey: admin.secret() },
      ...roles.map((r) => ({ role: r, publicKey: kp[r].publicKey(), secretKey: kp[r].secret() }))],
    null, 2,
  ));
  const { subAdminA, subAdminB, subAdminC, company } = kp;

  // ---- Deploy ----
  console.log("\n=== Deploy ===\n");
  const wasm = readFileSync(join(ROOT, "target/wasm32v1-none/release/document_verification_system.wasm"));
  const wasmHash = sdk.hash(wasm);
  console.log(`  WASM ${wasm.length} bytes, sha256 ${wasmHash.toString("hex")}`);
  await submit(admin, sdk.Operation.uploadContractWasm({ wasm }), "Upload WASM");
  const deployed = await submit(admin, sdk.Operation.createCustomContract({
    wasmHash, address: sdk.Address.fromString(admin.publicKey()), salt: sdk.Keypair.random().rawPublicKey(),
  }), "Deploy contract");
  const cid = sdk.Address.fromScVal(deployed.returnValue).toString();
  console.log(`  contract ${cid}`);
  await call(admin, cid, "init", [addrArg(admin.publicKey())], "init (main admin)");

  // ---- Guard: init cannot be called again ----
  console.log("\n=== Guard: init ===\n");
  const guardInit = await expectRejected(subAdminA, cid, "init", [addrArg(subAdminA.publicKey())],
    "init called again by another account");
  const mainAdminAfter = await read(admin, cid, "main_admin_address", []);
  if (mainAdminAfter !== admin.publicKey()) throw new Error("main admin changed");
  console.log(`  main_admin_address unchanged: ${mainAdminAfter}`);

  // ---- add_sub_admin ----
  console.log("\n=== add_sub_admin ===\n");
  await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subAdminA.publicKey())], "add_sub_admin (Sub-admin A)");
  await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subAdminB.publicKey())], "add_sub_admin (Sub-admin B)");
  await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subAdminC.publicKey())], "add_sub_admin (Sub-admin C)");
  const subAdminCount = await read(admin, cid, "sub_admin_count", []);
  console.log(`  sub_admin_count = ${subAdminCount}`);

  // ---- set_threshold >= 2 ----
  console.log("\n=== set_threshold ===\n");
  const guardThresholdHigh = await expectRejected(admin, cid, "set_threshold",
    [addrArg(admin.publicKey()), u32Arg(4)], "set_threshold(4) with only 3 sub-admins");
  const guardThresholdZero = await expectRejected(admin, cid, "set_threshold",
    [addrArg(admin.publicKey()), u32Arg(0)], "set_threshold(0)");
  await call(admin, cid, "set_threshold", [addrArg(admin.publicKey()), u32Arg(2)], "set_threshold (N = 2)");
  const threshold = await read(admin, cid, "governance_threshold", []);
  console.log(`  governance_threshold = ${threshold} (of ${subAdminCount} sub-admins)`);

  // ---- Certificate to revoke ----
  console.log("\n=== Certificate ===\n");
  const docName = "AITT-Governance-Demo-Certificate.pdf";
  const docHash = sdk.hash(Buffer.from(`aitt-governance-demo-${Date.now()}`)).toString("hex");
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
  await call(admin, cid, "whitelist_address", [addrArg(company.publicKey())], "whitelist_address (company)");
  await call(company, cid, "store_document", [addrArg(company.publicKey()), strArg(docName), strArg(docHash)], "store_document (company)");
  await call(admin, cid, "issue_certificate", [addrArg(admin.publicKey()), strArg(docHash), u64Arg(expiry)], "issue_certificate");
  const beforeRevoke = await read(admin, cid, "verify_document", [strArg(docHash)]);
  console.log(`  verify_document: ${certStatus(beforeRevoke)} / verified=${beforeRevoke.verified_document}`);

  // ---- create_proposal + approvals -> auto-executed revoke ----
  console.log("\n=== RevokeCertificate via multisig ===\n");
  const created = await call(subAdminA, cid, "create_proposal",
    [addrArg(subAdminA.publicKey()), enumArg("RevokeCertificate", strArg(docHash))], "create_proposal (RevokeCertificate)");
  const pid = Number(sdk.scValToNative(created.returnValue));
  console.log(`  proposal id ${pid}`);

  await call(subAdminA, cid, "approve_proposal", [addrArg(subAdminA.publicKey()), u64Arg(pid)], "approve_proposal (Sub-admin A, 1/2)");
  const afterOne = await read(admin, cid, "read_proposal", [u64Arg(pid)]);
  const statusAfterOne = certStatus(await read(admin, cid, "verify_document", [strArg(docHash)]));
  console.log(`  after 1/2: executed=${afterOne.executed}, certificate=${statusAfterOne}`);

  await call(subAdminB, cid, "approve_proposal", [addrArg(subAdminB.publicKey()), u64Arg(pid)], "approve_proposal (Sub-admin B, 2/2, auto-executes)");
  const afterTwo = await read(admin, cid, "read_proposal", [u64Arg(pid)]);
  const afterRevoke = await read(admin, cid, "verify_document", [strArg(docHash)]);
  console.log(`  after 2/2: executed=${afterTwo.executed}, certificate=${certStatus(afterRevoke)} / verified=${afterRevoke.verified_document}`);
  if (!afterTwo.executed || certStatus(afterRevoke) !== "Revoked") throw new Error("revocation did not auto-execute");

  // ---- Results ----
  const result = {
    network: "testnet",
    contractId: cid,
    wasmHash: wasmHash.toString("hex"),
    mainAdmin: admin.publicKey(),
    subAdmins: [subAdminA.publicKey(), subAdminB.publicKey(), subAdminC.publicKey()],
    company: company.publicKey(),
    threshold, subAdminCount,
    certificate: { name: docName, hash: docHash, expiry },
    proposalId: pid,
    checks: {
      beforeRevoke: certStatus(beforeRevoke),
      afterFirstApproval: { executed: afterOne.executed, certificate: statusAfterOne },
      afterSecondApproval: { executed: afterTwo.executed, certificate: certStatus(afterRevoke) },
      guards: [guardInit, guardThresholdHigh, guardThresholdZero],
    },
    transactions: steps,
  };
  writeFileSync(join(ROOT, "demo-result.json"), JSON.stringify(result, null, 2));
  writeFileSync(join(ROOT, "GOVERNANCE-TESTNET-PROOF.md"), proofMarkdown(result));
  console.log("\n=== DONE === demo-result.json + GOVERNANCE-TESTNET-PROOF.md written");
}

function proofMarkdown(r) {
  const rows = r.transactions.map((s, i) => `| ${i + 1} | ${s.label} | [\`${s.hash}\`](${EXPLORER}/tx/${s.hash}) |`).join("\n");
  return `# Multisig Governance — Testnet Proof

| | |
|---|---|
| Network | Stellar testnet |
| Contract ID | [\`${r.contractId}\`](${EXPLORER}/contract/${r.contractId}) |
| WASM hash | \`${r.wasmHash}\` |
| Main admin | \`${r.mainAdmin}\` |
| Sub-admins | ${r.subAdmins.map((a) => `\`${a}\``).join("<br>")} |
| Threshold | ${r.threshold} of ${r.subAdminCount} |
| Revoked certificate hash | \`${r.certificate.hash}\` |
| Proposal ID | ${r.proposalId} |

## Transactions (in order)

| # | Step | Transaction |
|---|---|---|
${rows}

## Results

- Before revocation: certificate **${r.checks.beforeRevoke}**.
- After approval 1 of ${r.threshold}: proposal executed = **${r.checks.afterFirstApproval.executed}**, certificate **${r.checks.afterFirstApproval.certificate}**.
- After approval 2 of ${r.threshold}: proposal executed = **${r.checks.afterSecondApproval.executed}** (auto-executed), certificate **${r.checks.afterSecondApproval.certificate}**.

## Pre-mainnet guards (verified by simulation, rejected before submission)

${r.checks.guards.map((g) => `- \`${g}\``).join("\n")}
`;
}

main().catch((e) => { console.error("\nFATAL:", e.message?.substring(0, 800)); process.exit(1); });
