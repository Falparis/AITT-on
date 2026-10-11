/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the backend API, e.g. "/api/v1" (dev-proxied) or "https://host/api/v1". */
  readonly VITE_API_BASE_URL?: string;
  /** "true" runs the app entirely on in-memory mock data with no backend. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
