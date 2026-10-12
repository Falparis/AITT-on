# Stellar Document Verification System

A Soroban smart contract on Stellar testnet for registering, issuing, verifying, and revoking digital document certificates with multi-signature governance.

---

## Contract

| Field | Value |
|---|---|
| Network | Testnet |
| RPC | `https://soroban-testnet.stellar.org` |
| Contract ID | [`CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC`](https://stellar.expert/explorer/testnet/contract/CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC) |
| WASM hash (SHA-256) | `f98e917479db7306b64a3866fc97118effc05d62e65fdc478986027141ab5e6e` |
| WASM size | 13,345 bytes |
| Main admin | `GAKNE5M3T2OGH6VXEEEM2SWC7S7ZHSECVE2A5VPK7P55PAIVKEH7Z4NA` |
| Governance | Threshold 2 of 3 sub-admins |

### Deployment Transactions

| Step | Transaction Hash |
|---|---|
| Upload WASM | [`479eddd0…5d7aa4`](https://stellar.expert/explorer/testnet/tx/479eddd081e9485fbe5b1f7c761de6828371301493fabb49dee112e75f5d7aa4) |
| Deploy contract | [`36c59c30…f6bbdf`](https://stellar.expert/explorer/testnet/tx/36c59c30039407665b039ae1e9752e6857eea844825634f12eb31fc725f6bbdf) |
| Init | [`2730db9e…6237f3`](https://stellar.expert/explorer/testnet/tx/2730db9e68119ed3ea013223068bdfe6039f58b1ee69225f89aac3d71e6237f3) |

The full governance sequence (`add_sub_admin`, `set_threshold`, `create_proposal`, approvals, auto-executed `RevokeCertificate`) is in [GOVERNANCE-TESTNET-PROOF.md](GOVERNANCE-TESTNET-PROOF.md).

---

## Build and Reproduce the WASM Hash

### Toolchain

| Tool | Version |
|---|---|
| Rust | 1.96.0 (target `wasm32v1-none`) |
| Stellar CLI | 27.0.0 |
| soroban-sdk | 27.0.6 (pinned in `Cargo.lock`) |

```bash
rustup toolchain install 1.96.0
rustup target add wasm32v1-none --toolchain 1.96.0
cargo install --locked stellar-cli --version 27.0.0
```

### Build

```bash
cd contract
stellar contract build
sha256sum target/wasm32v1-none/release/document_verification_system.wasm
```

Expected: `f98e917479db7306b64a3866fc97118effc05d62e65fdc478986027141ab5e6e`

`stellar contract build` also prints the hash (`Wasm Hash:`). It must match the WASM hash of the deployed contract shown on the explorer. Builds use the committed `Cargo.lock`; do not run `cargo update` before reproducing.

### Test

```bash
cargo test
```

37 unit tests cover the full lifecycle, access control, the `init` guard and the threshold rules.

### Project Layout

```
contract/
├── Cargo.toml                         # workspace, release profile
├── Cargo.lock                         # pinned dependency versions
├── contracts/document_verification_system/
│   ├── Cargo.toml
│   └── src/lib.rs                     # contract + unit tests
├── scripts/                           # Node scripts (npm install first)
│   ├── create_accounts.mjs            # create + fund testnet accounts
│   ├── deploy.mjs                     # upload, deploy, init, sample flow
│   ├── client_governance_demo.mjs     # governance proof run
│   └── test_full.mjs                  # on-chain test suite
└── GOVERNANCE-TESTNET-PROOF.md
```

---

## Roles

| Role | Who | What they can do |
|---|---|---|
| **Main Admin** | Contract owner | All admin functions, whitelist, sub-admins, issue certificates, ownership transfer, create proposals |
| **Sub-Admin** | Compliance officer | Review documents, create & approve proposals, cannot whitelist or issue certificates |
| **Whitelisted Company** | Trusted entity | Upload document hashes only |
| **Public** | Anyone | Read documents, verify certificates, view proposals and reviews |

---

## Certificate Lifecycle

```
  Submitted ──▶ Issued ──▶ Revoked
                    │
                    ▼
                 Expired (computed on verification)
```

- **Submitted**: Document hash registered on-chain. Not yet verifiable.
- **Issued**: Admin issues the certificate with an expiry timestamp. Verifiable.
- **Revoked**: Certificate revoked via governance multi-sig proposal. Document stays on-chain.
- **Expired**: Computed at verification time — if current ledger time exceeds the set expiry, the certificate is reported as Expired.

---

## Governance Rules

- **Threshold bounds**: `1 <= threshold <= number of sub-admins`, enforced by `set_threshold` and by `UpdateThreshold` proposals (checked when the proposal is created and again when it executes).
- **Removing a sub-admin** never fails. If fewer sub-admins would remain than the threshold, the threshold is lowered to the remaining count (minimum 1), so governance can never deadlock.
- **Adding a sub-admin twice** has no effect; the sub-admin count stays correct.
- **Approvals**: only sub-admins approve. A proposal auto-executes on the approval that reaches the threshold.
- Right after `init` the threshold is 1 with no sub-admins; no proposal can execute until a sub-admin is added.

---

## Functions

### Initialization

| Function | Parameters | Auth | Description |
|---|---|---|---|
| `init` | `main_admin: Address` | One-time | Sets the main admin and a threshold of 1. Panics if already initialized, so the main admin can never be reassigned through `init`. The deploy scripts call it immediately after deploying. |

### Admin Queries

| Function | Returns | Auth | Description |
|---|---|---|---|
| `main_admin_address` | `Address` | Public | Current contract owner |
| `governance_threshold` | `u32` | Public | Number of approvals needed for a proposal |
| `sub_admin_count` | `u32` | Public | Number of current sub-admins |

### Sub-Admin Management (Main Admin only)

| Function | Parameters | Description |
|---|---|---|
| `add_sub_admin` | `admin, sub_admin` | Register a compliance officer (no effect if already registered) |
| `remove_sub_admin` | `admin, sub_admin` | Revoke compliance officer access; lowers the threshold if needed |
| `is_sub_admin_public` | `addr: Address` | Check if address is a sub-admin (public) |

### Whitelist Management (Main Admin only)

| Function | Parameters | Description |
|---|---|---|
| `whitelist_address` | `address` | Add company to upload whitelist |
| `remove_from_whitelist` | `address` | Remove company from whitelist |
| `is_whitelisted` | `address` | Check whitelist status (public) |

### Threshold Management (Main Admin only)

| Function | Parameters | Description |
|---|---|---|
| `set_threshold` | `admin, new_threshold` | Change governance approval threshold (`1 <= N <= sub_admin_count`) |

### Document Storage

| Function | Parameters | Auth | Description |
|---|---|---|---|
| `store_document` | `actor, name, hash` | Main admin or whitelisted company | Register document hash as **Submitted** |
| `read_document` | `hash` | Public | Returns full document record including status and expiry |
| `issue_certificate` | `admin, doc_hash, expiry` | Main admin only | Transition document from Submitted → Issued with expiry |
| `verify_document` | `hash` | Public | Returns `verified_document` (bool), `certificate_status`, `expiry` |

### Compliance Reviews

| Function | Parameters | Auth | Description |
|---|---|---|---|
| `submit_review` | `sub_admin, doc_hash, status, score, comment_hash` | Sub-admin only | Submit compliance review (status: Approved, ApprovedWithRecommendations, RequiresChanges, Rejected) |
| `read_review` | `doc_hash, reviewer` | Public | Read a specific review |

### Multi-Sig Governance

| Function | Parameters | Auth | Description |
|---|---|---|---|
| `create_proposal` | `proposer, action` | Main admin or sub-admin | Create governance proposal. Returns proposal ID |
| `approve_proposal` | `sub_admin, proposal_id` | Sub-admin only | Approve proposal. Auto-executes when threshold met |
| `read_proposal` | `proposal_id` | Public | Return proposal record |

### Proposal Actions

| Action | Payload | Effect |
|---|---|---|
| `RevokeCertificate` | `doc_hash: String` | Marks certificate as Revoked (does not delete) |
| `UpdateThreshold` | `new_threshold: u32` | Changes approval threshold (must satisfy `1 <= N <= sub_admin_count`) |
| `ContractUpgrade` | `wasm_hash: BytesN<32>` | Upgrades contract WASM via `update_current_contract_wasm` |

### Ownership Transfer

| Function | Parameters | Auth | Description |
|---|---|---|---|
| `transfer_main_admin` | `new_admin` | Current admin only | Transfer contract ownership |

---

## Enum Types

### `CertificateStatus` (document lifecycle)

```
Submitted | Issued | Revoked | Expired
```

### `DocumentStatus` (compliance review)

```
Approved | ApprovedWithRecommendations | RequiresChanges | Rejected
```

### `ProposalAction`

```
RevokeCertificate(String) | UpdateThreshold(u32) | ContractUpgrade(BytesN<32>)
```

---

## Error Messages

Panic messages are visible in unit tests. In the release WASM they are stripped, and a rejected call appears on-chain as `Error(WasmVm, InvalidAction)` / `UnreachableCodeReached`.

| Panic Message | Trigger |
|---|---|
| `contract already initialized` | Calling `init` a second time |
| `contract not initialized` | Calling any function before `init` |
| `Document already registered` | Storing a document with an existing hash |
| `not authorized: only main admin or whitelisted address` | Non-whitelisted user stores document |
| `only main admin can manage sub-admins` | Non-admin adds/removes sub-admins |
| `only main admin can issue certificates` | Non-admin calls `issue_certificate` |
| `certificate can only be issued from Submitted status` | Issuing an already-issued/revoked doc |
| `document not found` | Issue or revoke on non-existent doc |
| `only main admin can set threshold` | Non-admin calls `set_threshold` |
| `threshold must be at least 1` | `set_threshold(0)` or `UpdateThreshold(0)` |
| `threshold cannot exceed the number of sub-admins` | Threshold above `sub_admin_count` |
| `not authorized: only sub-admins can submit reviews` | Non-sub-admin calls `submit_review` |
| `only main admin or sub-admin can create proposals` | Unauthorized user creates proposal |
| `only sub-admins can approve proposals` | Non-sub-admin approves proposal |
| `proposal not found` | Approve a non-existent proposal |
| `proposal already executed` | Approve an already-executed proposal |
| `already approved by this sub-admin` | Same sub-admin approves twice |
| `new admin must be different` | Transfer to the same address |

---

## Architecture

- **Written in Rust** using `soroban-sdk` 27.0.6
- **Storage**: All persistent using `env.storage().persistent()` — no temp or instance storage
- **No file storage**: Only SHA-256 hashes stored on-chain. Files remain off-chain.
- **Auto-execution**: Proposals execute automatically when approval threshold is met
- **Separation of powers**: Uploaders cannot review. Reviewers cannot issue certificates. With a threshold of 2 or more, a single sub-admin cannot revoke unilaterally.
- **Certificate lifecycle**: Documents progress through Submitted → Issued → Revoked. Expiry is computed at verification time.
