// Marks the legacy ICP-demo screens that have no backend (INTEGRATION_NOTES.md
// D8). They run on self-contained sample data and are intentionally NOT wired to
// the live API.

import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="container flex items-center gap-2 py-2 text-sm text-amber-700 dark:text-amber-300">
        <FlaskConical className="h-4 w-4 flex-shrink-0" />
        <span>
          Demo preview — this screen runs on sample data and is not connected to
          the live backend.
        </span>
      </div>
    </div>
  );
}
