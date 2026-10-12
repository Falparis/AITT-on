import * as sdk from "@stellar/stellar-sdk";

const server = new sdk.rpc.Server("https://soroban-testnet.stellar.org");
const cid = "CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC";

try {
  const addr = new sdk.Address(cid);
  const key = sdk.xdr.LedgerKey.contractData(
    new sdk.xdr.LedgerKeyContractData({
      contract: addr.toScAddress(),
      key: sdk.xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: sdk.xdr.ContractDataDurability.persistent(),
    })
  );
  const entry = await server.getLedgerEntries(key);
  console.log("getLedgerEntries entries:", entry.entries?.length);
  if (entry.entries?.length > 0) {
    console.log("Contract IS on ledger");
  }

  // Also try fetching the contract code
  const codeKey = sdk.xdr.LedgerKey.contractCode(
    new sdk.xdr.LedgerKeyContractCode({
      hash: Buffer.from("0f4bae0374cabe088f188087465ccc63e6d30b49a7a8038ae26624450eeefad7", "hex"),
    })
  );
  const codeEntry = await server.getLedgerEntries(codeKey);
  console.log("WASM on ledger:", codeEntry.entries?.length > 0);
  if (codeEntry.entries?.length > 0) {
    const wasm = codeEntry.entries[0].data.contractCode().code();
    console.log("WASM size:", wasm.length, "bytes");
  }
} catch (e) {
  console.log("Error:", e.message?.substring(0, 300));
}

// Now try StellarExpert API
try {
  const resp = await fetch(`https://api.stellar.expert/explorer/public/contract/${cid}`);
  const data = await resp.json();
  console.log("\nStellarExpert API:", JSON.stringify(data, null, 2).substring(0, 500));
} catch (e) {
  console.log("\nStellarExpert Error:", e.message?.substring(0, 200));
}
