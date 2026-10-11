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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import {
  useCompanies,
  useCompliancePrograms,
  useCreateWorkflow,
  useSubAdmins,
} from "../hooks/data";

/**
 * Create Workflow — a certification case. Fields: Company, Compliance Program,
 * Assigned Reviewer (Main Admin or a Sub-Admin). The selected program provides
 * Service Type + Jurisdiction automatically (shown read-only). No file upload —
 * supporting documents live off-platform (Airtable, Drive, etc.).
 */
export function CreateWorkflowModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: companies } = useCompanies();
  const { data: programs } = useCompliancePrograms();
  const { data: subAdmins } = useSubAdmins();
  const createWorkflow = useCreateWorkflow();

  const [companyId, setCompanyId] = useState("");
  const [programId, setProgramId] = useState("");
  const [reviewerId, setReviewerId] = useState("");

  const activeCompanies = useMemo(
    () => (companies ?? []).filter((c) => c.status === "active"),
    [companies],
  );
  const program = useMemo(
    () => (programs ?? []).find((p) => p.id === programId),
    [programs, programId],
  );

  const reset = () => {
    setCompanyId("");
    setProgramId("");
    setReviewerId("");
  };

  const handleSubmit = async () => {
    if (!companyId) return toast.error("Please select a company");
    if (!programId) return toast.error("Please select a compliance program");
    const company = activeCompanies.find((c) => c.id === companyId);
    try {
      await createWorkflow.mutateAsync({
        companyId,
        programId,
        assignedReviewerId: reviewerId || undefined,
        subject: program?.name,
        name: program ? `${program.name} — ${company?.name ?? ""}`.trim() : undefined,
      });
      toast.success("Workflow created");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create the workflow");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Start a new certification case. Supporting documents are collected
            outside the platform — only the final certificate is stored here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {activeCompanies.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No approved companies yet
                  </div>
                ) : (
                  activeCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Compliance Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a compliance program" />
              </SelectTrigger>
              <SelectContent>
                {(programs ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.jurisdiction === "EU" ? "🇪🇺 EU" : "🇺🇸 US"} · {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {program && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Service Type</p>
                <p className="font-medium">{program.typeLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jurisdiction</p>
                <p className="font-medium">
                  {program.jurisdiction === "EU" ? "🇪🇺 European Union" : "🇺🇸 United States"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Assigned Reviewer</Label>
            <Select value={reviewerId} onValueChange={setReviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reviewer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main_admin">Main Admin</SelectItem>
                {(subAdmins ?? [])
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createWorkflow.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createWorkflow.isPending}>
            {createWorkflow.isPending ? "Creating…" : "Create Workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
