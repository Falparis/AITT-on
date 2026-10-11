import { OnChainBadge } from "@/components/shared/OnChainBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Hash,
  ScrollText,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { verifyByHash, type VerifyResult } from "../api/files";
import { formatDate } from "../mock/utils";

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function VerificationPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".doc") && !name.endsWith(".docx")) {
      toast.error(
        `"${file.name}" is not a supported document. Only PDF or Word files (.pdf, .doc, .docx) can be verified.`,
      );
      return;
    }
    setIsVerifying(true);
    try {
      const hash = await sha256Hex(file);
      const res = await verifyByHash(hash);
      setResult(res);
      if (res.verified) {
        toast.success("Document verified — authentic ✓");
      } else if (res.document) {
        toast.message(`Document found but its certificate is ${res.document.status}.`);
      } else {
        toast.error("No matching document found");
      }
    } catch {
      toast.error("Error during verification");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = "";
    },
    [handleFileUpload],
  );

  const doc = result?.document ?? null;

  return (
    <div className="container py-8 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-primary" />
          Document Verification
        </h1>
        <p className="text-muted-foreground">
          Verify the authenticity of a document by its SHA-256 hash — no sign-in
          required.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload a document to verify
          </CardTitle>
          <CardDescription>
            The file is hashed in your browser and checked against the registry —
            it is never uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            } ${isVerifying ? "pointer-events-none opacity-50" : ""}`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
              id="verify-file-upload"
              disabled={isVerifying}
            />
            <label htmlFor="verify-file-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isVerifying
                      ? "Verifying…"
                      : "Drag and drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to select</p>
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card className={result.verified ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.verified ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-green-600">Authentic document</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-red-600">
                    {doc ? "Found — not an active certificate" : "Not verified"}
                  </span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {result.verified
                ? "This document matches an issued certificate in the registry."
                : doc
                  ? "A matching document exists but its certificate is not currently active."
                  : "No document with this hash was found in the registry."}
            </CardDescription>
          </CardHeader>
          {doc && (
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Filename</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {doc.filename}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {doc.company}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ScrollText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Subject</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {doc.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={doc.status} />
                      {doc.expiryAt && (
                        <span className="text-xs text-muted-foreground">
                          Expires {formatDate(doc.expiryAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">SHA-256 hash</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {result.hash}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">On-chain anchor</p>
                    <OnChainBadge txHash={doc.txHash} />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
          <CardContent>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full"
            >
              Verify another document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How does verification work?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Your file is hashed locally with SHA-256 — it never leaves your device.</p>
          <p>2. The hash is unique to the file and changes if a single byte is modified.</p>
          <p>3. We look the hash up against the anchored registry.</p>
          <p>4. A match on an issued certificate confirms the document is authentic.</p>
        </CardContent>
      </Card>
    </div>
  );
}
