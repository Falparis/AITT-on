import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, Clock, Inbox, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useDocuments } from "../hooks/data";
import type { DocItem, DocStatus } from "../mock/types";
import { formatDate } from "../mock/utils";

const QUEUE_STATUSES: DocStatus[] = ["submitted", "under_review", "requires_changes"];

export default function ReviewQueuePage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments();

  const queue = useMemo(
    () =>
      (documents ?? [])
        .filter((d) => QUEUE_STATUSES.includes(d.status))
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
    [documents],
  );

  const stats = useMemo(() => {
    const docs = documents ?? [];
    return {
      awaiting: docs.filter((d) => d.status === "submitted").length,
      inReview: docs.filter((d) => d.status === "under_review").length,
      needsChanges: docs.filter((d) => d.status === "requires_changes").length,
    };
  }, [documents]);

  const columns: Column<DocItem>[] = [
    {
      header: "Document",
      cell: (d) => <span className="font-medium break-words">{d.filename}</span>,
    },
    { header: "Company", cell: (d) => d.company },
    { header: "Subject", cell: (d) => d.subject },
    { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
    {
      header: "Submitted",
      cell: (d) => (
        <span className="text-muted-foreground">{formatDate(d.submittedAt)}</span>
      ),
    },
    {
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (d) => (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: `/expert/review/${d.id}` });
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Review Queue"
        subtitle="Documents awaiting legal / compliance review."
        icon={ClipboardList}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Awaiting review" value={stats.awaiting} icon={Inbox} />
          <StatCard title="In review" value={stats.inReview} icon={Clock} />
          <StatCard title="Needs changes" value={stats.needsChanges} icon={RefreshCw} />
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Queue is empty"
          description="There are no documents awaiting review right now."
        />
      ) : (
        <DataTable
          columns={columns}
          data={queue}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate({ to: `/expert/review/${d.id}` })}
        />
      )}
    </div>
  );
}
