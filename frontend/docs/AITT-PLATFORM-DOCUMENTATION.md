# On-chain Document Verification — AITT Compliance Platform

A Stellar/Soroban-powered compliance certification platform that lets companies register documents on-chain, go through structured review workflows, and receive blockchain-verified certificates — all without requiring crypto wallets or blockchain knowledge from end users.

---

## Contract

**Contract:** https://stellar.expert/explorer/testnet/contract/CA6KYPPXEUTAPa4X6JAEOI37OD2SCKEAUOSV2VN5ICDWCAI4WASFHRSYB

**Certificates Hashed on Stellar:**

- https://aitt-transparency.com/certificate/6a7c5c3db0db442ffc199fa4
- https://stellar.expert/explorer/testnet/tx/d39b84607072ba854e92f7b464286588efe6a7ee9dc15325732424582e5907da
- https://aitt-transparency.com/certificate/6a7c4bf63518e6288b2eab8d
- https://stellar.expert/explorer/testnet/tx/943fa614df295ce9efdbdb8d97ff6661edba2fe0efcaf6174b3f4bcaae1b188b

**Backend URL:** https://soroban-backend.duckdns.org/

**Frontend Dashboard:**
- Old version: https://verify991.netlify.app/
- Current version: https://aitt-transparency.com/

---

## Smart Contract (Soroban)

### Purpose
- Store and verify SHA-256 file hashes on-chain.
- Allow public verification by submitting a file hash.
- Support a whitelisting mechanism so authorized users (regulators / super admins) can upload hashes on behalf of organizations.

### Key Capabilities
- **Upload hash:** Accepts a SHA-256 hash and metadata. Rejects duplicates.
- **Verify hash:** Public function — anyone can query/verify by supplying a SHA-256 hash.
- **Whitelist management:** Maintain a list of accounts that are permitted to call upload functions. Owner can manage promotions.
- **Multi-signature governance:** Proposals (revoke certificate, update threshold) require N-of-M compliance officer approvals and auto-execute when the threshold is met.
- **Event/log emission:** Emit events on upload for off-chain indexing.

### Deployment Artifacts
- WASM hash: `e836409658d0e6cb88ba8a3665aa0ca4082dad7a53be3fdf9ad1e71774c18e80`
- Contract ID: `CA6KYPPXEUTAPa4X6JAEOI37OD2SCKEAUOSV2VN5ICDWCAI4WASFHRSYB`
- Deployment tx hash: `06fbcdccee43f3925b6c9a8bae59b4df8718e95137c52e1bf06afebf1f290b16`
- Reference document: Project spec & Soroban contract details — https://docs.google.com/document/d/14VZCiTyoC6Q8gI3bf4f46YRp7oigrRuNqc-_DGz6Eu8/edit?tab=t.0

### Security & Design Notes
- Use exact 32-byte SHA-256 format for all inputs; validate length in contract.
- Reject duplicate hashes to avoid overwriting; return existing record when duplicate uploaded.
- Keep metadata minimal on-chain (uploader role, timestamp, off-chain DB id) to control storage costs.
- Sign transactions with whitelisted accounts' private keys (backend signs on behalf of regulator when authorized).

---

## Backend (Express.js)

### Purpose

Provide authentication, role management, and higher-level orchestration between the frontend and the Soroban contract. Hash files (SHA-256) server-side, store file artifacts, forward hash uploads to the smart contract, and persist certificate records in the DB.

### Core Features

**User & Company Registration:**
- Sign up companies and company users; initial role is `company_user`.
- Super admin can promote `company_user` to `regulator` or `admin` via protected endpoint.

**Workflows & Certification (replaces the old "Documents" flow):**
- "Documents" is now called **Workflows** — each workflow represents one certification case for a company.
- Workflows are created with three inputs: **Company**, **Compliance Program**, and **Reviewer**. No file upload at this stage.
- Supporting documentation stays outside the platform (Airtable, Google Drive, SharePoint, etc.). The platform manages only the certification process itself.

**Compliance Programs:**
- Reusable templates that define certification parameters: **Program Name**, **Service Type** (Expert Compliance Support or Self-Service), **Jurisdiction** (EU, US), and **Description**.
- Only the Main Admin can create, edit, or archive programs.
- When a workflow is created, the selected Compliance Program automatically fills in the service type and jurisdiction — no manual entry needed.

**Review & Scoring:**
- A reviewer adds comments and assigns a **compliance score (0–100)** to each workflow.
- Each compliance officer gets one review per workflow (latest review wins).
- The Main Admin can also review, adjust comments, and modify the compliance score.

**Certificate Issuance:**
- When the review is complete, the Main Admin uploads the **Final Certificate PDF** and clicks **Issue**.
- The certificate becomes official, a blockchain proof is created, and it appears in the public registry.
- The Certificates page is a clean registry of completed certifications, each with a **Download** button.

**Public Verification:**
- Any user (unauthenticated or authenticated) can submit a hash to the verify endpoint, which queries the chain and DB and returns results.

**File Storage & Retrieval:**
- Stored files (png, pdf, docx, etc.) are served via authenticated, role-scoped endpoints only.

**JWT Authentication:**
- Role-based JWT tokens for `company_user`, `regulator`, `super_admin`.

**Protected Routes:**
- Middleware enforces roles and whitelist checks where needed.

### Important Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register company user + company |
| `/api/auth/login` | POST | Public | Returns JWT |
| `/api/admin/promote` | POST | Super Admin | Promote user to regulator |
| `/api/workflows` | POST | Company Admin / Super Admin | Create workflow (select company + program + reviewer) |
| `/api/workflows/:id/review` | POST | Reviewer / Super Admin | Submit review with comments and score |
| `/api/workflows/:id/issue` | POST | Super Admin | Upload final certificate PDF and issue |
| `/api/workflows/completed` | GET | Authenticated | List completed certifications (registry) |
| `/api/compliance-programs` | GET/POST | Authenticated / Admin | List or create compliance programs |
| `/api/documents/verify` | POST | Public | Verify a document hash on-chain |
| `/api/companies` | GET | Authenticated | List companies with certificate counts |
| `/api/companies/register` | POST | Public | Company self-registration |
| `/api/companies/:id/approve` | POST | Super Admin | Approve and whitelist company on-chain |

### Typical Workflow Flow

1. Main Admin defines a **Compliance Program** (template).
2. A **Workflow** is created by selecting a Company, a Compliance Program, and a Reviewer.
3. Supporting documentation is collected externally (Airtable, Google Drive, etc.).
4. The assigned Reviewer reviews the documentation, adds **comments** and a **compliance score (0–100)**.
5. The Main Admin reviews the assessment, adjusts if needed, uploads the **Final Certificate PDF**, and clicks **Issue**.
6. The certificate is anchored on-chain, becomes publicly verifiable, and appears in the **Certificates Registry**.

### Security & Ops
- Store signer private keys securely using environment variables or a secrets manager; NEVER commit keys to source control.
- Use rate limiting on verify endpoint to avoid spam / DOS.
- Keep file storage backed up and optionally use immutable storage or S3 with versioning for evidence chain-of-custody.
- Log all on-chain submission attempts and errors for reconciliation.

---

## The No-Crypto Model

This is a key design decision: **companies and reviewers never need a crypto wallet, never hold any crypto, and never pay any blockchain fees.** Everyone just logs in with an email and password.

Behind the scenes, **one central AITT account** covers every fee for the whole platform — automatically and invisibly. Users hold nothing and pay nothing.

When going live, it works exactly the same: keep that one account funded, and it covers everyone. The cost per action is a tiny fraction of a cent.

---

## Dashboard / Frontend

### Purpose

Provide registration/login flows, document upload UI, certificate listing, and admin views for promotions and user management. Allow public viewing and verification of certificates and retrieval of files.

### Key Screens & Features

**Homepage / Public Verification Portal:**
- Search companies, look up certificates, or verify a document.
- Each company has a public profile (scores, certified documents, blockchain verification).
- New landing hero with title, subtitle, buttons, and image.

**Register / Login:**
- Standard JWT login; registration creates a company user and company record.

**Workflows Page (replaces Documents):**
- Table showing certification cases: Company, Compliance Program, Reviewer, Status (In Progress / Completed), Score, Action.
- Create Workflow modal: pick Company, Compliance Program, and Reviewer. Program auto-fills service type and jurisdiction.
- Each workflow shows comments, compliance score, and review history.

**Certificates Page (Registry):**
- Clean list of completed certifications: Certificate ID, Company, Compliance Program, Score, Issue Date, Blockchain Proof, Download button.
- No review activities here — only completed, issued certificates.

**User Dashboard:**
- Upload document (if permitted), view own company's uploaded certificates and statuses.

**Admin Panel (Super Admin):**
- List users and companies, promote users to regulators, manage compliance programs, view on-chain transactions and tx hashes.

**Regulator Panel:**
- Upload document on behalf of a company, see upload history, see pending verifications.

**Document View:**
- Render PDF / image / docx preview (where supported), show hash, on-chain confirmation status, chain tx hash, and download link. User can click on a file's TX-Hash and search it on Stellar testnet. E.g: https://stellar.expert/explorer/testnet/tx/3688741252108288

### Frontend ↔ Backend Communication
- Frontend uses JWT in `Authorization: Bearer <token>` header for protected calls.
- Uploads use `multipart/form-data`; the backend returns immediate DB record and asynchronous chain tx status if needed.
- Live status (optional): use polling or websockets to show when on-chain tx is confirmed.

### UX Considerations
- Show clear status badges: **Not on chain** / **Pending confirmation** / **On chain**.
- When duplicate hash detected, show the original issuer & timestamp and disable re-upload.
- Provide copyable chain tx hash and link to Soroban explorer for transparency.

---

## Roles & Permissions (Summary)

| Role | Who | What They Can Do |
|------|-----|-----------------|
| **Super Admin (Main Admin)** | The organization that owns the contract | Full access: create users, manage companies, manage compliance programs, create/approve workflows, issue certificates, manage compliance officers, governance proposals |
| **Company User** | Companies using the platform | Register, view own workflows and certificates, download certificates |
| **Regulator (Compliance Officer)** | Appointed by Main Admin | Review workflows, submit scores and comments, vote on governance proposals |
| **Public** | Anyone | Search companies, view certificates, verify document hashes on-chain |

---

## Appendix: Deployment & Artifacts

- WASM hash: `e836409658d0e6cb88ba8a3665aa0ca4082dad7a53be3fdf9ad1e71774c18e80`
- Contract ID: `CA6KYPPXEUTAPa4X6JAEOI37OD2SCKEAUOSV2VN5ICDWCAI4WASFHRSYB`
- Deployment tx hash: `06fbcdccee43f3925b6c9a8bae59b4df8718e95137c52e1bf06afebf1f290b16`
- Project doc: Soroban contract & system design — https://docs.google.com/document/d/14VZCiTyoC6Q8gI3bf4f46YRp7oigrRuNqc-_DGz6Eu8/edit?tab=t.0
