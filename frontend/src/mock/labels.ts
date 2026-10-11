// Human-readable labels for governance enums.

import type { ProposalStatus, ProposalType } from "./types";

export const PROPOSAL_TYPE_LABEL: Record<ProposalType, string> = {
  revocation: "Certificate Revocation",
  framework_update: "Framework Update",
  governance_rule: "Governance Rule Change",
  contract_upgrade: "Contract Upgrade",
};

// The four exceptional actions that require multi-signature governance (§3).
export const PROPOSAL_TYPE_OPTIONS: { value: ProposalType; label: string }[] = [
  { value: "revocation", label: PROPOSAL_TYPE_LABEL.revocation },
  { value: "framework_update", label: PROPOSAL_TYPE_LABEL.framework_update },
  { value: "governance_rule", label: PROPOSAL_TYPE_LABEL.governance_rule },
  { value: "contract_upgrade", label: PROPOSAL_TYPE_LABEL.contract_upgrade },
];

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: "Pending",
  executed: "Executed",
  rejected: "Rejected",
};
