import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { FileCheck2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useCompliancePrograms, useSubmitDocument } from "../hooks/data";

// Only compliance DOCUMENTS may be submitted — no videos, images, archives or apps.
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS, ...ACCEPTED_MIME_TYPES].join(",");

// Max upload size — keep in sync with the backend MAX_UPLOAD_BYTES (10 MB).
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Returns a human-readable reason if the file is NOT an accepted document, else null.
// Checked the moment a file is selected, so bad/oversized files are rejected up
// front — before any upload happens.
function fileRejectionReason(file: File): string | null {
  const name = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!extOk) {
    return `"${file.name}" is not a supported document. Only PDF and Word files (.pdf, .doc, .docx) are allowed — videos, images and applications are not accepted.`;
  }
  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" doesn't appear to be a valid document (detected type: ${file.type}). Only PDF and Word documents are allowed.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" is ${mb} MB, which exceeds the ${MAX_UPLOAD_MB} MB limit. Please upload a smaller document.`;
  }
  return null;
}

export default function SubmitDocumentPage() {
  const navigate = useNavigate();
  const { data: programs } = useCompliancePrograms();
  const submitDocument = useSubmitDocument();

  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    const reason = fileRejectionReason(f);
    if (reason) {
      toast.error(reason);
      return;
    }
    setFile(f);
    if (!name.trim()) setName(f.name);
  }, [name]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a document name");
    if (!programId) return toast.error("Please select a compliance program");
    if (!file) return toast.error("Please attach a PDF or .docx file");

    const program = (programs ?? []).find((p) => p.id === programId);
    try {
      await submitDocument.mutateAsync({
        file,
        programId,
        subject: program?.name,
        filename: name.trim(),
      });
      toast.success("Document submitted for review");
      navigate({ to: "/company/documents" });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not submit the document",
      );
    }
  };

  const isBusy = submitDocument.isPending;

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Submit Workflow"
        subtitle="Create a compliance workflow for review."
        icon={FileCheck2}
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Workflow details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="doc-name">Workflow name</Label>
                <Input
                  id="doc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. EU AI Act Conformity Declaration"
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label>Compliance program</Label>
                {(programs ?? []).length === 0 ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    No compliance programs are available yet. Please contact your
                    admin to add a compliance program before creating a workflow.
                  </div>
                ) : (
                  <Select value={programId} onValueChange={setProgramId} disabled={isBusy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a compliance program" />
                    </SelectTrigger>
                    <SelectContent>
                      {(programs ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.jurisdiction === "EU" ? "🇪🇺 EU" : "🇺🇸 US"} · {p.name} ({p.typeLabel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>File — documents only, max {MAX_UPLOAD_MB} MB (PDF or Word: .pdf, .doc, .docx)</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  } ${isBusy ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input
                    type="file"
                    accept={ACCEPT_ATTR}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                    className="hidden"
                    id="doc-file"
                    disabled={isBusy}
                  />
                  <label htmlFor="doc-file" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      {file ? (
                        <p className="font-medium break-all">{file.name}</p>
                      ) : (
                        <>
                          <p className="font-medium">Drag and drop your file here</p>
                          <p className="text-sm text-muted-foreground">or click to select</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  A SHA-256 hash of the file is computed and anchored on-chain
                  with the submission.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isBusy || (programs ?? []).length === 0}
              >
                {submitDocument.isPending ? "Submitting…" : "Submit for review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
