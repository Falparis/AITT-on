import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { explorerUrl, shortHash } from "../../mock/utils";

/**
 * Shows that an action was anchored on-chain, linking the hash to the public
 * block explorer for the network the backend actually writes to (see
 * api/config.STELLAR_NETWORK).
 *
 * The badge itself is the link: this is the platform's proof-of-authenticity
 * claim, and a claim a viewer cannot check in one click is not proof.
 */
export function OnChainBadge({
  txHash,
  label = "Anchored",
  className,
}: {
  txHash?: string;
  label?: string;
  className?: string;
}) {
  if (!txHash) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground",
          className,
        )}
      >
        Not anchored
      </span>
    );
  }
  return (
    <a
      href={explorerUrl(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20",
        className,
      )}
      title={`${txHash} — view on the Stellar block explorer`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium">{label} ✓</span>
      <span className="font-mono break-all">{shortHash(txHash)}</span>
      <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70" />
    </a>
  );
}
