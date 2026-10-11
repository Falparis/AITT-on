import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useApproveCompany, useCompanies, useRemoveCompany } from "../hooks/data";
import type { Company } from "../mock/types";
import { formatDate, shortHash } from "../mock/utils";

export default function AdminCompaniesPage() {
  const { data: companies, isLoading } = useCompanies();
  const approveCompany = useApproveCompany();
  const removeCompany = useRemoveCompany();
  const [removeTarget, setRemoveTarget] = useState<Company | null>(null);

  const handleApprove = async (company: Company) => {
    try {
      await approveCompany.mutateAsync(company.id);
      toast.success(`${company.name} approved`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve company");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const name = removeTarget.name;
    try {
      await removeCompany.mutateAsync(removeTarget.id);
      setRemoveTarget(null);
      toast.success(`${name} removed`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove company");
    }
  };

  const columns: Column<Company>[] = [
    {
      header: "Company",
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-medium break-words">{c.name}</p>
          <p className="text-xs text-muted-foreground break-words">{c.email}</p>
        </div>
      ),
    },
    {
      header: "Wallet",
      cell: (c) => (
        <span className="font-mono text-xs text-muted-foreground">
          {shortHash(c.wallet)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (c) =>
        c.status === "active" ? (
          <Badge className="border-transparent bg-primary text-primary-foreground">
            Active
          </Badge>
        ) : (
          <Badge className="border-transparent bg-amber-500 text-white">Pending</Badge>
        ),
    },
    { header: "Docs", cell: (c) => c.documents },
    {
      header: "Joined",
      cell: (c) => (
        <span className="text-muted-foreground">{formatDate(c.joinedAt)}</span>
      ),
    },
    {
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (c) => {
        // Only the row being approved shows the pending state (not every button).
        const approving =
          approveCompany.isPending && approveCompany.variables === c.id;
        return (
        <div className="flex justify-end gap-2">
          {c.status === "pending" && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => handleApprove(c)}
              disabled={approving}
            >
              <Check className="h-4 w-4" />
              {approving ? "Approving…" : "Approve"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setRemoveTarget(c)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
        );
      },
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Companies & Users"
        subtitle="Approve registrations and manage company accounts."
        icon={Building2}
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={companies ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No companies registered yet."
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove company?"
        description={
          <>
            This will remove <strong>{removeTarget?.name}</strong> from the
            platform. This cannot be undone.
          </>
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  );
}
