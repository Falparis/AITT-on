import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProposalStatusBadge } from "@/components/shared/ProposalStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Scale, Settings, ShieldCheck } from "lucide-react";
import { useGovernance, useProposals } from "../hooks/data";
import { PROPOSAL_TYPE_LABEL } from "../mock/labels";
import type { Proposal } from "../mock/types";
import { formatDate } from "../mock/utils";

export default function GovernanceDashboardPage() {
  const navigate = useNavigate();
  const { data: proposals, isLoading } = useProposals();
  const { data: gov } = useGovernance();

  const columns: Column<Proposal>[] = [
    {
      header: "Type",
      cell: (p) => <Badge variant="outline">{PROPOSAL_TYPE_LABEL[p.type]}</Badge>,
    },
    {
      header: "Title",
      cell: (p) => <span className="font-medium break-words">{p.title}</span>,
    },
    {
      header: "Approvals",
      cell: (p) => (
        <span className="font-mono">
          {p.approvals}/{p.threshold}
        </span>
      ),
    },
    { header: "Status", cell: (p) => <ProposalStatusBadge status={p.status} /> },
    {
      header: "Created",
      cell: (p) => (
        <span className="text-muted-foreground">{formatDate(p.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Governance"
        subtitle="Multi-signature proposals for exceptional actions only."
        icon={Scale}
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate({ to: "/admin/governance/settings" })}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              className="gap-2"
              onClick={() => navigate({ to: "/admin/governance/new" })}
            >
              <Plus className="h-4 w-4" />
              Create proposal
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current approval threshold</p>
            <p className="text-lg font-bold">
              {gov ? `${gov.governance.required}-of-${gov.governance.total}` : "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                signatures required
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={proposals ?? []}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate({ to: `/admin/governance/${p.id}` })}
          emptyMessage="No proposals yet."
        />
      )}
    </div>
  );
}
