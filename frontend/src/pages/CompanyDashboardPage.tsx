import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  Clock,
  FileText,
  LayoutDashboard,
  Upload,
} from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useCompanyDocuments } from "../hooks/data";
import { DEMO_COMPANY } from "../mock/identity";
import type { DocItem } from "../mock/types";
import { formatDate } from "../mock/utils";

export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const { isMock } = useAuth();
  const { data: documents, isLoading } = useCompanyDocuments(DEMO_COMPANY);

  const stats = useMemo(() => {
    const docs = documents ?? [];
    return {
      total: docs.length,
      underReview: docs.filter((d) =>
        ["submitted", "under_review"].includes(d.status),
      ).length,
      issued: docs.filter((d) => d.status === "issued").length,
      needsAction: docs.filter((d) =>
        ["requires_changes", "rejected"].includes(d.status),
      ).length,
    };
  }, [documents]);

  const recent = useMemo(
    () =>
      [...(documents ?? [])]
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .slice(0, 5),
    [documents],
  );

  const columns: Column<DocItem>[] = [
    {
      header: "Document",
      cell: (d) => <span className="font-medium break-words">{d.filename}</span>,
    },
    { header: "Subject", cell: (d) => d.subject },
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
        title="Company Dashboard"
        subtitle={isMock ? DEMO_COMPANY : "Your organisation"}
        icon={LayoutDashboard}
        actions={
          <Button className="gap-2" onClick={() => navigate({ to: "/company/submit" })}>
            <Upload className="h-4 w-4" />
            Submit document
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Submitted" value={stats.total} icon={FileText} hint="Total documents" />
          <StatCard title="Under Review" value={stats.underReview} icon={Clock} hint="Awaiting decision" />
          <StatCard title="Issued" value={stats.issued} icon={Award} hint="Active certificates" />
          <StatCard
            title="Needs Action"
            value={stats.needsAction}
            icon={AlertTriangle}
            hint="Requires your attention"
            valueClassName={stats.needsAction > 0 ? "text-orange-500" : undefined}
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent submissions</h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Submit your first compliance document to get started."
            action={
              <Button onClick={() => navigate({ to: "/company/submit" })}>
                Submit a document
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={recent}
            rowKey={(d) => d.id}
            onRowClick={(d) => navigate({ to: `/certificate/${d.id}` })}
          />
        )}
      </div>
    </div>
  );
}
