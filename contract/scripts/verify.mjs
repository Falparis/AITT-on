import * as sdk from "@stellar/stellar-sdk";
const xdr = sdk.xdr;
const server = new sdk.rpc.Server("https://soroban-testnet.stellar.org");
const cid = "CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC";

// Check if contract code exists on ledger
try {
  const code = await server.getContractWasmByContractId(cid);
  console.log("Contract WASM found:", !!code);
} catch(e) { console.log("WASM lookup:", e.message); }

// Try reading the admin address (simulation)
const kp = sdk.Keypair.fromSecret(process.env.MAIN_ADMIN_SECRET);
const source = await server.getAccount(kp.publicKey());

const invokeArgs = new xdr.InvokeContractArgs({
  contractAddress: new sdk.Address(cid).toScAddress(),
  functionName: "main_admin_address",
  args: [],
});
const hostFn = xdr.HostFunction.hostFunctionTypeInvokeContract(invokeArgs);
const opBody = xdr.OperationBody.invokeHostFunction(
  new xdr.InvokeHostFunctionOp({ hostFunction: hostFn, auth: [], footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }) })
);
const tx = new sdk.TransactionBuilder(source, { fee: "100000", networkPassphrase: sdk.Networks.TESTNET })
  .addOperation(new xdr.Operation({ body: opBody })).setTimeout(30).build();

const sim = await server.simulateTransaction(tx);
console.log("Sim status:", sim.status);
console.log("Has error:", !!sim.error);
if (sim.error) console.log("Error:", sim.error.substring(0, 200));
if (sim.result) {
  const val = sdk.scValToNative(sim.result.retval);
  console.log("main_admin_address:", val);
}
