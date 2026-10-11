import { DecisionBadge } from "@/components/shared/DecisionBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReviewList } from "@/components/shared/ReviewList";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { scoreTextClass } from "@/components/shared/ScoreBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, Building2, FileText, Hash, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useAddReview, useDocument } from "../hooks/data";
import { DEMO_REVIEWER } from "../mock/identity";
import type { ReviewDecision } from "../mock/types";
import { fakeSha256, fakeTxHash, formatDate, nowISO } from "../mock/utils";

const DECISIONS: { value: ReviewDecision; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "approved_with_recommendations", label: "Approved with Recommendations" },
  { value: "requires_changes", label: "Requires Changes" },
  { value: "rejected", label: "Rejected" },
];

const LOCKED_STATUSES = ["issued", "revoked", "expired"];

export default function DocumentReviewPage() {
  const navigate = useNavigate();
  const { isMock, role } = useAuth();
  const params = useParams({ strict: false });
  const id = (params as { id?: string }).id;
  const { data: doc, isLoading } = useDocument(id);
  const addReview = useAddReview();
  // The review page is shared by sub-admins (queue) and the Main Admin (docs).
  const backTo = role === "admin" ? "/admin/documents" : "/expert";

  const [comment, setComment] = useState("");
  const [decision, setDecision] = useState<ReviewDecision | "">("");
  const [score, setScore] = useState(75);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={ScrollText}
          title="Document not found"
          description="This document does not exist or is no longer available."
          action={
            <Button variant="outline" onClick={() => navigate({ to: backTo })}>
              {role === "admin" ? "Back to documents" : "Back to queue"}
            </Button>
          }
        />
      </div>
    );
  }

  const locked = LOCKED_STATUSES.includes(doc.status);

  const setScoreClamped = (v: number) => {
    if (Number.isNaN(v)) return setScore(0);
    setScore(Math.max(0, Math.min(100, Math.round(v))));
  };

  const handleSubmit = async () => {
    if (!decision) return toast.error("Please select a review decision");
    if (!comment.trim()) return toast.error("Please add a comment / recommendation");

    try {
      // In real mode the backend sets reviewer/date/commentHash/txHash; these
      // placeholders only matter for the mock store.
      await addReview.mutateAsync({
        docId: doc.id,
        review: {
          reviewer: DEMO_REVIEWER,
          decision,
          complianceScore: score,
          comment: comment.trim(),
          date: nowISO(),
          commentHash: fakeSha256(),
          txHash: fakeTxHash(),
        },
      });
      toast.success(
        role === "admin"
          ? "Review recorded ✓"
          : "Review recorded and anchored on-chain ✓",
      );
      navigate({ to: backTo });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record review");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title={doc.subject}
        subtitle={doc.filename}
        icon={FileText}
        actions={<StatusBadge status={doc.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document + previous reviews */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="break-words">{doc.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="break-words">{doc.subject}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Submitted {formatDate(doc.submittedAt)}</span>
              </div>
              <div className="flex items-start gap-2">
                <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs break-all">{doc.hash}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Previous reviews ({doc.reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewList reviews={doc.reviews} emptyText="No prior reviews." />
            </CardContent>
          </Card>
        </div>

        {/* Review form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Your review</CardTitle>
            <CardDescription>
              {isMock ? (
                <>
                  Reviewing as <span className="font-medium">{DEMO_REVIEWER}</span>.{" "}
                </>
              ) : null}
              Your decision, score and a comment hash are anchored on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {locked && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  This document is <strong>{doc.status}</strong> and can no longer
                  be reviewed.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Comment / recommendations</Label>
              <Textarea
                id="comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Document your assessment, findings and any required changes…"
                disabled={locked || addReview.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Decision</Label>
              <RadioGroup
                value={decision}
                onValueChange={(v) => setDecision(v as ReviewDecision)}
                disabled={locked || addReview.isPending}
              >
                {DECISIONS.map((d) => (
                  <label
                    key={d.value}
                    htmlFor={`decision-${d.value}`}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-3">
                      <RadioGroupItem id={`decision-${d.value}`} value={d.value} />
                      <span className="text-sm font-medium">{d.label}</span>
                    </span>
                    <DecisionBadge decision={d.value} />
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="score-input">Compliance score</Label>
                <span className={cn("text-lg font-bold", scoreTextClass(score))}>
                  {score}%
                </span>
              </div>
              <Slider
                value={[score]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setScoreClamped(v[0])}
                disabled={locked || addReview.isPending}
              />
              <Input
                id="score-input"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScoreClamped(Number(e.target.value))}
                className="w-24"
                disabled={locked || addReview.isPending}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={locked || addReview.isPending}
            >
              {addReview.isPending ? "Anchoring…" : "Submit review & anchor on-chain"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
