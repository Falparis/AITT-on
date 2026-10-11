import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Archive, ArchiveRestore, Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import {
  useArchiveProgram,
  useAssignProgramSubAdmins,
  useCompliancePrograms,
  useCreateProgram,
  useDeleteProgram,
  useSubAdmins,
  useUpdateProgram,
} from "../hooks/data";
import type {
  ComplianceProgram,
  Jurisdiction,
  ProgramType,
} from "../mock/types";

interface ProgramForm {
  id?: string;
  name: string;
  type: ProgramType;
  jurisdiction: Jurisdiction;
  description: string;
}

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  EU: "🇪🇺 EU",
  US: "🇺🇸 US",
};

function ProgramList({
  type,
  programs,
  isLoading,
  onEdit,
  onAssign,
  onArchive,
  onDelete,
}: {
  type: ProgramType;
  programs: ComplianceProgram[];
  isLoading: boolean;
  onEdit: (p: ComplianceProgram) => void;
  onAssign: (p: ComplianceProgram) => void;
  onArchive: (p: ComplianceProgram) => void;
  onDelete: (p: ComplianceProgram) => void;
}) {
  const rows = programs.filter((p) => p.type === type);
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No programs yet"
        description="Create a compliance program to get started."
      />
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <div
          key={p.id}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium break-words">{p.name}</p>
              <Badge variant="secondary">{JURISDICTION_LABEL[p.jurisdiction]}</Badge>
              {p.archived && <Badge variant="outline">Archived</Badge>}
            </div>
            {p.description && (
              <p className="text-sm text-muted-foreground break-words">{p.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {p.assignedSubAdmins.length > 0
                ? `Sub-admins: ${p.assignedSubAdmins.map((a) => a.name || a.email || a.id).join(", ")}`
                : "No sub-admins assigned"}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onAssign(p)}>
              <Users className="h-4 w-4" /> Assign
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onEdit(p)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onArchive(p)}>
              {p.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" /> Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" /> Archive
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => onDelete(p)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminComplianceProgramsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: programs, isLoading } = useCompliancePrograms({ includeArchived: showArchived });
  const { data: subAdmins } = useSubAdmins();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const archiveProgram = useArchiveProgram();
  const deleteProgram = useDeleteProgram();
  const assignSubAdmins = useAssignProgramSubAdmins();

  const [form, setForm] = useState<ProgramForm | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ComplianceProgram | null>(null);
  const [assignTarget, setAssignTarget] = useState<ComplianceProgram | null>(null);
  const [assignIds, setAssignIds] = useState<string[]>([]);

  const list = programs ?? [];

  const openCreate = () =>
    setForm({ name: "", type: "expert_support", jurisdiction: "EU", description: "" });

  const openAssign = (p: ComplianceProgram) => {
    setAssignTarget(p);
    setAssignIds(p.assignedSubAdmins.map((a) => a.id));
  };

  const saveProgram = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Please enter a program name");
    const input = {
      name: form.name.trim(),
      type: form.type,
      jurisdiction: form.jurisdiction,
      description: form.description.trim(),
    };
    try {
      if (form.id) {
        await updateProgram.mutateAsync({ id: form.id, input });
        toast.success("Program updated");
      } else {
        await createProgram.mutateAsync(input);
        toast.success("Compliance program created");
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save program");
    }
  };

  const saveAssignees = async () => {
    if (!assignTarget) return;
    try {
      await assignSubAdmins.mutateAsync({ id: assignTarget.id, subAdminIds: assignIds });
      toast.success("Sub-admins updated");
      setAssignTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not assign sub-admins");
    }
  };

  const toggleAssign = (id: string) =>
    setAssignIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Compliance Programs"
        subtitle="Configure the compliance programs offered by AITT and manage each certification pathway."
        icon={Layers}
        actions={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Compliance Program
          </Button>
        }
      />

      <div className="flex items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={showArchived}
            onCheckedChange={(v) => setShowArchived(v === true)}
          />
          Show archived
        </label>
      </div>

      <Tabs defaultValue="expert_support" className="space-y-6">
        <TabsList>
          <TabsTrigger value="expert_support">Expert Compliance Support</TabsTrigger>
          <TabsTrigger value="self_service">Self-Service</TabsTrigger>
        </TabsList>

        <TabsContent value="expert_support" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Premium service — AITT experts prepare the documentation, guide the client and
            perform certification.
          </p>
          <ProgramList
            type="expert_support"
            programs={list}
            isLoading={isLoading}
            onEdit={setForm}
            onAssign={openAssign}
            onArchive={(p) => archiveProgram.mutate({ id: p.id, archived: !p.archived })}
            onDelete={setRemoveTarget}
          />
        </TabsContent>

        <TabsContent value="self_service" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Organizations prepare their own documentation; AITT performs the review and
            certification.
          </p>
          <ProgramList
            type="self_service"
            programs={list}
            isLoading={isLoading}
            onEdit={setForm}
            onAssign={openAssign}
            onArchive={(p) => archiveProgram.mutate({ id: p.id, archived: !p.archived })}
            onDelete={setRemoveTarget}
          />
        </TabsContent>
      </Tabs>

      {/* Create / edit dialog */}
      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent
          // Only close via the ✕ / Cancel — never on an outside or dropdown click.
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit Compliance Program" : "Create Compliance Program"}</DialogTitle>
            <DialogDescription>
              Certification always remains under AITT — the program type only sets who prepares
              the documentation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cp-name">Program Name</Label>
              <Input
                id="cp-name"
                value={form?.name ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                placeholder="e.g. AI Governance"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Program Type</Label>
                <Select
                  value={form?.type}
                  onValueChange={(v) => setForm((f) => (f ? { ...f, type: v as ProgramType } : f))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expert_support">Expert Compliance Support</SelectItem>
                    <SelectItem value="self_service">Self-Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jurisdiction</Label>
                <Select
                  value={form?.jurisdiction}
                  onValueChange={(v) =>
                    setForm((f) => (f ? { ...f, jurisdiction: v as Jurisdiction } : f))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EU">🇪🇺 European Union</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-desc">Description</Label>
              <Textarea
                id="cp-desc"
                value={form?.description ?? ""}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, description: e.target.value } : f))
                }
                placeholder="Short description of the program"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveProgram}
              disabled={createProgram.isPending || updateProgram.isPending}
            >
              {form?.id ? "Save changes" : "Create program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign sub-admins dialog */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign sub-admins</DialogTitle>
            <DialogDescription>
              Choose the sub-admins allowed to run <strong>{assignTarget?.name}</strong>'s review
              workflow (reviews, comments, statuses, scores).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto py-2">
            {(subAdmins ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sub-admins available yet.</p>
            ) : (
              (subAdmins ?? []).map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <Checkbox
                    checked={assignIds.includes(s.id)}
                    onCheckedChange={() => toggleAssign(s.id)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{s.name}</span>{" "}
                    <span className="text-muted-foreground break-all">{s.email}</span>
                  </span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveAssignees} disabled={assignSubAdmins.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Delete compliance program?"
        description={
          <>
            This permanently deletes <strong>{removeTarget?.name}</strong>. Consider archiving
            instead if certificates reference it.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!removeTarget) return;
          try {
            await deleteProgram.mutateAsync(removeTarget.id);
            setRemoveTarget(null);
            toast.success("Program deleted");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not delete program");
          }
        }}
      />
    </div>
  );
}
