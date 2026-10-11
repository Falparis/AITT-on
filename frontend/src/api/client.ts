// Typed fetch wrapper around the backend. Responsibilities:
//   - prefix API_BASE_URL, attach Bearer access token
//   - unwrap the { success, data, message? } envelope centrally
//   - throw a normalized ApiError on failure
//   - one transparent refresh-on-401 (single-flight), then retry once
//
// No axios — plain fetch. Never logs tokens or bodies.

import { API_BASE_URL } from "./config";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokens";
import { ApiError } from "./types";
import type { Pagination } from "./types";

interface RequestOptions {
  method?: string;
  /** JSON body — serialized automatically. Mutually exclusive with `form`. */
  body?: unknown;
  /** multipart/form-data body (file uploads). */
  form?: FormData;
  /** query params appended to the URL. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Skip the Authorization header + refresh retry (auth endpoints). */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

// --- single-flight refresh: concurrent 401s share one refresh call ---
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(buildUrl("/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) {
          clearTokens();
          return false;
        }
        const json = (await res.json()) as {
          success?: boolean;
          data?: { access?: string; refresh?: string };
        };
        const access = json?.data?.access;
        const newRefresh = json?.data?.refresh;
        if (!json?.success || !access) {
          clearTokens();
          return false;
        }
        setTokens(access, newRefresh ?? refresh);
        return true;
      } catch {
        // Network error during refresh — keep tokens, let caller surface the error.
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function rawFetch(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!opts.form) headers["Content-Type"] = "application/json";
  headers["Accept"] = "application/json";
  if (!opts.anonymous) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    signal: opts.signal,
  });
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let details: unknown;
  try {
    const json = await res.json();
    if (json && typeof json === "object") {
      if (typeof (json as { message?: unknown }).message === "string") {
        message = (json as { message: string }).message;
      }
      details = (json as { details?: unknown }).details;
    }
  } catch {
    // non-JSON error body — keep statusText.
  }
  return new ApiError(message, res.status, details);
}

/** Perform a request, transparently refreshing once on 401. Returns the raw Response. */
async function request(path: string, opts: RequestOptions): Promise<Response> {
  let res = await rawFetch(path, opts);
  if (res.status === 401 && !opts.anonymous && getRefreshToken()) {
    const ok = await refreshAccessToken();
    if (ok) res = await rawFetch(path, opts);
  }
  return res;
}

/** Unwrap the envelope, returning `data`. Throws ApiError on failure. */
async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as { success?: boolean; data?: T; message?: string };
  if (json && json.success === false) {
    throw new ApiError(json.message ?? "Request failed", res.status, json);
  }
  return json.data as T;
}

// --- public helpers ---

export async function apiGet<T>(path: string, opts: Omit<RequestOptions, "method" | "body" | "form"> = {}): Promise<T> {
  return unwrap<T>(await request(path, { ...opts, method: "GET" }));
}

export async function apiPost<T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
  return unwrap<T>(await request(path, { ...opts, method: "POST", body }));
}

export async function apiPut<T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
  return unwrap<T>(await request(path, { ...opts, method: "PUT", body }));
}

export async function apiDelete<T>(path: string, opts: Omit<RequestOptions, "method"> = {}): Promise<T> {
  return unwrap<T>(await request(path, { ...opts, method: "DELETE" }));
}

/** POST multipart/form-data (file uploads). */
export async function apiPostForm<T>(path: string, form: FormData, opts: Omit<RequestOptions, "method" | "body" | "form"> = {}): Promise<T> {
  return unwrap<T>(await request(path, { ...opts, method: "POST", form }));
}

/** List endpoints return `data` plus a sibling `pagination`. */
export async function apiGetPaginated<T>(path: string, opts: Omit<RequestOptions, "method" | "body" | "form"> = {}): Promise<{ data: T; pagination?: Pagination }> {
  const res = await request(path, { ...opts, method: "GET" });
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as { success?: boolean; data?: T; pagination?: Pagination; message?: string };
  if (json && json.success === false) {
    throw new ApiError(json.message ?? "Request failed", res.status, json);
  }
  return { data: json.data as T, pagination: json.pagination };
}

/** Fetch a binary payload (file/template download) as a Blob. */
export async function apiGetBlob(path: string, opts: Omit<RequestOptions, "method" | "body" | "form"> = {}): Promise<{ blob: Blob; filename?: string }> {
  const res = await request(path, { ...opts, method: "GET" });
  if (!res.ok) throw await parseError(res);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^;"']+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : undefined;
  return { blob, filename };
}
