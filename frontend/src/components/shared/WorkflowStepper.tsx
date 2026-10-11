import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { DocStatus } from "../../mock/types";

const STEPS = ["Submitted", "Under Review", "Decision", "Issued"] as const;

// How far through the workflow each status has progressed (index into STEPS).
const STATUS_STEP: Record<DocStatus, number> = {
  submitted: 0,
  under_review: 1,
  requires_changes: 1,
  approved: 2,
  approved_with_recommendations: 2,
  rejected: 2,
  issued: 3,
  expired: 3,
  revoked: 3,
};

export function WorkflowStepper({ status }: { status: DocStatus }) {
  const reached = STATUS_STEP[status];
  const negative = status === "rejected" || status === "revoked";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STEPS.map((label, i) => {
        const isReached = i <= reached;
        const isLast = i === reached;
        const showNegative = negative && isLast;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                showNegative
                  ? "border-transparent bg-destructive text-destructive-foreground"
                  : isReached
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {showNegative ? (
                <X className="h-4 w-4" />
              ) : isReached ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-sm break-words",
                isReached ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
