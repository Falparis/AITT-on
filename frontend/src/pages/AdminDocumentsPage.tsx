import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { WorkflowStatusBadge } from "@/components/shared/WorkflowStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateWorkflowModal } from "../components/CreateWorkflowModal";
import { IssueCertificateModal } from "../components/IssueCertificateModal";
import { useDocuments } from "../hooks/data";
import type { DocItem } from "../mock/types";

type WorkflowFilter = "all" | "in_progress" | "completed";

const FILTER_OPTIONS: { value: WorkflowFilter; label: string }[] = [
  { value: "all", label: "All workflows" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function AdminDocumentsPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkflowFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<DocItem | null>(null);

  const filtered = useMemo(() => {
    let docs = [...(documents ?? [])].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    );
    if (filter !== "all") docs = docs.filter((d) => (d.workflowStatus ?? "in_progress") === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      docs = docs.filter(
        (d) =>
          d.company.toLowerCase().includes(q) ||
          (d.program ?? d.subject ?? "").toLowerCase().includes(q) ||
          (d.assignedReviewer ?? "").toLowerCase().includes(q),
      );
    }
    return docs;
  }, [documents, search, filter]);

  const columns: Column<DocItem>[] = [
    { header: "Company", cell: (d) => <span className="font-medium break-words">{d.company}</span> },
    { header: "Compliance Program", cell: (d) => <ProgramTag doc={d} /> },
    {
      header: "Reviewer",
      cell: (d) =>
        d.assignedReviewer ? (
          d.assignedReviewer
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
    },
    { header: "Status", cell: (d) => <WorkflowStatusBadge status={d.workflowStatus} /> },
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
      header: "",
      cell: (d) => {
        if (d.workflowStatus === "completed") {
          return <span className="text-muted-foreground">—</span>;
        }
        const issuable = ["approved", "approved_with_recommendations"].includes(d.status);
        return issuable ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIssueTarget(d);
            }}
          >
            Issue
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: `/admin/review/${d.id}` });
            }}
          >
            Review
          </Button>
        );
      },
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Workflows"
          subtitle="Every certification case across the platform."
          icon={Workflow}
        />
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create Workflow
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company, program or reviewer…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as WorkflowFilter)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate({ to: `/certificate/${d.id}` })}
          emptyMessage="No workflows match your filters."
        />
      )}

      <CreateWorkflowModal open={createOpen} onOpenChange={setCreateOpen} />
      <IssueCertificateModal
        workflow={issueTarget}
        open={!!issueTarget}
        onOpenChange={(o) => !o && setIssueTarget(null)}
      />
    </div>
  );
}
