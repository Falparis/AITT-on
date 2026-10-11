import { EmptyState } from "@/components/shared/EmptyState";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  Hash,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePublicRegistry } from "../hooks/data";
import type { DocStatus } from "../mock/types";
import { formatDate } from "../mock/utils";

const REGISTRY_STATUSES: DocStatus[] = ["issued", "revoked", "expired"];

export default function PublicPortalPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = usePublicRegistry();
  const [search, setSearch] = useState("");
  const [certId, setCertId] = useState("");

  const registry = useMemo(
    () => (documents ?? []).filter((d) => REGISTRY_STATUSES.includes(d.status)),
    [documents],
  );

  const q = search.trim().toLowerCase();

  const companies = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; scoreSum: number; scoreN: number }
    >();
    for (const d of registry) {
      if (!d.company) continue;
      const e = map.get(d.company) ?? { name: d.company, count: 0, scoreSum: 0, scoreN: 0 };
      e.count += 1;
      if (typeof d.complianceScore === "number") {
        e.scoreSum += d.complianceScore;
        e.scoreN += 1;
      }
      map.set(d.company, e);
    }
    return [...map.values()]
      .map((e) => ({
        name: e.name,
        count: e.count,
        avgScore: e.scoreN ? Math.round(e.scoreSum / e.scoreN) : null,
      }))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registry, q]);

  const certificates = useMemo(
    () =>
      registry.filter(
        (d) =>
          !q ||
          d.company.toLowerCase().includes(q) ||
          d.subject.toLowerCase().includes(q) ||
          (d.program ?? "").toLowerCase().includes(q) ||
          d.filename.toLowerCase().includes(q),
      ),
    [registry, q],
  );

  const goToCertificate = () => {
    const id = certId.trim();
    if (id) navigate({ to: `/certificate/${id}` });
  };

  return (
    <div className="container space-y-10 py-10">
      {/* Hero — the main introduction to the platform (above the public registry). */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Trusted AI Compliance Platform
          </Badge>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              AITT – AI Transparency Token
            </h1>
            <p className="text-2xl font-semibold text-muted-foreground sm:text-3xl">
              The AI Compliance &amp; Certification Platform
            </p>
          </div>
          <p className="max-w-xl text-muted-foreground">
            Manage AI governance, transparency and risk management from a single
            platform. Review, certify and publicly verify AI compliance with expert
            oversight.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate({ to: "/signin" })}>
              Start Compliance <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/registry" })}
            >
              Explore Registry
            </Button>
          </div>
        </div>
        <figure className="space-y-2">
          <div className="aspect-[16/10] overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-100 via-primary/10 to-amber-50 shadow-sm dark:from-emerald-950/40 dark:via-primary/10 dark:to-amber-950/30">
            <img
              src="/hero-aitt.jpeg"
              alt="AITT — AI compliance, certification, governance and blockchain verification"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <figcaption className="text-center text-xs text-muted-foreground">
            AI-generated image
          </figcaption>
        </figure>
      </section>

      {/* Search */}
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies or certificates…"
            className="h-12 pl-10 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Certificate ID"
                className="pl-9"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToCertificate()}
              />
            </div>
            <Button variant="outline" onClick={goToCertificate}>
              Verify ID
            </Button>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: "/verification" })}
          >
            <FileCheck2 className="h-4 w-4" />
            Verify a document by file
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mx-auto h-64 w-full max-w-4xl" />
      ) : (
        <div className="space-y-10">
          {/* Companies */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-muted-foreground" /> Companies
              <span className="text-sm font-normal text-muted-foreground">
                ({companies.length})
              </span>
            </h2>
            {companies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No companies found"
                description={
                  q ? "No companies match your search." : "Certified companies will appear here."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {companies.map((c) => (
                  <Card
                    key={c.name}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() =>
                      navigate({ to: `/company-profile/${encodeURIComponent(c.name)}` })
                    }
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="break-words">{c.name}</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">
                        {c.count} certificate{c.count === 1 ? "" : "s"}
                      </Badge>
                      {c.avgScore != null && <ScoreBadge value={c.avgScore} />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Certificates */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ScrollText className="h-5 w-5 text-muted-foreground" /> Certificates
              <span className="text-sm font-normal text-muted-foreground">
                ({certificates.length})
              </span>
            </h2>
            {certificates.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title="No certificates found"
                description={
                  q ? "No certificates match your search." : "Issued certificates will appear here."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((doc) => (
                  <Card
                    key={doc.id}
                    className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                    onClick={() => navigate({ to: `/certificate/${doc.id}` })}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="break-words text-base">{doc.subject}</CardTitle>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{doc.company}</p>
                      <ProgramTag
                        doc={doc}
                        className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                      />
                    </CardHeader>
                    <CardContent className="mt-auto flex items-center justify-between gap-2">
                      {doc.complianceScore != null ? (
                        <ScoreBadge value={doc.complianceScore} />
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.submittedAt)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
