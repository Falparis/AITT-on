import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Calendar, ScrollText, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { usePublicRegistry } from "../hooks/data";
import type { DocStatus } from "../mock/types";
import { formatDate } from "../mock/utils";

// Certificates that have reached the public registry.
const REGISTRY_STATUSES: DocStatus[] = ["issued", "revoked", "expired"];

export default function RegistryPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = usePublicRegistry();
  const [search, setSearch] = useState("");

  const certificates = useMemo(() => {
    const issued = (documents ?? []).filter((d) =>
      REGISTRY_STATUSES.includes(d.status),
    );
    const q = search.trim().toLowerCase();
    if (!q) return issued;
    return issued.filter(
      (d) =>
        d.company.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        (d.program ?? "").toLowerCase().includes(q) ||
        (d.jurisdiction ?? "").toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q),
    );
  }, [documents, search]);

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Certificate Registry"
        subtitle="Publicly verifiable AI compliance certificates anchored on-chain."
        icon={ScrollText}
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company, subject or file…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No certificates found"
          description={
            search
              ? "No certificates match your search."
              : "Issued certificates will appear here once the admin issues them."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="break-words text-base">
                    {doc.subject}
                  </CardTitle>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{doc.company}</span>
                </div>
                <ProgramTag
                  doc={doc}
                  className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                />
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Compliance score
                  </span>
                  {doc.complianceScore != null ? (
                    <ScoreBadge value={doc.complianceScore} />
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Issued {formatDate(doc.submittedAt)}</span>
                  </div>
                  {doc.expiryAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Expires {formatDate(doc.expiryAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate({ to: `/certificate/${doc.id}` })}
                >
                  View certificate
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
