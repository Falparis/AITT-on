# Frontend ↔ Backend Integration Notes

Living decision log for wiring `frontend-aitt` (Vite/React SPA, previously mock-only)
to the real backend (`../backend`, Express + MongoDB wrapping a Soroban contract).

Autonomy contract: decide-and-document, don't ask. Every non-obvious choice lands here.

---

## Ground truth discovered during recon (verified against code, not the OpenAPI)

- **Pages don't touch the zustand store directly** — they call react-query wrappers in
  `src/hooks/useMockData.ts`. That file is the exact contract to mirror. Only `RegisterPage`
  used `useMockStore` directly.
- **Backend base path is `/api/v1`** (`backend/src/app.js`). CORS already allows
  `http://localhost:5173` (Vite dev) and `http://localhost:4173` (preview) — hard-coded, no env.
- **Login response is `{ success, data: { access, refresh, role } }`** — token fields are
  `access` / `refresh` (NOT `accessToken`/`refreshToken`). There is **no `user` object and no
  `/me` endpoint anywhere.** The JWT payload carries `{ sub, role, companyId, regulatorId }`, so
  the frontend derives identity by **decoding the access JWT**, not from an API call.
- **Backend roles**: `super_admin | company_admin | sub_admin` (`regulator_admin` = deprecated
  alias of `sub_admin`). Mapping to frontend `Role`:
  `super_admin→admin`, `company_admin→company`, `sub_admin`/`regulator_admin`→`sub_admin`,
  unauthenticated→`public`.
- **Envelope**: `{ success, data, message? }`. **Pagination is a SIBLING of `data`**:
  `{ success, data:[…], pagination:{ currentPage, totalPages, total, limit } }`.
- **Shapes match the frontend `mock/types.ts` closely** (DocItem/Company/SubAdmin/Proposal/
  Framework/Template/Alert). Watch-outs the client must tolerate:
  - Optional fields (`complianceScore`, `expiryAt`, `txHash`, `targetRef`) are **omitted** when unset.
  - Some "required" fields can come back **null** (`filename`, `company`, `email`, `wallet`, `docId`).
  - `review.decision` and `proposal.type` are lowercase snake_case (already what the FE types use).
- **Mongo is hard-required** for `npm start` (no in-memory server option); fails fast without it.
  Docker is NOT available on this machine. See "Running / verifying" below.

---

## Decisions

### D1 — Mock/real switch via a barrel (Requirement G)
`src/hooks/data.ts` re-exports **either** the mock hooks (`useMockData.ts`, kept intact as the
offline fallback) **or** the real API hooks (`src/hooks/api/`), chosen once at module load by
`import.meta.env.VITE_USE_MOCK === "true"`. Every page imports from `@/hooks/data`. Both modules
export the identical hook names and signatures so a page never knows which layer it's on.
`VITE_USE_MOCK` unset/`false` ⇒ real backend (default). `true` ⇒ no network, runs on seed data.

### D2 — Hook contract tweaks to make one signature serve both layers
A few mock signatures encoded things the real backend derives server-side. Both layers were
aligned to the real-world contract (the mock hooks were updated to keep the offline path faithful):
- `useSubmitDocument({ file, subject, filename? })` — takes the **File** (backend re-hashes it;
  the client SHA is not trusted). Mock computes a real SHA-256 of the file to stay realistic.
- `useIssueCertificate({ docId, expiryAt? })` — dropped the client `txHash` (chain returns it).
- `useCreateProposal({ type, title, description?, targetRef?, payload? })` — dropped `createdBy`
  (backend derives it from the JWT).
- `useSignProposal({ id })` — signs **as the current user** (backend reads the signer from the
  JWT). **Auto-executes at threshold** in both layers, so the manual "Execute" step is gone
  (mirrors the deployed contract: create ≠ sign, threshold auto-executes).

### D3 — Token storage trade-off
Access token: **in memory only** (module variable) — never persisted, dies on reload.
Refresh token: **`localStorage`** so a reload can silently re-auth (`/auth/refresh` → new access
JWT → decode role/identity). Trade-off: a `localStorage` refresh token is reachable by XSS; the
mitigation is that the backend **rotates refresh tokens single-use with reuse-detection** (a stolen,
already-rotated token nukes the session). All storage goes through `src/api/tokens.ts` so it can be
swapped for httpOnly cookies if the backend ever sets them. On reload with a refresh token present
we call `/auth/refresh` before rendering guarded routes.

### D4 — Auth feeds RoleContext; "View as" switcher survives only in mock mode
`AuthProvider` owns tokens + derived identity. In **real mode** `useRole()` returns the role decoded
from the JWT and the header shows a real account menu (sign out); the demo "View as" switcher is
hidden. In **mock mode** the original localStorage "View as" switcher is preserved as a dev aid.
Route guards (`<Protected roles>`) redirect unauthenticated/ュunauthorized users to `/signin` in real
mode; in mock mode guards are permissive (any role viewable) so the demo keeps working.

### D5 — Public verify uses the real endpoint, not the ICP mock
`VerificationPage` is a genuine product surface. It kept its real browser SHA-256 and was rewired
from the always-succeeds ICP mock (`useVerifyDocument`) to the public
`GET /api/v1/documents/verify/:hash`, handling real not-found / revoked / expired results.

### D6 — Frameworks are governance-only; templates keep direct CRUD
Backend frameworks are read-only (writes go through `framework_update` proposals). In real mode
`AdminFrameworksPage` shows frameworks read-only with a **"Propose framework update"** action that
creates a `framework_update` proposal; templates keep real `POST/PUT/DELETE /templates`. Mock mode
keeps the original direct framework CRUD.

### D7 — Governance settings: N editable, signers derived
`M` (total signers) is the active-sub-admin count on the backend and isn't directly editable;
`PUT /governance` only sets `N` (1 ≤ N ≤ M). In real mode `GovernanceSettingsPage` edits N and shows
signer wallets read-only; the add/remove-signer-wallet UI is shown only in mock mode.

### D8 — Legacy ICP pages: kept, labelled "Demo — not connected", pulled from primary nav
`/library`, `/compliance`, `/ai-assistant`, `/cybersecurity`, `/cybersecurity-assistant`, `/ai-risk`
have **no backend**. They already run on a self-contained mock actor (no `@dfinity` deps), so they
compile and run. Decision: **do not fake-wire them.** They get a visible "Demo — not backed by the
live API" banner and are removed from the real-mode primary nav (which becomes the real public
surfaces: Home, Registry, Verification). Reachable by URL for reference. See `// TODO(integration)`.

---

## Known backend gaps / worked around (not blockers)
- **No current-user profile/name.** "My Reviews" can't filter to *only mine* by reviewer name in
  real mode (JWT has no name). Worked around by showing the reviewer's accessible reviews with a
  `// TODO(integration)` note; needs a `/me` or a reviewer-identity field on the backend.
- `GET /companies/with-users` and `POST /companies` return raw (unserialized) docs — the frontend
  only uses the serialized `POST /companies/register`, `/approve`, `DELETE`, and `GET /companies`.

## Verification results (2026-07-03)

- `npm run typecheck` — clean. `npm run build` — clean (one pre-existing large-bundle warning).
- Every module transforms through Vite with no errors; both real and mock dev servers serve 200.
- **Full-stack e2e (`integration/e2e.mjs`) against the live backend: 38/38 checks, run 4× deterministically.**
  It replays the exact endpoints + payloads the frontend hooks use and drives all four roles:
  - **admin**: login → JWT decodes `super_admin` → refresh → approve company → invite + activate
    sub-admin → issue certificate (review-gated) → governance GET/PUT (1≤N≤M) → create proposal
    (starts 0 approvals) → auto-executes at threshold.
  - **company**: register (public) → admin-approve → login (`company_admin`) → submit document
    (multipart, server re-hashed) → own document appears in the role-scoped, paginated list.
  - **sub_admin**: invite → activate → login (`sub_admin`) → review (decision + 0–100 score) →
    doc becomes `approved`, review recorded, overall score set.
  - **public**: verify-by-hash (no auth) → returns the document + `verified:true`.
- **Live browser path proven**: `POST http://localhost:5173/api/v1/auth/login` **through the Vite dev
  proxy** returns real `{ access, refresh, role }` from the Express backend (stub adapter, in-mem Mongo).
- Not automated: a headless-browser render pass (Playwright is not installed in this environment).
  Coverage is instead: tsc + build + per-module Vite transform + full API e2e + live proxied login.

## Running / verifying
- Backend needs Mongo. No Docker here. Verify plan: a hermetic dev launcher that boots the backend
  with `mongodb-memory-server` (already a backend devDependency) + `SOROBAN_ADAPTER=stub`, seeds a
  super_admin, then drives all four role paths. Falls back to the committed Atlas `.env` if needed.
  Final read/verify pass against `SOROBAN_ADAPTER=real` per the stub-for-dev decision (flagged).
