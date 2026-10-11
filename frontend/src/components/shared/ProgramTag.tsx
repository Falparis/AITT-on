import type { DocItem } from "../../mock/types";

/**
 * Renders a document/certificate's jurisdiction + compliance program, e.g.
 * "🇪🇺 EU · AI Transparency". Falls back to the subject when no program is set
 * (older records). Renders nothing if there's nothing to show.
 */
export function ProgramTag({
  doc,
  className,
}: {
  doc: Pick<DocItem, "jurisdiction" | "program" | "subject">;
  className?: string;
}) {
  const flag =
    doc.jurisdiction === "EU" ? "🇪🇺 EU" : doc.jurisdiction === "US" ? "🇺🇸 US" : null;
  const label = doc.program || doc.subject || null;
  if (!flag && !label) return null;
  return (
    <span
      className={
        className ?? "inline-flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
      }
    >
      {flag && <span className="font-medium">{flag}</span>}
      {flag && label && <span aria-hidden>·</span>}
      {label && <span>{label}</span>}
    </span>
  );
}
