import { Keypair } from "@stellar/stellar-sdk";

const FRIENDBOT = "https://friendbot.stellar.org";
const N = 10;

const accounts = [];

for (let i = 1; i <= N; i++) {
  const kp = Keypair.random();
  const pub = kp.publicKey();
  const sec = kp.secret();

  console.log(`[${i}/${N}] Funding ${pub} …`);

  const res = await fetch(`${FRIENDBOT}?addr=${pub}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Friendbot error for account ${i}: ${res.status} ${body}`);
  }

  accounts.push({
    id: `wallet-${String(i).padStart(2, "0")}`,
    publicKey: pub,
    secretKey: sec,
  });

  // small delay so we don't hammer friendbot
  await new Promise((r) => setTimeout(r, 500));
}

// write credentials file
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dir = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dir, "..", "test-accounts.json");
writeFileSync(outPath, JSON.stringify(accounts, null, 2));

console.log(`\nDone! ${N} accounts saved to test-accounts.json`);
