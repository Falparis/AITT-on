import { DecisionBadge } from "@/components/shared/DecisionBadge";
import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { Separator } from "@/components/ui/separator";
import type { Review } from "../../mock/types";
import { formatDate } from "../../mock/utils";

export function ReviewList({
  reviews,
  emptyText = "No reviews yet.",
}: {
  reviews: Review[];
  emptyText?: string;
}) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, i) => (
        <div key={i} className="space-y-3">
          {i > 0 && <Separator />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium break-words">{review.reviewer}</span>
              <DecisionBadge decision={review.decision} />
              <ScoreBadge value={review.complianceScore} />
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(review.date)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground break-words">
            {review.comment}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="break-all">
              Comment hash: <span className="font-mono">{review.commentHash}</span>
            </span>
            <OnChainBadge txHash={review.txHash} />
          </div>
        </div>
      ))}
    </div>
  );
}
