import * as sdk from "@stellar/stellar-sdk";
const xdr = sdk.xdr;
const server = new sdk.rpc.Server("https://soroban-testnet.stellar.org");
const cid = "CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC";
const kp = sdk.Keypair.fromSecret(process.env.MAIN_ADMIN_SECRET);

async function sim(func, args) {
  const invokeArgs = new xdr.InvokeContractArgs({
    contractAddress: new sdk.Address(cid).toScAddress(),
    functionName: func, args,
  });
  const hostFn = xdr.HostFunction.hostFunctionTypeInvokeContract(invokeArgs);
  const opBody = xdr.OperationBody.invokeHostFunction(
    new xdr.InvokeHostFunctionOp({ hostFunction: hostFn, auth: [], footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }) })
  );
  const tx = new sdk.TransactionBuilder(await server.getAccount(kp.publicKey()), { fee: "100000", networkPassphrase: sdk.Networks.TESTNET })
    .addOperation(new xdr.Operation({ body: opBody })).setTimeout(30).build();
  const sim = await server.simulateTransaction(tx);
  if (sim.error) { console.log(`${func}: ERROR - ${sim.error.substring(0,100)}`); return; }
  if (sim.result) {
    const val = sdk.scValToNative(sim.result.retval);
    console.log(`${func}:`, JSON.stringify(val, (k,v) => typeof v === "bigint" ? Number(v) : v));
  }
}

const addrArg = (pub) => new sdk.Address(pub).toScVal();
const strArg = (v) => sdk.nativeToScVal(v, { type: "string" });
const docHash = "e2e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f";

await sim("main_admin_address", []);
await sim("governance_threshold", []);
await sim("is_whitelisted", [addrArg("GBOMJW3SR76M4GZJA6E3HQOQZ2LZ6HCW5FIW6HWGT7OPXSWRBFZIZOOP")]);
await sim("is_sub_admin_public", [addrArg("GAB6B3J2PE3NDVS4GZPJWHTSMYIFSTVIYRKOEYROPGM46A4YJCKCYKQW")]);
await sim("read_document", [strArg(docHash)]);
await sim("read_proposal", [sdk.nativeToScVal(BigInt(1), { type: "u64" })]);
await sim("read_proposal", [sdk.nativeToScVal(BigInt(2), { type: "u64" })]);
await sim("read_review", [strArg(docHash), addrArg("GAB6B3J2PE3NDVS4GZPJWHTSMYIFSTVIYRKOEYROPGM46A4YJCKCYKQW")]);
