// Auth service: login / company self-register / session bootstrap / logout.
// Identity is derived by decoding the access JWT (the backend has no /me endpoint).

import { apiPost } from "./client";
import {
  clearTokens,
  currentIdentity,
  getRefreshToken,
  setTokens,
} from "./tokens";
import type { Identity } from "./tokens";
import { ApiError } from "./types";
import type { Company } from "../mock/types";

interface LoginResponse {
  access: string;
  refresh: string;
  role: string;
}

export async function login(email: string, password: string): Promise<Identity> {
  const data = await apiPost<LoginResponse>(
    "/auth/login",
    { email, password },
    { anonymous: true },
  );
  setTokens(data.access, data.refresh);
  const id = currentIdentity();
  if (!id) {
    clearTokens();
    throw new ApiError("Login succeeded but the session token was invalid.", 500);
  }
  return id;
}

export interface CompanyRegisterInput {
  name: string;
  email: string;
  password: string;
  wallet?: string;
}

/** Public company self-registration → PENDING company + company_admin login. */
export async function registerCompany(input: CompanyRegisterInput): Promise<Company> {
  return apiPost<Company>("/companies/register", input, { anonymous: true });
}

/** On reload: exchange the stored refresh token for a fresh access token. */
export async function bootstrapSession(): Promise<Identity | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const data = await apiPost<{ access: string; refresh?: string }>(
      "/auth/refresh",
      { refreshToken: refresh },
      { anonymous: true },
    );
    setTokens(data.access, data.refresh ?? refresh);
    return currentIdentity();
  } catch {
    clearTokens();
    return null;
  }
}

export function logout(): void {
  clearTokens();
}
