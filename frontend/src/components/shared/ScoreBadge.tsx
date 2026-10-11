import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Color grade for a 0–100 compliance score: ≥80 green, 60–79 amber, <60 red. */
export function scoreClass(value: number): string {
  if (value >= 80) return "bg-green-600 text-white border-transparent";
  if (value >= 60) return "bg-amber-500 text-white border-transparent";
  return "bg-red-500 text-white border-transparent";
}

export function scoreTextClass(value: number): string {
  if (value >= 80) return "text-green-600 dark:text-green-400";
  if (value >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function ScoreBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <Badge className={cn(scoreClass(value), className)}>{value}%</Badge>;
}

/** Progress-bar variant for detail pages. */
export function ScoreMeter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Compliance score</span>
        <span className={cn("font-semibold", scoreTextClass(value))}>{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
