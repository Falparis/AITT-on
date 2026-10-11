import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Award, Ban, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "../api/config";
import { ApiError } from "../api/types";
import { useCreateProposal, useDocuments } from "../hooks/data";
import type { DocItem } from "../mock/types";
import { formatDate } from "../mock/utils";

// The Certificates page is a REGISTRY of completed certifications only —
// no review or issuance activity happens here (that lives under Workflows).
const COMPLETED = ["issued", "revoked", "expired"];

export default function AdminCertificatesPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments();
  const createProposal = useCreateProposal();
  const [search, setSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<DocItem | null>(null);

  const filtered = useMemo(() => {
    const docs = [...(documents ?? [])]
      .filter((d) => COMPLETED.includes(d.status))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.company.toLowerCase().includes(q) ||
        (d.program ?? d.subject ?? "").toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q),
    );
  }, [documents, search]);

  // Revocation is an exceptional governance action — it opens a multi-sig proposal.
  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const doc = revokeTarget;
    try {
      await createProposal.mutateAsync({
        type: "revocation",
        title: `Revoke certificate for ${doc.company}`,
        description: `Proposal to revoke the certificate for ${doc.company} (${doc.program ?? doc.subject}). Requires multi-signature approval before it takes effect.`,
        targetRef: doc.id,
      });
      setRevokeTarget(null);
      toast.success("Revocation proposal opened — pending multi-sig approval");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open proposal");
    }
  };

  const columns: Column<DocItem>[] = [
    {
      header: "Certificate ID",
      cell: (d) => <span className="font-mono text-xs">{d.id.slice(-8)}</span>,
    },
    { header: "Company", cell: (d) => <span className="font-medium break-words">{d.company}</span> },
    { header: "Compliance Program", cell: (d) => <ProgramTag doc={d} /> },
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
      header: "Issue Date",
      cell: (d) => <span className="text-muted-foreground">{formatDate(d.submittedAt)}</span>,
    },
    {
      header: "Status",
      cell: (d) => <StatusBadge status={d.status} />,
    },
    { header: "Blockchain", cell: (d) => <OnChainBadge txHash={d.txHash} /> },
    {
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (d) => (
        <div className="flex justify-end gap-2">
          {/* Hidden when no file is stored: the link would open a raw JSON 404
              in a new tab, which reads as a broken site. */}
          {d.hasFile !== false && (
            <a
              href={`${API_BASE_URL}/documents/registry/${d.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline" className="gap-1">
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
          )}
          {d.status === "issued" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setRevokeTarget(d);
              }}
            >
              <Ban className="h-4 w-4" /> Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Certificates"
        subtitle="Registry of completed, blockchain-verifiable certifications."
        icon={Award}
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company, program or ID…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate({ to: `/certificate/${d.id}` })}
          emptyMessage="No certificates issued yet."
        />
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Open a revocation proposal?"
        description={
          <>
            Revoking the certificate for <strong>{revokeTarget?.company}</strong> is
            an exceptional action. It creates a <strong>multi-signature governance
            proposal</strong> and only takes effect once the required signers approve
            — it does not revoke immediately.
          </>
        }
        confirmLabel="Open proposal"
        onConfirm={handleRevoke}
      />
    </div>
  );
}
