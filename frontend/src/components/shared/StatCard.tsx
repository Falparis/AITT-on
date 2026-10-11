import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  valueClassName,
}: {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardDescription>{title}</CardDescription>
          {Icon && (
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <CardTitle className={cn("text-3xl", valueClassName)}>{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}
