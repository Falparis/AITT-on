# Governance Note — Keys and Quorum Policy

Contract: [`CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC`](https://stellar.expert/explorer/testnet/contract/CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC) (Stellar testnet)

## Who holds the keys

AITT runs a **no-crypto model**: companies and compliance officers (sub-admins) sign in with email and password and never handle a wallet, a seed phrase or XLM.

- **Custodial keys.** When a company registers or a sub-admin is invited, the AITT backend generates a Stellar keypair for them. The backend holds these keys and signs on-chain actions on the user's behalf, e.g. a company's `store_document`, or a sub-admin's `submit_review`, `create_proposal` and `approve_proposal`.
- **Encrypted at rest.** Secret keys are stored encrypted with AES-256-GCM. The encryption key is supplied to the server through its environment and is never stored in the database. Plaintext keys are refused in production.
- **Empty wallets.** Company and sub-admin accounts hold **no XLM balance**. The main admin account creates them with sponsored reserves, so they exist on-chain with a zero balance.
- **The main admin pays all fees.** Every transaction signed by a company or sub-admin key is wrapped in a fee-bump paid by the main admin account. Users never pay network fees, and their accounts have nothing of value to steal.
- **The main admin key** is held by AITT and is the only account holding XLM. It signs the admin-only actions: `init`, whitelisting companies, adding or removing sub-admins, `set_threshold` and `issue_certificate`.

## Quorum policy

| Rule | Enforced by |
|---|---|
| Revocations, threshold changes and contract upgrades go through proposals and need **N approvals from sub-admins** | `approve_proposal` |
| The proposal **auto-executes** on the approval that reaches N | `approve_proposal` |
| **1 <= N <= number of sub-admins**: N can never be 0 and never higher than the number of signers | `set_threshold`, `UpdateThreshold` proposals (checked when created and when executed) |
| Only sub-admins approve; each sub-admin can approve a proposal once | `approve_proposal` |
| Removing a sub-admin never deadlocks governance: if fewer sub-admins would remain than N, N is lowered to the remaining count (minimum 1) | `remove_sub_admin` |
| `init` can run only once, so the main admin cannot be reassigned through it | `init` |

**Current setting:** N = 2 of 3 sub-admins. A single sub-admin cannot revoke a certificate on their own.

These rules live in the contract, so anyone can check them on-chain with `governance_threshold` and `sub_admin_count`, without trusting the backend.

## Separation of powers

| Action | Who |
|---|---|
| Upload a document hash | Whitelisted company (or main admin) |
| Review and score a document | Sub-admin |
| Issue a certificate | Main admin |
| Revoke a certificate / change threshold / upgrade the contract | Quorum of sub-admins via proposal |

Proof of the full governance flow on testnet: [GOVERNANCE-TESTNET-PROOF.md](GOVERNANCE-TESTNET-PROOF.md).
