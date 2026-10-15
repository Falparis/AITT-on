# Deliverables Index

Repository: https://github.com/Falparis/AITT-on

Canonical contract (Stellar testnet): [`CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC`](https://stellar.expert/explorer/testnet/contract/CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC)

## 1. Multisig Governance

| Request | Status | Where |
|---|---|---|
| Canonical contract ID, used consistently in README and documentation | Done | [README.md](README.md), [contract/README.md](contract/README.md), `backend/docs/*`, `backend/Technical Documentation.docx` |
| Testnet transactions: `add_sub_admin` | Done | [GOVERNANCE-TESTNET-PROOF.md](contract/GOVERNANCE-TESTNET-PROOF.md) steps 4–6 |
| Testnet transactions: `set_threshold` with value >= 2 | Done | Proof step 7 (threshold 2 of 3) |
| Testnet transactions: `create_proposal` | Done | Proof step 11 |
| Testnet transactions: approvals reaching the threshold | Done | Proof steps 12–13 |
| Testnet transactions: auto-executed `RevokeCertificate` | Done | Proof step 13 (certificate Issued → Revoked) |
| Governance note: sub-admin key holders and quorum policy | Done | [contract/GOVERNANCE.md](contract/GOVERNANCE.md) |
| WASM reproducibility: `Cargo.toml` and build setup | Done | [contract/Cargo.toml](contract/Cargo.toml), [contract/Cargo.lock](contract/Cargo.lock), build steps in [contract/README.md](contract/README.md#build-and-reproduce-the-wasm-hash) |
| Before mainnet: `init` cannot be called again | Done | `init` in [lib.rs](contract/contracts/document_verification_system/src/lib.rs); verified on-chain (proof, "Pre-mainnet guards") |
| Before mainnet: `1 <= N <= number of sub-admins` in `set_threshold` | Done | `set_threshold` and `UpdateThreshold` in [lib.rs](contract/contracts/document_verification_system/src/lib.rs); verified on-chain (proof, "Pre-mainnet guards") |

Expected WASM hash: `f98e917479db7306b64a3866fc97118effc05d62e65fdc478986027141ab5e6e`

## 2. Performance and Load Testing

| Request | Status |
|---|---|
| Load-testing scripts, TPS / latency / cost results, optimisations report | **Not run.** Load tests have not been performed; we request a modification of this deliverable. |

## 3. Compliance Monitoring

| Request | Status | Where |
|---|---|---|
| Expiry job, alerts, manual regulatory-update endpoint | Done (confirmed by reviewers) | `backend/src/services/jobs/expiry.job.js`, `backend/src/services/alert.service.js` |
| Screenshot: alerts screen | Done | [docs/screenshots/01-monitoring-alerts.png](docs/screenshots/01-monitoring-alerts.png) |
| Screenshot: regulatory-update screen | Done | [docs/screenshots/02-regulatory-update-form.png](docs/screenshots/02-regulatory-update-form.png), [docs/screenshots/03-regulatory-update-published.png](docs/screenshots/03-regulatory-update-published.png) |
| Frontend repository clarification | Done — the actual frontend source is published in [frontend/](frontend/) (it previously duplicated the backend) | [frontend/](frontend/) |
