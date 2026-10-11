// Binary + public-verify helpers that don't fit the CRUD hook mould.

import type { DocItem } from "../mock/types";
import { apiGet, apiGetBlob } from "./client";
import { USE_MOCK } from "./config";
import { useMockStore } from "../mock/store";

/** Trigger a browser download of a Blob. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Download a document's stored file (role-scoped). */
export async function downloadDocumentFile(id: string, fallbackName: string): Promise<void> {
  if (USE_MOCK) {
    saveBlob(
      new Blob([`AITT demo file for document ${id}`], { type: "text/plain" }),
      fallbackName,
    );
    return;
  }
  const { blob, filename } = await apiGetBlob(`/documents/${id}/file`);
  saveBlob(blob, filename ?? fallbackName);
}

/**
 * Download a certified document's file from the PUBLIC registry — no auth, so
 * this works for anyone following a certificate link.
 *
 * Uses the registry endpoint rather than the role-scoped `/documents/:id/file`
 * one: the certificate page is public, and an authenticated-only download would
 * fail for exactly the audience the page exists to serve. The backend only
 * serves documents that reached the registry (issued / revoked / expired).
 */
export async function downloadPublicCertificate(
  id: string,
  fallbackName: string,
): Promise<void> {
  if (USE_MOCK) {
    saveBlob(
      new Blob([`AITT demo certificate ${id}`], { type: "text/plain" }),
      fallbackName,
    );
    return;
  }
  const { blob, filename } = await apiGetBlob(`/documents/registry/${id}/file`, {
    anonymous: true,
  });
  saveBlob(blob, filename ?? fallbackName);
}

/** Download a template's .docx. */
export async function downloadTemplate(id: string, fallbackName: string): Promise<void> {
  if (USE_MOCK) {
    saveBlob(
      new Blob([`AITT demo template ${id}`], { type: "text/plain" }),
      fallbackName,
    );
    return;
  }
  const { blob, filename } = await apiGetBlob(`/templates/${id}/download`);
  saveBlob(blob, filename ?? fallbackName);
}

export interface VerifyResult {
  verified: boolean;
  hash: string;
  certificateStatus?: string;
  onChain?: boolean;
  expiry?: string | null;
  document: DocItem | null;
}

/** Public verify-by-hash. Returns a not-found result rather than throwing on 404. */
export async function verifyByHash(hash: string): Promise<VerifyResult> {
  if (USE_MOCK) {
    const doc = useMockStore
      .getState()
      .documents.find((d) => d.hash.toLowerCase() === hash.toLowerCase());
    return {
      verified: !!doc && doc.status === "issued",
      hash,
      certificateStatus: doc?.status,
      onChain: !!doc?.txHash,
      expiry: doc?.expiryAt ?? null,
      document: doc ?? null,
    };
  }
  try {
    return await apiGet<VerifyResult>(`/documents/verify/${hash}`);
  } catch {
    // A 404/handled error means "no such document" — a valid verification outcome.
    return { verified: false, hash, document: null };
  }
}
