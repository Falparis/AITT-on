# Soroban Document Registry — Flow & Function Guide (Google Docs Ready)

**Purpose:** Clear, client-friendly overview of how to integrate with the Stellar Document Verification System smart contract. Copy-paste this into Google Docs and apply Heading styles (H1/H2/H3) as needed.

---

## Contract

| Field | Value |
|-------|-------|
| Network | Testnet |
| RPC | https://soroban-testnet.stellar.org |
| Contract ID | `CA6KYPPXEUTAPa4X6JAEOI37OD2SCKEAUOSV2VN5ICDWCAI4WASFHRSYB` |
| WASM hash | `0efd4cbe0bff01783c294115580657d9224860c19a1fbd5d40e2f57eac7d545b` |
| Explorer | https://stellar.expert/explorer/testnet/contract/CA6KYPPXEUTAPa4X6JAEOI37OD2SCKEAUOSV2VN5ICDWCAI4WASFHRSYB |

**Certificates Hashed on Stellar:**

- https://aitt-transparency.com/certificate/6a7c5c3db0db442ffc199fa4
- https://stellar.expert/explorer/testnet/tx/d39b84607072ba854e92f7b464286588efe6a7ee9dc15325732424582e5907da
- https://aitt-transparency.com/certificate/6a7c4bf63518e6288b2eab8d
- https://stellar.expert/explorer/testnet/tx/943fa614df295ce9efdbdb8d97ff6661edba2fe0efcaf6174b3f4bcaae1b188b

---

## 1. End-to-End Flow (Happy Path)

### Deploy & Initialize

- Deploy the contract
- Call `init(main_admin)` once from the deployer wallet
- This sets the Main Admin and governance threshold to 1

### Set Up Compliance Officers

- Main Admin calls `add_sub_admin(admin, officer)` for each compliance officer
- Check status with `is_sub_admin_public(addr)` (public)

### Whitelist Companies

- Main Admin calls `whitelist_address(company)` for each approved company
- Check status with `is_whitelisted(addr)` (public)

### Set Governance Threshold

- Main Admin calls `set_threshold(admin, n)` to require N approvals for proposals

### Store Document

- A whitelisted company (or Main Admin) calls `store_document(actor, name, hash)`
- `actor` must be the caller and must sign the transaction
- The contract stores `{ name, hash, timestamp, added_by, status: Submitted }` under key = hash
- Duplicate hashes are rejected

### Compliance Review

- Each compliance officer calls `submit_review(officer, doc_hash, status, score, comment_hash)`
- Status options: `Approved`, `ApprovedWithRecommendations`, `RequiresChanges`, `Rejected`
- Each officer gets one review per document (latest review wins)

### Multi-Sig Governance (if needed)

- Any admin or compliance officer calls `create_proposal(proposer, action)`
- Action types: `RevokeCertificate(doc_hash)` or `UpdateThreshold(value)`
- Compliance officers call `approve_proposal(officer, proposal_id)` to vote
- Auto-executes when the approval threshold is met

### Read / Verify

- Public reads:
  - `read_document(hash)` — returns document record or null
  - `verify_document(hash)` — returns document record with `verified_document = true` if valid

---

## 2. Function Reference (What to Call & Who Can Call It)

### Auth Legend

- **Main Admin** = the organization that owns the contract
- **Compliance Officer** = appointed by Main Admin via `add_sub_admin`
- **Company** = whitelisted entity that can upload documents
- **Public** = anyone can call (no auth required)

### 2.1 Initialization & Ownership

**Function: `init(main_admin: Address)`**
- **Who:** Deployer (during setup)
- **Does:** One-time setup. Sets the contract owner and governance threshold to 1.
- **Returns:** `()`
- **Errors:** `"already initialized"` if called again

**Function: `main_admin_address() -> Address`**
- **Who:** Public
- **Does:** Returns the current main admin's Stellar address
- **Returns:** `Address`

**Function: `transfer_main_admin(new_admin: Address)`**
- **Who:** Main Admin (must sign)
- **Does:** Transfers contract ownership to a new address
- **Returns:** `()`
- **Errors:** Missing admin auth

### 2.2 Compliance Officer Management

**Function: `add_sub_admin(admin: Address, sub_admin: Address)`**
- **Who:** Main Admin (must sign)
- **Does:** Registers a new compliance officer who can review documents and vote on proposals. Idempotent.
- **Returns:** `()`

**Function: `remove_sub_admin(admin: Address, sub_admin: Address)`**
- **Who:** Main Admin (must sign)
- **Does:** Revokes a compliance officer's privileges. Decrements M.
- **Returns:** `()`

**Function: `is_sub_admin_public(addr: Address) -> bool`**
- **Who:** Public
- **Does:** Checks whether an address is a compliance officer
- **Returns:** `true` | `false`

### 2.3 Whitelist Management

**Function: `whitelist_address(address: Address)`**
- **Who:** Main Admin (must sign)
- **Does:** Adds a company address to the document upload whitelist
- **Returns:** `()`

**Function: `remove_from_whitelist(address: Address)`**
- **Who:** Main Admin (must sign)
- **Does:** Removes a company from the upload whitelist
- **Returns:** `()`

**Function: `is_whitelisted(address: Address) -> bool`**
- **Who:** Public
- **Does:** Checks whether an address is a whitelisted company
- **Returns:** `true` | `false`

### 2.4 Governance

**Function: `set_threshold(admin: Address, new_threshold: u32)`**
- **Who:** Main Admin (must sign)
- **Does:** Changes how many compliance officer approvals are needed to pass a proposal. Must satisfy 1 <= N <= M.
- **Returns:** `()`

**Function: `governance_threshold() -> u32`**
- **Who:** Public
- **Does:** Returns how many compliance officer approvals are required to execute a proposal
- **Returns:** `u32`

### 2.5 Document Registry

**Function: `store_document(actor: Address, name: String, hash: String)`**
- **Who:** Main Admin or whitelisted company (must sign)
- **Does:** Registers a document hash on-chain. Caller must be main admin or a whitelisted company.
- **Stores:**
  - `name` — document label
  - `hash` — caller-provided content hash (string)
  - `timestamp` — ledger time at call (`u64`)
  - `added_by` — the actor address
  - `status` — `Submitted`
- **Returns:** `()`
- **Notes:** Duplicate hashes are rejected (`"Document already registered"`)

**Function: `read_document(hash: String) -> Option<Document>`**
- **Who:** Public
- **Does:** Returns the document record for a given hash, or null if not found
- **Returns:** `{ name, hash, timestamp, added_by, status, expiry }` or `None`

**Function: `verify_document(hash: String) -> Option<VerifiedDocument>`**
- **Who:** Public
- **Does:** Returns the document record with a verified flag. Status-aware: Issued + not expired = `verified_document: true`. Revoked/Expired/Submitted = `false`.
- **Returns:** `{ name, hash, timestamp, added_by, verified_document, certificate_status, expiry }` or `None`

### 2.6 Compliance Reviews

**Function: `submit_review(sub_admin: Address, doc_hash: String, status: DocumentStatus, score: u32, comment_hash: String)`**
- **Who:** Compliance Officer only (must sign)
- **Does:** Submits a compliance review for a document. Each officer gets one review per document (latest review wins).
- **Status options:** `Approved`, `ApprovedWithRecommendations`, `RequiresChanges`, `Rejected`
- **Returns:** `()`

**Function: `read_review(doc_hash: String, reviewer: Address) -> Option<Review>`**
- **Who:** Public
- **Does:** Returns the review submitted by a specific compliance officer for a specific document
- **Returns:** `{ reviewer, status, score, comment_hash, timestamp }` or `None`

### 2.7 Multi-Sig Governance Proposals

**Function: `create_proposal(proposer: Address, action: ProposalAction) -> u64`**
- **Who:** Main Admin or Compliance Officer (must sign)
- **Does:** Creates a governance proposal. Returns the proposal ID.
- **Action types:** `RevokeCertificate(doc_hash)` or `UpdateThreshold(value)`
- **Returns:** proposal ID (`u64`)

**Function: `approve_proposal(sub_admin: Address, proposal_id: u64)`**
- **Who:** Compliance Officer only (must sign)
- **Does:** Approves a proposal. Auto-executes when the approval threshold is met. Same officer cannot approve twice.
- **Returns:** `()`
- **Errors:** Double-approve rejected; approving an already-executed proposal rejected

**Function: `read_proposal(proposal_id: u64) -> Option<Proposal>`**
- **Who:** Public
- **Does:** Returns the full proposal record including approvals and execution status
- **Returns:** `{ id, action, approvals[], executed }` or `None`

---

## 3. Integration Notes (Keep It Simple)

- **Signatures:** For any write, the caller must sign. `actor` must match the signer for `store_document`.
- **Hashes:** Compute SHA-256 off-chain and pass a consistent representation (hex string).
- **Duplicates:** Duplicate hashes are rejected at the contract level with `"Document already registered"`.
- **Timestamps:** From `env.ledger().timestamp()` (seconds) for audit/UI.
- **Document Lifecycle:** `Submitted` -> `Issued` (off-chain) -> `Revoked` (via proposal) / `Expired` (past expiry).
- **Review Scoring:** The contract accepts any numeric score — validation of 0-100 range is enforced by the backend, not the contract.
- **Auto-execution:** Proposals execute automatically when the last required approval is submitted. No separate execution step.
- **Custodial Signing:** The backend signs transactions on behalf of companies and compliance officers using `opts.signerSecret`.

---

## 4. Minimal Example Call Flow (Pseudo)

### Setup

```
init(main_admin)
```

### Add Compliance Officers

```
add_sub_admin(main_admin, officer_a)
add_sub_admin(main_admin, officer_b)
```

### Whitelist Companies

```
whitelist_address(company_a)
```

### Set Governance Threshold

```
set_threshold(main_admin, 2)
```

### Store Document (signed by whitelisted company)

```
store_document(company_a, "AuditReport.pdf", "<CONTENT_HASH>")
```

### Compliance Reviews

```
submit_review(officer_a, "<CONTENT_HASH>", "Approved", 85, "<COMMENT_HASH>")
submit_review(officer_b, "<CONTENT_HASH>", "Approved", 90, "<COMMENT_HASH>")
```

### Read / Verify

```
read_document("<CONTENT_HASH>")
verify_document("<CONTENT_HASH>")
read_review("<CONTENT_HASH>", officer_a)
```

### Revoke (if needed — multi-sig)

```
proposal_id = create_proposal(officer_a, RevokeCertificate("<CONTENT_HASH>"))
approve_proposal(officer_a, proposal_id)
approve_proposal(officer_b, proposal_id)  // auto-executes at threshold=2
```

### Admin Handover

```
transfer_main_admin(new_admin)
```

---

## 5. Test Cases (from current suite)

| Test Name | Purpose |
|-----------|---------|
| `store_document: whitelisted actor stores a Submitted doc; verify is not yet valid` | Happy path for company store + verify shows Submitted |
| `store_document: non-whitelisted, non-admin actor is rejected` | Enforce whitelist boundary (403) |
| `store_document: duplicate hash is rejected` | Contract-level duplicate guard (409) |
| `issue_certificate: main-admin only, Submitted-only, then verify is valid` | Issuance transitions to Issued + verified_document = true |
| `issue_certificate: NO on-chain review gate` | Contract allows issuance without on-chain review (gate lives in backend) |
| `verify_document: an Issued doc past its expiry reports Expired + not valid` | Expiry check on verify |
| `submit_review: sub-admin only; overwrites per reviewer` | Review lifecycle and overwrite semantics |
| `create_proposal starts with 0 approvals; proposer must be admin/sub-admin` | Proposal creation auth and initial state |
| `approve_proposal auto-executes at threshold; double-approve is guarded` | Full governance lifecycle with auto-execution |
| `UpdateThreshold proposal changes the governance threshold on execution` | Threshold update via proposal |
