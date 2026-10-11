import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useCompanyDocuments } from "../hooks/data";
import { DEMO_COMPANY } from "../mock/identity";
import type { DocItem } from "../mock/types";
import { formatDate } from "../mock/utils";

export default function MyDocumentsPage() {
  const navigate = useNavigate();
  const { isMock } = useAuth();
  const { data: documents, isLoading } = useCompanyDocuments(DEMO_COMPANY);

  const sorted = useMemo(
    () =>
      [...(documents ?? [])].sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt),
      ),
    [documents],
  );

  const columns: Column<DocItem>[] = [
    {
      header: "Workflow",
      cell: (d) => <span className="font-medium break-words">{d.filename}</span>,
    },
    { header: "Program", cell: (d) => <ProgramTag doc={d} /> },
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
    {
      header: "On-chain",
      cell: (d) => <OnChainBadge txHash={d.txHash} />,
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="My Workflows"
        subtitle={
          isMock
            ? `All workflows for ${DEMO_COMPANY}.`
            : "All workflows submitted by your organisation."
        }
        icon={FileText}
        actions={
          <Button className="gap-2" onClick={() => navigate({ to: "/company/submit" })}>
            <Upload className="h-4 w-4" />
            Submit workflow
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No workflows yet"
          description="Submit your first compliance workflow for review."
          action={
            <Button onClick={() => navigate({ to: "/company/submit" })}>
              Submit a workflow
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={sorted}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate({ to: `/certificate/${d.id}` })}
        />
      )}
    </div>
  );
}
