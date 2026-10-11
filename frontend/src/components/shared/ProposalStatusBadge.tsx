import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProposalStatus } from "../../mock/types";

const MAP: Record<ProposalStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500 text-white border-transparent" },
  executed: { label: "Executed", className: "bg-primary text-primary-foreground border-transparent" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground border-transparent" },
};

export function ProposalStatusBadge({
  status,
  className,
}: {
  status: ProposalStatus;
  className?: string;
}) {
  const { label, className: statusClass } = MAP[status];
  return <Badge className={cn(statusClass, className)}>{label}</Badge>;
}
