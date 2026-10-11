import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as sdk from "@stellar/stellar-sdk";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK = sdk.Networks.TESTNET;
const xdr = sdk.xdr;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── helpers ──────────────────────────────────────────────

const strArg = (v) => sdk.nativeToScVal(v, { type: "string" });
const u32Arg = (v) => sdk.nativeToScVal(v, { type: "u32" });
const u64Arg = (v) => sdk.nativeToScVal(BigInt(v), { type: "u64" });
const addrArg = (pub) => new sdk.Address(pub).toScVal();
const bytes32Arg = (hex) => xdr.ScVal.scvBytes(Buffer.from(hex, "hex"));

function enumArg(tag, ...payload) {
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(tag), ...payload]);
}

// BigInt-safe JSON for error messages
function toStr(v) {
  if (v === null || v === undefined) return "null";
  try {
    return JSON.stringify(v, (_, v) => typeof v === "bigint" ? v.toString() + "n" : v);
  } catch {
    return String(v);
  }
}

// Extract clean string value from scValToNative result (handles Symbol → string)
function getStatus(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "symbol") return val.description || String(val).replace("Symbol(","").replace(")","");
  if (Array.isArray(val) && val.length > 0) {
    const first = val[0];
    if (typeof first === "symbol") return first.description || String(first).replace("Symbol(","").replace(")","");
    if (typeof first === "string") return first;
  }
  return String(val);
}

let passCount = 0;
let failCount = 0;

function test(name) {
  process.stdout.write(`  ${name} ... `);
}

function pass() { passCount++; console.log("PASS"); }
function fail(msg) { failCount++; console.log("FAIL " + msg); }

// ── Stellar helpers ──────────────────────────────────────

const server = new sdk.rpc.Server(RPC_URL);

async function poll(hash) {
  for (let i = 0; i < 90; i++) {
    const r = await server.getTransaction(hash);
    if (r.status === "SUCCESS") return r;
    if (r.status === "FAILED") throw new Error("tx FAILED");
    await sleep(3000);
  }
  throw new Error("timed out");
}

async function buildTx(kp, cid, func, args) {
  const contractAddr = new sdk.Address(cid);
  const invokeArgs = new xdr.InvokeContractArgs({
    contractAddress: contractAddr.toScAddress(),
    functionName: func,
    args,
  });
  const hostFn = xdr.HostFunction.hostFunctionTypeInvokeContract(invokeArgs);
  const opBody = xdr.OperationBody.invokeHostFunction(
    new xdr.InvokeHostFunctionOp({
      hostFunction: hostFn,
      auth: [],
      footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }),
    })
  );
  const op = new xdr.Operation({ body: opBody });
  const src = await server.getAccount(kp.publicKey());
  return new sdk.TransactionBuilder(src, {
    fee: "100000",
    networkPassphrase: NETWORK,
  }).addOperation(op).setTimeout(30).build();
}

async function simulate(tx) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const sim = await server.simulateTransaction(tx);
    if (sim.error && sim.error.includes("MissingValue") && attempt < 2) {
      await sleep(5000);
      continue;
    }
    return sim;
  }
}

async function call(kp, cid, func, args) {
  const tx = await buildTx(kp, cid, func, args);
  const sim = await simulate(tx);
  if (sim.error) throw new Error("sim: " + sim.error.substring(0, 80));
  const prepared = sdk.rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const sent = await server.sendTransaction(prepared);
  return poll(sent.hash);
}

async function callExpectFail(kp, cid, func, args) {
  try {
    const tx = await buildTx(kp, cid, func, args);
    const sim = await simulate(tx);
    if (sim.error) return "fail"; // simulation caught the panic
    const prepared = sdk.rpc.assembleTransaction(tx, sim).build();
    prepared.sign(kp);
    const sent = await server.sendTransaction(prepared);
    await poll(sent.hash);
    return "unexpected_success";
  } catch {
    return "fail";
  }
}

// Read via simulation — use scValToNative, catch BigInt issues gracefully
async function read(kp, cid, func, args) {
  try {
    const tx = await buildTx(kp, cid, func, args);
    const sim = await simulate(tx);
    if (sim.error || !sim.result || !sim.result.retval) return { result: null };
    const retval = sim.result.retval;
    // Check for void
    if (retval.switch().name === "scvVoid") return { result: null };
    return { result: sdk.scValToNative(retval) };
  } catch {
    return { result: null };
  }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════");
  console.log("  Document Verification System — Full Test");
  console.log("══════════════════════════════════════════════\n");

  const accounts = JSON.parse(readFileSync(join(__dir, "..", "test-accounts.json"), "utf-8"));
  const deployment = JSON.parse(readFileSync(join(__dir, "..", "deployment-result.json"), "utf-8"));
  const cid = deployment.contractId;

  const [w01, w02, w03, w04, w05, w06, _w07, _w08, _w09, w10] = accounts;
  const admin = sdk.Keypair.fromSecret(w01.secretKey);
  const subA = sdk.Keypair.fromSecret(w02.secretKey);
  const subB = sdk.Keypair.fromSecret(w03.secretKey);
  const subC = sdk.Keypair.fromSecret(w10.secretKey);
  const compA = sdk.Keypair.fromSecret(w04.secretKey);
  const compB = sdk.Keypair.fromSecret(w05.secretKey);
  const stranger = sdk.Keypair.fromSecret(w06.secretKey);

  // ════════════════════════════════════════════════════════
  // 1. INITIAL STATE
  // ════════════════════════════════════════════════════════
  console.log("── 1. Initial State ──\n");

  test("main_admin_address returns correct admin");
  try {
    const r = await read(admin, cid, "main_admin_address", []);
    const addr = r.result?.toString();
    if (addr === admin.publicKey()) pass();
    else fail("expected " + admin.publicKey().substring(0, 8) + "..., got " + String(addr).substring(0, 20));
  } catch (e) { fail(e.message); }

  test("governance_threshold defaults to 1");
  try {
    const r = await read(admin, cid, "governance_threshold", []);
    const val = Number(r.result);
    if (val === 1) pass();
    else fail("expected 1, got " + val);
  } catch (e) { fail(e.message); }

  test("is_whitelisted false for stranger");
  try {
    const r = await read(admin, cid, "is_whitelisted", [addrArg(stranger.publicKey())]);
    if (r.result === false) pass();
    else fail("expected false");
  } catch (e) { fail(e.message); }

  test("is_sub_admin_public false for stranger");
  try {
    const r = await read(admin, cid, "is_sub_admin_public", [addrArg(stranger.publicKey())]);
    if (r.result === false) pass();
    else fail("expected false");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 2. SUB-ADMIN MANAGEMENT
  // ════════════════════════════════════════════════════════
  console.log("\n── 2. Sub-Admin Management ──\n");

  test("main admin adds sub-admin A");
  try {
    await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subA.publicKey())]);
    const r = await read(admin, cid, "is_sub_admin_public", [addrArg(subA.publicKey())]);
    if (r.result === true) pass();
    else fail("not recognized");
  } catch (e) { fail(e.message); }

  test("main admin adds sub-admin B");
  try {
    await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subB.publicKey())]);
    const r = await read(admin, cid, "is_sub_admin_public", [addrArg(subB.publicKey())]);
    if (r.result === true) pass();
    else fail("not recognized");
  } catch (e) { fail(e.message); }

  test("main admin adds sub-admin C");
  try {
    await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subC.publicKey())]);
    const r = await read(admin, cid, "is_sub_admin_public", [addrArg(subC.publicKey())]);
    if (r.result === true) pass();
    else fail("not recognized");
  } catch (e) { fail(e.message); }

  test("sub-admin cannot add another sub-admin (must fail)");
  try {
    const status = await callExpectFail(subA, cid, "add_sub_admin", [addrArg(subA.publicKey()), addrArg(stranger.publicKey())]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("main admin removes sub-admin C");
  try {
    await call(admin, cid, "remove_sub_admin", [addrArg(admin.publicKey()), addrArg(subC.publicKey())]);
    const r = await read(admin, cid, "is_sub_admin_public", [addrArg(subC.publicKey())]);
    if (r.result === false) pass();
    else fail("still recognized after removal");
  } catch (e) { fail(e.message); }

  test("re-add sub-admin C for governance");
  try {
    await call(admin, cid, "add_sub_admin", [addrArg(admin.publicKey()), addrArg(subC.publicKey())]);
    pass();
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 3. WHITELIST MANAGEMENT
  // ════════════════════════════════════════════════════════
  console.log("\n── 3. Whitelist Management ──\n");

  test("main admin whitelists company A");
  try {
    await call(admin, cid, "whitelist_address", [addrArg(compA.publicKey())]);
    const r = await read(admin, cid, "is_whitelisted", [addrArg(compA.publicKey())]);
    if (r.result === true) pass();
    else fail("not whitelisted");
  } catch (e) { fail(e.message); }

  test("main admin whitelists company B");
  try {
    await call(admin, cid, "whitelist_address", [addrArg(compB.publicKey())]);
    const r = await read(admin, cid, "is_whitelisted", [addrArg(compB.publicKey())]);
    if (r.result === true) pass();
    else fail("not whitelisted");
  } catch (e) { fail(e.message); }

  test("non-admin cannot whitelist (must fail)");
  try {
    const status = await callExpectFail(subA, cid, "whitelist_address", [addrArg(stranger.publicKey())]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("main admin removes company B from whitelist");
  try {
    await call(admin, cid, "remove_from_whitelist", [addrArg(compB.publicKey())]);
    const r = await read(admin, cid, "is_whitelisted", [addrArg(compB.publicKey())]);
    if (r.result === false) pass();
    else fail("still whitelisted after removal");
  } catch (e) { fail(e.message); }

  test("re-add company B for later tests");
  try {
    await call(admin, cid, "whitelist_address", [addrArg(compB.publicKey())]);
    pass();
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 4. THRESHOLD MANAGEMENT
  // ════════════════════════════════════════════════════════
  console.log("\n── 4. Threshold Management ──\n");

  test("main admin sets threshold to 2");
  try {
    await call(admin, cid, "set_threshold", [addrArg(admin.publicKey()), u32Arg(2)]);
    const r = await read(admin, cid, "governance_threshold", []);
    if (Number(r.result) === 2) pass();
    else fail("expected 2, got " + Number(r.result));
  } catch (e) { fail(e.message); }

  test("non-admin cannot set threshold (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "set_threshold", [addrArg(compA.publicKey()), u32Arg(5)]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("reset threshold to 1 for single-signer tests");
  try {
    await call(admin, cid, "set_threshold", [addrArg(admin.publicKey()), u32Arg(1)]);
    const r = await read(admin, cid, "governance_threshold", []);
    if (Number(r.result) === 1) pass();
    else fail("expected 1");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 5. DOCUMENT STORAGE
  // ════════════════════════════════════════════════════════
  console.log("\n── 5. Document Storage ──\n");

  const doc1Name = "Q4-Audit-Report.pdf";
  const doc1Hash = "e2e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f";
  const doc2Hash = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";

  test("admin stores document");
  try {
    await call(admin, cid, "store_document", [addrArg(admin.publicKey()), strArg(doc1Name), strArg(doc1Hash)]);
    pass();
  } catch (e) { fail(e.message); }

  test("read document fields match");
  try {
    const r = await read(admin, cid, "read_document", [strArg(doc1Hash)]);
    if (!r.result) { fail("null"); return; }
    if (r.result.name === doc1Name && r.result.hash === doc1Hash) pass();
    else fail("name/hash mismatch: " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("read non-existent document returns null");
  try {
    const r = await read(admin, cid, "read_document", [strArg("nonexistent")]);
    if (r.result === null) pass();
    else fail("expected null");
  } catch (e) { fail(e.message); }

  test("stored document is in Submitted status");
  try {
    const r = await read(admin, cid, "read_document", [strArg(doc1Hash)]);
    if (r.result && getStatus(r.result.status) === "Submitted") pass();
    else fail("expected Submitted, got " + (r.result ? getStatus(r.result.status) : "null"));
  } catch (e) { fail(e.message); }

  test("store duplicate hash (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "store_document", [addrArg(compA.publicKey()), strArg("Other.pdf"), strArg(doc1Hash)]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("whitelisted company stores document");
  try {
    await call(compA, cid, "store_document", [addrArg(compA.publicKey()), strArg("Compliance-Report.pdf"), strArg(doc2Hash)]);
    pass();
  } catch (e) { fail(e.message); }

  test("non-whitelisted user cannot store (must fail)");
  try {
    const status = await callExpectFail(stranger, cid, "store_document", [addrArg(stranger.publicKey()), strArg("Evil.pdf"), strArg("ffff")]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 6. CERTIFICATE ISSUANCE
  // ════════════════════════════════════════════════════════
  console.log("\n── 6. Certificate Issuance ──\n");

  test("admin issues certificate on doc1");
  try {
    await call(admin, cid, "issue_certificate", [addrArg(admin.publicKey()), strArg(doc1Hash), u64Arg("2000000000")]);
    const r = await read(admin, cid, "read_document", [strArg(doc1Hash)]);
    if (r.result && getStatus(r.result.status) === "Issued") pass();
    else fail("expected Issued, got " + (r.result ? getStatus(r.result.status) : "null"));
  } catch (e) { fail(e.message); }

  test("admin issues certificate on doc2");
  try {
    await call(admin, cid, "issue_certificate", [addrArg(admin.publicKey()), strArg(doc2Hash), u64Arg("2000000000")]);
    const r = await read(admin, cid, "read_document", [strArg(doc2Hash)]);
    if (r.result && getStatus(r.result.status) === "Issued") pass();
    else fail("expected Issued, got " + (r.result ? getStatus(r.result.status) : "null"));
  } catch (e) { fail(e.message); }

  test("non-admin cannot issue (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "issue_certificate", [addrArg(compA.publicKey()), strArg(doc2Hash), u64Arg("2000000000")]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("issue already-issued document (must fail)");
  try {
    const status = await callExpectFail(admin, cid, "issue_certificate", [addrArg(admin.publicKey()), strArg(doc1Hash), u64Arg("2000000000")]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("issue non-existent document (must fail)");
  try {
    const status = await callExpectFail(admin, cid, "issue_certificate", [addrArg(admin.publicKey()), strArg("deadbeef"), u64Arg("2000000000")]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 7. DOCUMENT VERIFICATION
  // ════════════════════════════════════════════════════════
  console.log("\n── 7. Document Verification ──\n");

  test("verify issued doc1: verified=true, status=Issued");
  try {
    const r = await read(admin, cid, "verify_document", [strArg(doc1Hash)]);
    if (!r.result) { fail("null"); return; }
    const v = r.result;
    if (v.verified_document === true && getStatus(v.certificate_status) === "Issued") pass();
    else fail("got " + toStr(v));
  } catch (e) { fail(e.message); }

  test("verify issued doc2: verified=true, status=Issued");
  try {
    const r = await read(admin, cid, "verify_document", [strArg(doc2Hash)]);
    if (!r.result) { fail("null"); return; }
    const v = r.result;
    if (v.verified_document === true && getStatus(v.certificate_status) === "Issued") pass();
    else fail("got " + toStr(v));
  } catch (e) { fail(e.message); }

  test("verify non-existent document returns null");
  try {
    const r = await read(admin, cid, "verify_document", [strArg("nonexistent")]);
    if (r.result === null) pass();
    else fail("expected null");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 8. COMPLIANCE REVIEWS
  // ════════════════════════════════════════════════════════
  console.log("\n── 8. Compliance Reviews ──\n");

  test("sub-admin A submits review on doc1");
  try {
    await call(subA, cid, "submit_review", [
      addrArg(subA.publicKey()), strArg(doc1Hash),
      enumArg("ApprovedWithRecommendations"), u32Arg(85), strArg("ipfs://QmReviewA"),
    ]);
    pass();
  } catch (e) { fail(e.message); }

  test("sub-admin B submits review on doc1");
  try {
    await call(subB, cid, "submit_review", [
      addrArg(subB.publicKey()), strArg(doc1Hash),
      enumArg("Approved"), u32Arg(92), strArg("ipfs://QmReviewB"),
    ]);
    pass();
  } catch (e) { fail(e.message); }

  test("non-sub-admin cannot review (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "submit_review", [
      addrArg(compA.publicKey()), strArg(doc1Hash),
      enumArg("Approved"), u32Arg(50), strArg("ipfs://QmBad"),
    ]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("read review returns correct score");
  try {
    const r = await read(admin, cid, "read_review", [strArg(doc1Hash), addrArg(subA.publicKey())]);
    if (!r.result) { fail("null"); return; }
    if (Number(r.result.score) === 85) pass();
    else fail("expected 85, got " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("read non-existent review returns null");
  try {
    const r = await read(admin, cid, "read_review", [strArg("nonexistent"), addrArg(subA.publicKey())]);
    if (r.result === null) pass();
    else fail("expected null");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 9. PROPOSALS — REVOKE CERTIFICATE (MULTI-SIG)
  // ════════════════════════════════════════════════════════
  console.log("\n── 9. Proposals (RevokeCertificate) ──\n");

  // Set threshold to 2 for multi-sig
  await call(admin, cid, "set_threshold", [addrArg(admin.publicKey()), u32Arg(2)]);

  let pidRevoke;

  test("sub-admin A creates RevokeCertificate proposal");
  try {
    const r = await call(subA, cid, "create_proposal", [
      addrArg(subA.publicKey()), enumArg("RevokeCertificate", strArg(doc1Hash)),
    ]);
    pidRevoke = Number(sdk.scValToNative(r.returnValue));
    if (pidRevoke > 0) pass();
    else fail("invalid id: " + pidRevoke);
  } catch (e) { fail(e.message); }

  test("read proposal returns correct id and not executed");
  try {
    const r = await read(admin, cid, "read_proposal", [u64Arg(pidRevoke)]);
    if (!r.result) { fail("null"); return; }
    if (Number(r.result.id) === pidRevoke && r.result.executed === false) pass();
    else fail("expected id=" + pidRevoke + ", executed=false, got " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("read non-existent proposal returns null");
  try {
    const r = await read(admin, cid, "read_proposal", [u64Arg(999)]);
    if (r.result === null) pass();
    else fail("expected null");
  } catch (e) { fail(e.message); }

  test("non-admin cannot create proposal (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "create_proposal", [
      addrArg(compA.publicKey()), enumArg("RevokeCertificate", strArg(doc1Hash)),
    ]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("sub-admin A approves (1/2 — not executed)");
  try {
    await call(subA, cid, "approve_proposal", [addrArg(subA.publicKey()), u64Arg(pidRevoke)]);
    const r = await read(admin, cid, "read_proposal", [u64Arg(pidRevoke)]);
    if (r.result && Number(r.result.approvals?.length) === 1 && r.result.executed === false) pass();
    else fail("expected 1 approval, not executed: " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("document still Issued before threshold met");
  try {
    const r = await read(admin, cid, "read_document", [strArg(doc1Hash)]);
    if (r.result && getStatus(r.result.status) === "Issued") pass();
    else fail("expected Issued, got " + (r.result ? getStatus(r.result.status) : "null"));
  } catch (e) { fail(e.message); }

  test("same sub-admin cannot approve twice (must fail)");
  try {
    const status = await callExpectFail(subA, cid, "approve_proposal", [addrArg(subA.publicKey()), u64Arg(pidRevoke)]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("non-sub-admin cannot approve (must fail)");
  try {
    const status = await callExpectFail(compA, cid, "approve_proposal", [addrArg(compA.publicKey()), u64Arg(pidRevoke)]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  test("sub-admin B approves (2/2 — auto-executes, doc→Revoked)");
  try {
    await call(subB, cid, "approve_proposal", [addrArg(subB.publicKey()), u64Arg(pidRevoke)]);
    const r = await read(admin, cid, "read_proposal", [u64Arg(pidRevoke)]);
    if (r.result && r.result.executed === true) pass();
    else fail("expected executed, got " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("document status is Revoked after execution");
  try {
    const r = await read(admin, cid, "read_document", [strArg(doc1Hash)]);
    if (r.result && getStatus(r.result.status) === "Revoked") pass();
    else fail("expected Revoked, got " + (r.result ? getStatus(r.result.status) : "null"));
  } catch (e) { fail(e.message); }

  test("verify revoked doc: verified=false, status=Revoked");
  try {
    const r = await read(admin, cid, "verify_document", [strArg(doc1Hash)]);
    if (!r.result) { fail("null"); return; }
    if (r.result.verified_document === false && getStatus(r.result.certificate_status) === "Revoked") pass();
    else fail("got " + toStr(r.result));
  } catch (e) { fail(e.message); }

  test("approve already-executed proposal (must fail)");
  try {
    const status = await callExpectFail(subA, cid, "approve_proposal", [addrArg(subA.publicKey()), u64Arg(pidRevoke)]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 10. PROPOSALS — UPDATE THRESHOLD
  // ════════════════════════════════════════════════════════
  console.log("\n── 10. Proposals (UpdateThreshold) ──\n");

  test("create UpdateThreshold proposal");
  try {
    const r = await call(subB, cid, "create_proposal", [
      addrArg(subB.publicKey()), enumArg("UpdateThreshold", u32Arg(3)),
    ]);
    const pid = Number(sdk.scValToNative(r.returnValue));
    if (pid > 0) pass();
    else fail("invalid id");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 11. PROPOSALS — CONTRACT UPGRADE
  // ════════════════════════════════════════════════════════
  console.log("\n── 11. Proposals (ContractUpgrade) ──\n");

  test("create ContractUpgrade proposal");
  try {
    const wh = "0f4bae0374cabe088f188087465ccc63e6d30b49a7a8038ae26624450eeefad7";
    const r = await call(admin, cid, "create_proposal", [
      addrArg(admin.publicKey()), enumArg("ContractUpgrade", bytes32Arg(wh)),
    ]);
    const pid = Number(sdk.scValToNative(r.returnValue));
    if (pid > 0) pass();
    else fail("invalid id");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 12. OWNERSHIP TRANSFER
  // ════════════════════════════════════════════════════════
  console.log("\n── 12. Ownership Transfer ──\n");

  test("admin transfers ownership to sub-admin A");
  try {
    await call(admin, cid, "transfer_main_admin", [addrArg(subA.publicKey())]);
    const r = await read(admin, cid, "main_admin_address", []);
    const addr = r.result?.toString();
    if (addr === subA.publicKey()) pass();
    else fail("expected subA, got " + String(addr).substring(0, 20));
  } catch (e) { fail(e.message); }

  test("sub-admin A transfers ownership back to admin");
  try {
    await call(subA, cid, "transfer_main_admin", [addrArg(admin.publicKey())]);
    const r = await read(admin, cid, "main_admin_address", []);
    const addr = r.result?.toString();
    if (addr === admin.publicKey()) pass();
    else fail("expected admin, got " + String(addr).substring(0, 20));
  } catch (e) { fail(e.message); }

  test("transfer to same address (must fail)");
  try {
    const status = await callExpectFail(admin, cid, "transfer_main_admin", [addrArg(admin.publicKey())]);
    if (status === "fail") pass();
    else fail("expected failure");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // 13. PUBLIC READ ACCESS
  // ════════════════════════════════════════════════════════
  console.log("\n── 13. Public Read Functions ──\n");

  test("stranger reads main_admin_address");
  try {
    const r = await read(stranger, cid, "main_admin_address", []);
    if (r.result) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger reads governance_threshold");
  try {
    const r = await read(stranger, cid, "governance_threshold", []);
    if (r.result !== null) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger reads document");
  try {
    const r = await read(stranger, cid, "read_document", [strArg(doc2Hash)]);
    if (r.result) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger verifies document");
  try {
    const r = await read(stranger, cid, "verify_document", [strArg(doc2Hash)]);
    if (r.result) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger reads review");
  try {
    const r = await read(stranger, cid, "read_review", [strArg(doc1Hash), addrArg(subA.publicKey())]);
    if (r.result) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger reads proposal");
  try {
    const r = await read(stranger, cid, "read_proposal", [u64Arg(pidRevoke)]);
    if (r.result) pass();
    else fail("null");
  } catch (e) { fail(e.message); }

  test("stranger checks whitelist");
  try {
    const r = await read(stranger, cid, "is_whitelisted", [addrArg(compA.publicKey())]);
    if (r.result === true) pass();
    else fail("expected true");
  } catch (e) { fail(e.message); }

  test("stranger checks sub-admin");
  try {
    const r = await read(stranger, cid, "is_sub_admin_public", [addrArg(subA.publicKey())]);
    if (r.result === true) pass();
    else fail("expected true");
  } catch (e) { fail(e.message); }

  // ════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════
  console.log("\n══════════════════════════════════════════════");
  console.log(`  ${passCount} passed,  ${failCount} failed  (${passCount + failCount} total)`);
  console.log("══════════════════════════════════════════════\n");

  if (failCount > 0) process.exit(1);
}

main().catch((e) => {
  console.error("\nFATAL:", e.message?.substring(0, 500));
  process.exit(1);
});
