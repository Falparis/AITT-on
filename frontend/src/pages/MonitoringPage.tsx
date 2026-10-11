import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Activity, Award, BellRing, CalendarClock, CheckCheck, Megaphone } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import {
  useAddAlert,
  useAlerts,
  useDocuments,
  useResolveAlert,
} from "../hooks/data";
import type { Alert } from "../mock/types";
import { formatDate, nowISO } from "../mock/utils";

const SEVERITY: Record<
  Alert["severity"],
  { label: string; badge: string; border: string; rank: number }
> = {
  critical: {
    label: "Critical",
    badge: "bg-destructive text-destructive-foreground border-transparent",
    border: "border-l-destructive",
    rank: 0,
  },
  warning: {
    label: "Warning",
    badge: "bg-amber-500 text-white border-transparent",
    border: "border-l-amber-500",
    rank: 1,
  },
  info: {
    label: "Info",
    badge: "bg-blue-500 text-white border-transparent",
    border: "border-l-blue-500",
    rank: 2,
  },
};

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

export default function MonitoringPage() {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useAlerts();
  const { data: documents } = useDocuments();
  const addAlert = useAddAlert();
  const resolveAlert = useResolveAlert();

  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<Alert["severity"]>("info");
  const [effectiveDate, setEffectiveDate] = useState("");

  const stats = useMemo(() => {
    const docs = documents ?? [];
    const now = Date.now();
    const issued = docs.filter((d) => d.status === "issued");
    const expiringSoon = issued.filter((d) => {
      if (!d.expiryAt) return false;
      const diff = new Date(d.expiryAt).getTime() - now;
      return diff > 0 && diff <= MS_PER_YEAR;
    }).length;
    return {
      active: issued.length,
      expiringSoon,
      openAlerts: (alerts ?? []).length,
    };
  }, [documents, alerts]);

  const sortedAlerts = useMemo(
    () =>
      [...(alerts ?? [])].sort((a, b) => {
        const rank = SEVERITY[a.severity].rank - SEVERITY[b.severity].rank;
        return rank !== 0 ? rank : a.dueDate.localeCompare(b.dueDate);
      }),
    [alerts],
  );

  const docFor = (docId: string) => (documents ?? []).find((d) => d.id === docId);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Please enter an update message");
    try {
      await addAlert.mutateAsync({
        docId: "",
        message: message.trim(),
        dueDate: effectiveDate ? new Date(effectiveDate).toISOString() : nowISO(),
        severity,
      });
      toast.success("Regulatory update published");
      setMessage("");
      setSeverity("info");
      setEffectiveDate("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not publish update");
    }
  };

  const handleResolve = async (alert: Alert) => {
    try {
      await resolveAlert.mutateAsync(alert.id);
      toast.success("Alert resolved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not resolve alert");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Alerts & Monitoring"
        subtitle="Track certificate expiries and publish regulatory updates."
        icon={Activity}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Active certificates" value={stats.active} icon={Award} />
          <StatCard title="Expiring within 1 year" value={stats.expiringSoon} icon={CalendarClock} />
          <StatCard title="Open alerts" value={stats.openAlerts} icon={BellRing} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold">Active alerts</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : sortedAlerts.length === 0 ? (
            <EmptyState
              icon={CheckCheck}
              title="All clear"
              description="There are no active monitoring alerts."
            />
          ) : (
            <div className="space-y-3">
              {sortedAlerts.map((alert) => {
                const sev = SEVERITY[alert.severity];
                const doc = docFor(alert.docId);
                return (
                  <Card key={alert.id} className={cn("border-l-4", sev.border)}>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={sev.badge}>{sev.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Due {formatDate(alert.dueDate)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{alert.message}</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        {doc && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate({ to: `/certificate/${doc.id}` })}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(alert)}
                          disabled={resolveAlert.isPending}
                        >
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual regulatory update */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Manual regulatory update</CardTitle>
            </div>
            <CardDescription>
              Publish a regulatory change as a monitoring alert (demo).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePublish}>
              <div className="space-y-2">
                <Label htmlFor="reg-message">Update</Label>
                <Textarea
                  id="reg-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the regulatory change…"
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={severity}
                  onValueChange={(v) => setSeverity(v as Alert["severity"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-date">Effective date (optional)</Label>
                <Input
                  id="reg-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addAlert.isPending}>
                {addAlert.isPending ? "Publishing…" : "Publish update"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
