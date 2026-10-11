import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useAuth } from "../context/AuthContext";
import {
  useAddFramework,
  useAddTemplate,
  useCreateProposal,
  useFrameworks,
  useRemoveFramework,
  useRemoveTemplate,
  useTemplates,
  useUpdateFramework,
  useUpdateTemplate,
} from "../hooks/data";
import type { Framework, Template } from "../mock/types";

interface FrameworkForm {
  id?: string;
  name: string;
  description: string;
}
interface TemplateForm {
  id?: string;
  name: string;
  description: string;
  file: string;
}

export default function AdminFrameworksPage() {
  const navigate = useNavigate();
  const { isMock } = useAuth();
  const { data: frameworks, isLoading: fwLoading } = useFrameworks();
  const { data: templates, isLoading: tplLoading } = useTemplates();
  const addFramework = useAddFramework();
  const updateFramework = useUpdateFramework();
  const removeFramework = useRemoveFramework();
  const addTemplate = useAddTemplate();
  const updateTemplate = useUpdateTemplate();
  const removeTemplate = useRemoveTemplate();
  const createProposal = useCreateProposal();

  const [fwForm, setFwForm] = useState<FrameworkForm | null>(null);
  const [tplForm, setTplForm] = useState<TemplateForm | null>(null);
  const [removeFw, setRemoveFw] = useState<Framework | null>(null);
  const [removeTpl, setRemoveTpl] = useState<Template | null>(null);

  // Frameworks are read-only on the backend — changes go through framework_update
  // governance proposals (D6). Mock mode keeps direct CRUD.
  const saveFramework = async () => {
    if (!fwForm) return;
    if (!fwForm.name.trim()) return toast.error("Please enter a name");
    const input = { name: fwForm.name.trim(), description: fwForm.description.trim() };
    try {
      if (isMock) {
        if (fwForm.id) {
          await updateFramework.mutateAsync({ id: fwForm.id, input });
          toast.success("Framework updated");
        } else {
          await addFramework.mutateAsync(input);
          toast.success("Framework added");
        }
        setFwForm(null);
        return;
      }
      const action = fwForm.id ? "update" : "create";
      await createProposal.mutateAsync({
        type: "framework_update",
        title: `${fwForm.id ? "Update" : "Add"} framework: ${input.name}`,
        description:
          input.description ||
          `Proposed ${action} of the "${input.name}" compliance framework.`,
        payload: {
          action,
          name: input.name,
          description: input.description,
          ...(fwForm.id ? { frameworkId: fwForm.id } : {}),
        },
      });
      setFwForm(null);
      toast.success("Framework update proposed — pending multi-sig approval");
      navigate({ to: "/admin/governance" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save framework");
    }
  };

  const saveTemplate = async () => {
    if (!tplForm) return;
    if (!tplForm.name.trim()) return toast.error("Please enter a name");
    if (!tplForm.file.trim()) return toast.error("Please enter a file name");
    const input = {
      name: tplForm.name.trim(),
      description: tplForm.description.trim(),
      file: tplForm.file.trim(),
    };
    try {
      if (tplForm.id) {
        await updateTemplate.mutateAsync({ id: tplForm.id, input });
        toast.success("Template updated");
      } else {
        await addTemplate.mutateAsync(input);
        toast.success("Template added");
      }
      setTplForm(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save template");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Frameworks & Templates"
        subtitle="Manage compliance frameworks and the blank Word templates companies download."
        icon={Layers}
      />

      <Tabs defaultValue="frameworks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Frameworks */}
        <TabsContent value="frameworks" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            {!isMock && (
              <p className="text-sm text-muted-foreground">
                Frameworks are governed on-chain — changes are submitted as
                multi-signature proposals.
              </p>
            )}
            <Button
              className="ml-auto gap-2"
              onClick={() => setFwForm({ name: "", description: "" })}
            >
              <Plus className="h-4 w-4" />
              {isMock ? "Add framework" : "Propose new framework"}
            </Button>
          </div>
          {fwLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !frameworks || frameworks.length === 0 ? (
            <EmptyState icon={Layers} title="No frameworks" description="Add a compliance framework to get started." />
          ) : (
            <div className="space-y-3">
              {frameworks.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">{f.name}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {f.description}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setFwForm(f)}>
                      <Pencil className="h-4 w-4" />
                      {isMock ? "Edit" : "Propose update"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setRemoveFw(f)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isMock ? "Remove" : "Propose removal"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button
              className="gap-2"
              onClick={() => setTplForm({ name: "", description: "", file: "" })}
            >
              <Plus className="h-4 w-4" />
              Add template
            </Button>
          </div>
          {tplLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !templates || templates.length === 0 ? (
            <EmptyState icon={Layers} title="No templates" description="Add a blank Word template for companies to download." />
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">{t.name}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {t.description}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                      {t.file}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setTplForm(t)}>
                      <Pencil className="h-4 w-4" />
                      Replace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setRemoveTpl(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Framework add/edit dialog */}
      <Dialog open={!!fwForm} onOpenChange={(open) => !open && setFwForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isMock
                ? fwForm?.id
                  ? "Edit framework"
                  : "Add framework"
                : fwForm?.id
                  ? "Propose framework update"
                  : "Propose new framework"}
            </DialogTitle>
            <DialogDescription>
              {isMock
                ? "Frameworks appear as compliance subjects when companies submit."
                : "This opens a framework_update governance proposal; the change applies once the signature threshold is reached."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fw-name">Name</Label>
              <Input
                id="fw-name"
                value={fwForm?.name ?? ""}
                onChange={(e) =>
                  setFwForm((f) => (f ? { ...f, name: e.target.value } : f))
                }
                placeholder="e.g. EU AI Act"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-desc">Description</Label>
              <Textarea
                id="fw-desc"
                value={fwForm?.description ?? ""}
                onChange={(e) =>
                  setFwForm((f) => (f ? { ...f, description: e.target.value } : f))
                }
                placeholder="Short description of the framework"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFwForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveFramework} disabled={createProposal.isPending}>
              {isMock ? "Save" : "Submit proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template add/edit dialog */}
      <Dialog open={!!tplForm} onOpenChange={(open) => !open && setTplForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tplForm?.id ? "Replace template" : "Add template"}</DialogTitle>
            <DialogDescription>
              Templates are the blank .docx files companies download to fill out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={tplForm?.name ?? ""}
                onChange={(e) =>
                  setTplForm((t) => (t ? { ...t, name: e.target.value } : t))
                }
                placeholder="e.g. EU AI Act Conformity Declaration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Textarea
                id="tpl-desc"
                value={tplForm?.description ?? ""}
                onChange={(e) =>
                  setTplForm((t) => (t ? { ...t, description: e.target.value } : t))
                }
                placeholder="Short description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-file">File name (.docx)</Label>
              <Input
                id="tpl-file"
                value={tplForm?.file ?? ""}
                onChange={(e) =>
                  setTplForm((t) => (t ? { ...t, file: e.target.value } : t))
                }
                placeholder="Template_Name.docx"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeFw}
        onOpenChange={(open) => !open && setRemoveFw(null)}
        title={isMock ? "Remove framework?" : "Propose framework removal?"}
        description={
          isMock ? (
            <>
              This removes <strong>{removeFw?.name}</strong> from the list of
              compliance subjects.
            </>
          ) : (
            <>
              This opens a governance proposal to deactivate{" "}
              <strong>{removeFw?.name}</strong>. It is removed once the signature
              threshold is reached.
            </>
          )
        }
        confirmLabel={isMock ? "Remove" : "Open proposal"}
        destructive
        onConfirm={async () => {
          if (!removeFw) return;
          const fw = removeFw;
          try {
            if (isMock) {
              await removeFramework.mutateAsync(fw.id);
              setRemoveFw(null);
              toast.success("Framework removed");
              return;
            }
            await createProposal.mutateAsync({
              type: "framework_update",
              title: `Deactivate framework: ${fw.name}`,
              description: `Proposed deactivation of the "${fw.name}" compliance framework.`,
              payload: { action: "deactivate", frameworkId: fw.id, name: fw.name },
            });
            setRemoveFw(null);
            toast.success("Framework removal proposed — pending multi-sig approval");
            navigate({ to: "/admin/governance" });
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not remove framework");
          }
        }}
      />

      <ConfirmDialog
        open={!!removeTpl}
        onOpenChange={(open) => !open && setRemoveTpl(null)}
        title="Remove template?"
        description={
          <>
            This removes <strong>{removeTpl?.name}</strong> from the download
            center.
          </>
        }
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (!removeTpl) return;
          try {
            await removeTemplate.mutateAsync(removeTpl.id);
            setRemoveTpl(null);
            toast.success("Template removed");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not remove template");
          }
        }}
      />
    </div>
  );
}
