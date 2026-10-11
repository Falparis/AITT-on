// Shared helpers for the mock data layer.
// These simulate the things a real backend / chain would provide:
// latency, content hashes, transaction hashes and wallet addresses.
//
// NOTE: the formatting/link helpers at the bottom (shortHash, formatDate,
// explorerUrl) are used by the REAL pages too, not just the mock layer — so
// they must behave correctly against live data.

import { STELLAR_NETWORK } from "../api/config";

/** Simulate network/processing latency. */
export function sleep(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random lowercase hex string of the given length. */
export function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** A fake 64-char (256-bit) transaction hash, e.g. for an "on-chain" anchor. */
export function fakeTxHash(): string {
  return randomHex(64);
}

/** A fake SHA-256 digest (64 hex chars). Used when a file is "hashed". */
export function fakeSha256(): string {
  return randomHex(64);
}

/** A fake Stellar-style wallet address (G + 55 base32 chars). */
export function fakeWallet(): string {
  const base32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "G";
  for (let i = 0; i < 55; i++) {
    out += base32[Math.floor(Math.random() * base32.length)];
  }
  return out;
}

/** Unique-ish id with a readable prefix. */
export function genId(prefix: string): string {
  return `${prefix}-${randomHex(8)}`;
}

/** ISO timestamp for "now". */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Format an ISO date for display. */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Truncate a long hash/wallet for compact display. */
export function shortHash(value?: string, lead = 8, tail = 6): string {
  if (!value) return "—";
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/**
 * Public block-explorer URL for a transaction hash.
 *
 * The network segment comes from STELLAR_NETWORK, NOT a hardcoded "public".
 * This used to always say "public" (Stellar's name for MAINNET) because the
 * helper was written for simulated mock hashes, where the link was never
 * followed. Against a real testnet deployment every link 404'd with
 * "Transaction not found on Stellar Network" — which, on a page whose whole
 * purpose is proving authenticity, looks like the certificate is forged.
 */
export function explorerUrl(txHash: string): string {
  return `https://stellar.expert/explorer/${STELLAR_NETWORK}/tx/${txHash}`;
}

/** Explorer URL for an account/wallet address. */
export function explorerAccountUrl(address: string): string {
  return `https://stellar.expert/explorer/${STELLAR_NETWORK}/account/${address}`;
}

/** Explorer URL for the deployed Soroban contract. */
export function explorerContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/${STELLAR_NETWORK}/contract/${contractId}`;
}

/** Trigger a dummy client-side file download (no network). */
export function downloadDummyFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
