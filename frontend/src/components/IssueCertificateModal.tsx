import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, UploadCloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useIssueCertificate } from "../hooks/data";
import type { DocItem } from "../mock/types";

/**
 * Issue Certificate — the Main Admin uploads the Final Certificate PDF (the only
 * file the platform stores) and issues. Issuing anchors the certificate on-chain
 * and publishes it to the public registry.
 */
export function IssueCertificateModal({
  workflow,
  open,
  onOpenChange,
}: {
  workflow: DocItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const issue = useIssueCertificate();
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (f?: File) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("The final certificate must be a PDF");
      return;
    }
    setFile(f);
  };

  const handleIssue = async () => {
    if (!workflow) return;
    try {
      await issue.mutateAsync({ docId: workflow.id, file: file ?? undefined });
      toast.success("Certificate issued — anchored on-chain ✓");
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not issue certificate");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setFile(null);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
          <DialogDescription>
            {workflow ? (
              <>
                Upload the Final Certificate PDF for{" "}
                <strong>{workflow.company}</strong> and issue. This anchors the
                certificate on the blockchain and publishes it to the public registry.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Final Certificate PDF</Label>
          <label
            htmlFor="final-cert-pdf"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50"
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium break-all">{file.name}</span>
                <span className="text-xs text-muted-foreground">Click to choose a different file</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload the certificate PDF</span>
                <span className="text-xs text-muted-foreground">PDF only</span>
              </>
            )}
          </label>
          <input
            id="final-cert-pdf"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={issue.isPending}>
            Cancel
          </Button>
          <Button onClick={handleIssue} disabled={issue.isPending}>
            {issue.isPending ? "Issuing…" : "Issue Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
