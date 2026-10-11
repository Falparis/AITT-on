import { DecisionBadge } from "@/components/shared/DecisionBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge, ScoreMeter } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Building2, Calendar, Download, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { API_BASE_URL } from "../api/config";
import { usePublicRegistry } from "../hooks/data";
import type { DocStatus } from "../mock/types";
import { explorerUrl, formatDate } from "../mock/utils";

const REGISTRY_STATUSES: DocStatus[] = ["issued", "revoked", "expired"];

export default function PublicCompanyProfilePage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const name = decodeURIComponent((params as { name?: string }).name ?? "");
  const { data: documents, isLoading } = usePublicRegistry();

  const certs = useMemo(
    () =>
      (documents ?? []).filter(
        (d) => REGISTRY_STATUSES.includes(d.status) && d.company === name,
      ),
    [documents, name],
  );

  // Compliance score per program (average of that program's certificates).
  const programScores = useMemo(() => {
    const map = new Map<string, { label: string; sum: number; n: number }>();
    for (const d of certs) {
      const label = d.program || d.subject || "—";
      const e = map.get(label) ?? { label, sum: 0, n: 0 };
      if (typeof d.complianceScore === "number") {
        e.sum += d.complianceScore;
        e.n += 1;
      }
      map.set(label, e);
    }
    return [...map.values()].map((e) => ({
      label: e.label,
      score: e.n ? Math.round(e.sum / e.n) : null,
    }));
  }, [certs]);

  if (isLoading) {
    return (
      <div className="container space-y-6 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={Building2}
          title="No public certificates"
          description={`We couldn't find any publicly verifiable certificates for "${name}".`}
          action={
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Back to search
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      <PageHeader title={name} subtitle="Public company profile" icon={Building2} />

      {/* Per-program compliance scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance score by program</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programScores.map((p) => (
            <div key={p.label} className="space-y-2">
              <p className="text-sm font-medium">{p.label}</p>
              {p.score != null ? (
                <ScoreMeter value={p.score} />
              ) : (
                <p className="text-sm text-muted-foreground">Not yet scored</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certified documents */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Certified documents ({certs.length})
        </h2>
        <div className="space-y-3">
          {certs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium break-words">{doc.subject}</span>
                    <StatusBadge status={doc.status} />
                    {doc.reviewStatus && <DecisionBadge decision={doc.reviewStatus} />}
                    {doc.complianceScore != null && <ScoreBadge value={doc.complianceScore} />}
                  </div>
                  <ProgramTag
                    doc={doc}
                    className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                  />
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Certified {formatDate(doc.submittedAt)}
                    </span>
                    {doc.expiryAt && <span>Expires {formatDate(doc.expiryAt)}</span>}
                    <OnChainBadge txHash={doc.txHash} />
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {/* Hidden when no file is stored — see AdminCertificatesPage. */}
                  {doc.hasFile !== false && (
                    <a
                      href={`${API_BASE_URL}/documents/registry/${doc.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </a>
                  )}
                  {doc.txHash && (
                    <a href={explorerUrl(doc.txHash)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="h-4 w-4" /> Blockchain
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => navigate({ to: `/certificate/${doc.id}` })}
                  >
                    View certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
