# On-chain Document Verification — AITT Compliance Platform

A Stellar/Soroban-powered compliance certification platform that lets companies register documents on-chain, go through structured review workflows, and receive blockchain-verified certificates — all without requiring crypto wallets or blockchain knowledge from end users.

---

## Live Links

| Resource | URL |
|----------|-----|
| Backend | https://soroban-backend.duckdns.org/ |
| Frontend | https://aitt-transparency.com/ |
| Smart Contract | https://stellar.expert/explorer/testnet/contract/CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC |

---

## How It Works

1. **Company registers** on the platform (name + email, no crypto needed).
2. **Main Admin approves** the company — whitelisting it on-chain automatically.
3. **Main Admin creates a Workflow** by selecting a Company, a Compliance Program, and a Reviewer.
4. **Reviewer assesses** the documentation (collected externally via Airtable, Google Drive, etc.), adds comments, and assigns a **compliance score (0–100)**.
5. **Main Admin issues the certificate** — uploads the final certificate PDF, clicks Issue, and a blockchain proof is created.
6. **Certificate appears in the public registry** — anyone can verify it using the document hash.

---

## Key Concepts

### Compliance Programs
Reusable templates that define what gets certified — program name, service type (Expert Support or Self-Service), jurisdiction (EU/US), and description. Managed by the Main Admin.

### Workflows
Each workflow is an active certification case for a company. Created by selecting a company, a compliance program, and a reviewer. No file upload at this stage — supporting docs stay external.

### Certificates
Completed certifications with blockchain proof. Visible in the public registry with a download button.

---

## No-Crypto Model

Companies and reviewers **never need a crypto wallet, never hold any crypto, and never pay any blockchain fees.** Everyone logs in with email and password. One central AITT account covers all blockchain fees automatically and invisibly. The cost per action is a tiny fraction of a cent.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Soroban (Stellar testnet) |
| Backend | Node.js, Express.js, MongoDB |
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Auth | JWT (access + refresh tokens) |
| Storage | GridFS / Disk / Memory (pluggable) |
| Blockchain Integration | Stellar SDK with stub/real adapter |

---

## Roles

| Role | What They Can Do |
|------|-----------------|
| **Super Admin** | Full access — manage companies, programs, workflows, issue certificates, governance |
| **Company User** | Register, view own workflows and certificates, download certificates |
| **Regulator (Compliance Officer)** | Review workflows, submit scores and comments, vote on governance proposals |
| **Public** | Search companies, view certificates, verify document hashes on-chain |

---

## Project Structure

This repository contains the full source of all three parts: smart contract, backend and frontend.

```
├── contract/                        # Soroban smart contract (Rust)
│   ├── contracts/document_verification_system/src/lib.rs
│   ├── Cargo.toml / Cargo.lock      # pinned build for a reproducible WASM hash
│   ├── scripts/                     # deploy + testnet test scripts (Node)
│   ├── README.md                    # functions, build steps, expected WASM hash
│   ├── GOVERNANCE.md                # key custody + quorum policy
│   └── GOVERNANCE-TESTNET-PROOF.md  # multisig governance transactions on testnet
├── backend/                         # Node.js / Express / MongoDB API (/api/v1)
│   ├── src/
│   │   ├── server.js, app.js        # entry point, Express app
│   │   ├── config/                  # environment validation
│   │   ├── controllers/, routes/    # route handlers, API routes
│   │   ├── middlewares/             # auth, audit, rate-limiting
│   │   ├── models/                  # Mongoose schemas
│   │   ├── services/
│   │   │   ├── sorobanAdapter/      # single seam for all chain access (stub / real)
│   │   │   ├── jobs/                # expiry, treasury balance
│   │   │   └── ...                  # documents, governance, indexer, outbox
│   │   └── utils/
│   ├── __tests__/                   # unit, integration and live tests
│   ├── docs/                        # API docs, OpenAPI spec, Postman collections
│   └── Technical Documentation.docx
├── frontend/                        # React / TypeScript / Vite SPA
│   └── src/                         # pages, components, API client, hooks
├── docs/screenshots/                # compliance monitoring screenshots
└── README.md                        # this file
```

---

## Running Locally

```bash
# Backend (needs MongoDB)
cd backend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:4000

# Frontend (proxies /api to the backend)
cd frontend
npm install
npm run dev             # starts on http://localhost:5173

# Smart contract
cd contract
cargo test              # unit tests
stellar contract build  # builds the WASM, prints its hash
```

---

## Testing

```bash
cd backend
npm test                # unit + integration tests (stub adapter)
npm run test:live       # live tests against the real Soroban contract

cd contract
cargo test              # contract unit tests
```

---

## Documentation

- **contract/README.md** — contract functions, governance rules, build and WASM hash reproduction
- **contract/GOVERNANCE.md** — who holds the keys, quorum policy
- **contract/GOVERNANCE-TESTNET-PROOF.md** — multisig governance transactions on testnet
- **backend/Technical Documentation.docx** — full technical document (smart contract, backend, dashboard)
- **backend/docs/API.md** — API endpoints and security details
- **backend/docs/openapi.yaml** — OpenAPI 3.0 specification
- **backend/docs/soroban-adapter-spec.md** — Soroban adapter interface and parity guarantee
- **backend/DEPLOYMENT.md** — deployment runbook
- **docs/screenshots/** — compliance monitoring screens

---

## Environment Variables

Backend (`backend/.env`):

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | JWT signing secret |
| `KEY_ENCRYPTION_SECRET` | AES-256-GCM encryption for custodial wallet secrets (required in production) |
| `SOROBAN_ADAPTER` | `stub` (default) or `real` |
| `RPC_URL` | Soroban RPC endpoint (required for real adapter) |
| `CONTRACT_ID` | Deployed contract ID (required for real adapter) |
| `SERVICE_SECRET` | Main admin key; signs admin actions and pays all fees (required for real adapter) |
| `SPONSOR_FEES` | `true` — main admin sponsors user accounts and pays every fee |
| `STORAGE_DRIVER` | `auto` / `disk` / `gridfs` / `memory` |

Frontend: `VITE_API_BASE_URL` (default `/api/v1`), `VITE_USE_MOCK` (`true` runs on built-in demo data).

---

## License

Private — AITT (AI Transparency Token)
