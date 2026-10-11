import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocStatus } from "../../mock/types";

const STATUS_MAP: Record<DocStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-muted text-muted-foreground border-transparent" },
  under_review: { label: "Under Review", className: "bg-amber-500 text-white border-transparent" },
  requires_changes: { label: "Requires Changes", className: "bg-orange-500 text-white border-transparent" },
  approved: { label: "Approved", className: "bg-primary text-primary-foreground border-transparent" },
  approved_with_recommendations: {
    label: "Approved w/ Rec.",
    className: "bg-blue-500 text-white border-transparent",
  },
  issued: { label: "Issued", className: "bg-green-600 text-white border-transparent" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground border-transparent" },
  expired: {
    label: "Expired",
    className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-transparent",
  },
  revoked: {
    label: "Revoked",
    className: "bg-destructive/15 text-destructive border border-destructive/30",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: DocStatus;
  className?: string;
}) {
  const { label, className: statusClass } = STATUS_MAP[status];
  return <Badge className={cn(statusClass, className)}>{label}</Badge>;
}
