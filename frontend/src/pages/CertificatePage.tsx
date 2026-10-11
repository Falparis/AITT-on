import { EmptyState } from "@/components/shared/EmptyState";
import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramTag } from "@/components/shared/ProgramTag";
import { ReviewList } from "@/components/shared/ReviewList";
import { ScoreMeter } from "@/components/shared/ScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WorkflowStepper } from "@/components/shared/WorkflowStepper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  ScrollText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadPublicCertificate } from "../api/files";
import { ApiError } from "../api/types";
import { useDocument } from "../hooks/data";
import { explorerUrl, formatDate } from "../mock/utils";

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof FileText;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <div className="text-sm text-muted-foreground break-words">{children}</div>
      </div>
    </div>
  );
}

export default function CertificatePage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = (params as { id?: string }).id;
  const { data: doc, isLoading } = useDocument(id);
  // Declared before the early returns below — hooks must run unconditionally.
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={ScrollText}
          title="Certificate not found"
          description="This document does not exist or is no longer available."
          action={
            <Button variant="outline" onClick={() => navigate({ to: "/registry" })}>
              Back to registry
            </Button>
          }
        />
      </div>
    );
  }

  // Downloads the actual certificate file from the public registry.
  //
  // This used to build a plain-text summary in the browser and save it as
  // `Certificate_<id>.txt` — a leftover from the demo build, when there was no
  // real file to fetch. On Windows that opens in Notepad, so users clicking
  // "Download" on a PDF certificate got a text file instead of their document.
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPublicCertificate(doc.id, doc.filename || `Certificate_${doc.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not download the certificate file.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title={doc.subject}
        subtitle={doc.filename}
        icon={ScrollText}
        actions={
          <>
            <StatusBadge status={doc.status} />
            {/* `hasFile` is false for workflows created without an upload —
                offering Download there could only ever produce a 404. */}
            {doc.hasFile !== false && (
              <Button
                className="gap-2"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Downloading…" : "Download"}
              </Button>
            )}
          </>
        }
      />

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowStepper status={doc.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Metadata */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Document details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetaRow icon={FileText} label="Filename">
              {doc.filename}
            </MetaRow>
            <MetaRow icon={Building2} label="Company">
              {doc.company}
            </MetaRow>
            <MetaRow icon={ScrollText} label="Compliance program & jurisdiction">
              <ProgramTag doc={doc} />
            </MetaRow>
            <MetaRow icon={Calendar} label="Submitted">
              {formatDate(doc.submittedAt)}
              {doc.expiryAt && ` · Expires ${formatDate(doc.expiryAt)}`}
            </MetaRow>
            <MetaRow icon={Hash} label="SHA-256 hash">
              <span className="font-mono text-xs break-all">{doc.hash}</span>
            </MetaRow>
            <MetaRow icon={ExternalLink} label="On-chain anchor">
              {doc.txHash ? (
                <div className="flex flex-wrap items-center gap-2">
                  <OnChainBadge txHash={doc.txHash} />
                  <a
                    href={explorerUrl(doc.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View on explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <OnChainBadge />
              )}
            </MetaRow>
          </CardContent>
        </Card>

        {/* Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance</CardTitle>
            <CardDescription>Overall assessed score</CardDescription>
          </CardHeader>
          <CardContent>
            {doc.complianceScore != null ? (
              <ScoreMeter value={doc.complianceScore} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Not yet scored — awaiting review.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Sub-admin reviews ({doc.reviews.length})
          </CardTitle>
          <CardDescription>
            Independent legal/compliance reviews, each anchored on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewList reviews={doc.reviews} />
        </CardContent>
      </Card>
    </div>
  );
}
