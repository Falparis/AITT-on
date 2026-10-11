import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Award, Building2, Clock, LayoutDashboard, Scale, Users } from "lucide-react";
import { useMemo } from "react";
import {
  useCompanies,
  useDocuments,
  useProposals,
  useSubAdmins,
} from "../hooks/data";
import { PROPOSAL_TYPE_LABEL } from "../mock/labels";
import type { DocItem } from "../mock/types";
import { formatDate } from "../mock/utils";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments();
  const { data: companies } = useCompanies();
  const { data: subAdmins } = useSubAdmins();
  const { data: proposals } = useProposals();

  const stats = useMemo(() => {
    const docs = documents ?? [];
    return {
      issued: docs.filter((d) => d.status === "issued").length,
      pending: docs.filter((d) =>
        ["submitted", "under_review"].includes(d.status),
      ).length,
      activeCompanies: (companies ?? []).filter((c) => c.status === "active").length,
      experts: (subAdmins ?? []).filter((s) => s.status === "active").length,
    };
  }, [documents, companies, subAdmins]);

  const recent = useMemo(
    () =>
      [...(documents ?? [])]
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .slice(0, 5),
    [documents],
  );

  const pendingProposals = useMemo(
    () => (proposals ?? []).filter((p) => p.status === "pending"),
    [proposals],
  );

  const columns: Column<DocItem>[] = [
    {
      header: "Document",
      cell: (d) => <span className="font-medium break-words">{d.filename}</span>,
    },
    { header: "Company", cell: (d) => d.company },
    { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
    {
      header: "Score",
      cell: (d) =>
        d.complianceScore != null ? (
          <ScoreBadge value={d.complianceScore} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Submitted",
      cell: (d) => (
        <span className="text-muted-foreground">{formatDate(d.submittedAt)}</span>
      ),
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and pending actions."
        icon={LayoutDashboard}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Certificates Issued" value={stats.issued} icon={Award} />
          <StatCard title="Pending Review" value={stats.pending} icon={Clock} />
          <StatCard title="Active Companies" value={stats.activeCompanies} icon={Building2} />
          <StatCard title="Legal Experts" value={stats.experts} icon={Users} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold">Recent documents</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DataTable
              columns={columns}
              data={recent}
              rowKey={(d) => d.id}
              onRowClick={(d) => navigate({ to: `/certificate/${d.id}` })}
              emptyMessage="No documents yet."
            />
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Pending governance</CardTitle>
            </div>
            <CardDescription>
              Multi-sig proposals awaiting approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending proposals.</p>
            ) : (
              pendingProposals.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => navigate({ to: `/admin/governance/${p.id}` })}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{PROPOSAL_TYPE_LABEL[p.type]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {p.approvals}/{p.threshold}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium break-words">{p.title}</p>
                </button>
              ))
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/admin/governance" })}
            >
              Open governance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
