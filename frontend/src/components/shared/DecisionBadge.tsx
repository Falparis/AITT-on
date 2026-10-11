import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewDecision } from "../../mock/types";

const DECISION_MAP: Record<ReviewDecision, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-primary text-primary-foreground border-transparent" },
  approved_with_recommendations: {
    label: "Approved w/ Rec.",
    className: "bg-blue-500 text-white border-transparent",
  },
  requires_changes: { label: "Requires Changes", className: "bg-orange-500 text-white border-transparent" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground border-transparent" },
};

export function DecisionBadge({
  decision,
  className,
}: {
  decision: ReviewDecision;
  className?: string;
}) {
  const { label, className: decisionClass } = DECISION_MAP[decision];
  return <Badge className={cn(decisionClass, className)}>{label}</Badge>;
}
