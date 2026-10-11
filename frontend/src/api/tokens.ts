// Single source of truth for auth tokens + identity derived from the access JWT.
//
// Storage trade-off (see INTEGRATION_NOTES.md D3):
//   - access token: in memory only (module var) — never persisted.
//   - refresh token: localStorage, so a reload can silently re-auth.
// All access goes through this module so it can be swapped for httpOnly cookies.

import type { Role } from "../mock/types";

const REFRESH_KEY = "aitt.refreshToken";

let accessToken: string | null = null;

/** Backend role strings (regulator_admin is a deprecated alias of sub_admin). */
export type BackendRole =
  | "super_admin"
  | "company_admin"
  | "sub_admin"
  | "regulator_admin";

/** Identity decoded from the access JWT payload — the only user info available
 *  (the backend has no /me endpoint). */
export interface Identity {
  userId: string;
  role: Role;
  companyId?: string;
  regulatorId?: string;
}

export function mapRole(backendRole: string | undefined): Role {
  switch (backendRole) {
    case "super_admin":
      return "admin";
    case "company_admin":
      return "company";
    case "sub_admin":
    case "regulator_admin":
      return "sub_admin";
    default:
      return "public";
  }
}

// --- access token (memory) ---
export function getAccessToken(): string | null {
  return accessToken;
}
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// --- refresh token (localStorage) ---
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}
export function setRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // storage unavailable — memory-only session, still functional until reload.
  }
}

export function setTokens(access: string | null, refresh: string | null): void {
  setAccessToken(access);
  setRefreshToken(refresh);
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

/** base64url-decode a JWT payload segment. No signature check (the backend verifies). */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Derive identity from the current in-memory access token, or null if none/invalid. */
export function currentIdentity(): Identity | null {
  if (!accessToken) return null;
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.sub !== "string") return null;
  return {
    userId: payload.sub,
    role: mapRole(typeof payload.role === "string" ? payload.role : undefined),
    companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
    regulatorId: typeof payload.regulatorId === "string" ? payload.regulatorId : undefined,
  };
}
