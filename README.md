# On-chain Document Verification — AITT Compliance Platform

A Stellar/Soroban-powered compliance certification platform that lets companies register documents on-chain, go through structured review workflows, and receive blockchain-verified certificates — all without requiring crypto wallets or blockchain knowledge from end users.

---

## Live Links

| Resource | URL |
|----------|-----|
| Backend |  https://api.aitt-transparency.com/
| Frontend | https://aitt-transparency.com/ |
| Smart Contract | https://stellar.expert/explorer/testnet/contract/CBOCCS4EYS5WV273UJRHBM6QN4NGBV5Y4EGKON3UYBBEQ62LVHV3ZMLS |

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

```
├── src/
│   ├── server.js                  # Entry point
│   ├── app.js                     # Express app
│   ├── config/                    # Environment validation
│   ├── controllers/               # Route handlers
│   ├── middlewares/                # Auth, audit, rate-limiting
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # API routes (/api/v1)
│   ├── services/
│   │   ├── sorobanAdapter/        # Single seam for all chain access
│   │   ├── document.service.js    # Workflow lifecycle
│   │   ├── indexer.service.js     # Write-through DB mirroring
│   │   └── ...
│   └── utils/                     # Helpers, status maps, serializers
├── frontend/                      # React SPA
├── docs/                          # Guides, OpenAPI spec, Postman collections
├── Technical Documentation.docx   # Full technical document
└── README.md                      # This file
```

---

## Running Locally

```bash
# Backend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:4000

# Frontend
cd frontend
npm install
npm run dev             # starts on http://localhost:5173
```

---

## Testing

```bash
npm test                # unit + integration tests (stub adapter)
npm run test:live       # live tests against real Soroban contract
```

---

## Documentation

- **Technical Documentation.docx** — full technical document (smart contract, backend, dashboard)
- **docs/API.md** — API endpoints and security details
- **docs/openapi.yaml** — OpenAPI 3.0 specification
- **docs/soroban-adapter-spec.md** — Soroban adapter interface and parity guarantee
- **docs/guide-*.html** — role-specific user guides (admin, company, expert, public)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | JWT signing secret |
| `KEY_ENCRYPTION_SECRET` | AES-256-GCM encryption for wallet secrets (production) |
| `SOROBAN_ADAPTER` | `stub` (default) or `real` |
| `RPC_URL` | Soroban RPC endpoint (required for real adapter) |
| `CONTRACT_ID` | Deployed contract ID (required for real adapter) |
| `STORAGE_DRIVER` | `auto` / `disk` / `gridfs` / `memory` |

---

## License

Private — AITT (AI Transparency Token)
