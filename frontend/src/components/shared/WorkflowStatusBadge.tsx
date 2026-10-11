import { Badge } from "@/components/ui/badge";
import type { DocItem } from "../../mock/types";

/**
 * Simplified workflow status — a certification case is either still In Progress
 * or Completed (once it has reached the certificate registry).
 */
export function WorkflowStatusBadge({
  status,
}: {
  status?: DocItem["workflowStatus"];
}) {
  const completed = status === "completed";
  return (
    <Badge
      variant={completed ? "default" : "secondary"}
      className={completed ? "bg-green-600 text-white hover:bg-green-600" : ""}
    >
      {completed ? "Completed" : "In Progress"}
    </Badge>
  );
}
