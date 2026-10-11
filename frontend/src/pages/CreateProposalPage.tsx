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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useCreateProposal, useDocuments } from "../hooks/data";
import { PROPOSAL_TYPE_OPTIONS } from "../mock/labels";
import type { ProposalType } from "../mock/types";

export default function CreateProposalPage() {
  const navigate = useNavigate();
  const { data: documents } = useDocuments();
  const createProposal = useCreateProposal();

  const [type, setType] = useState<ProposalType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRef, setTargetRef] = useState("");

  const issuedDocs = useMemo(
    () => (documents ?? []).filter((d) => d.status === "issued"),
    [documents],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return toast.error("Please select a proposal type");
    if (!title.trim()) return toast.error("Please enter a title");
    if (!description.trim()) return toast.error("Please enter a description");
    if (type === "revocation" && !targetRef) {
      return toast.error("Please select the certificate to revoke");
    }

    try {
      const proposal = await createProposal.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        targetRef: targetRef || undefined,
      });
      toast.success("Proposal created — pending multi-sig approval");
      navigate({ to: `/admin/governance/${proposal.id}` });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not create proposal",
      );
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Create Proposal"
        subtitle="Multi-signature governance is reserved for exceptional actions only."
        icon={Plus}
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Proposal details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as ProposalType);
                    setTargetRef("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exceptional action" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Certificate issuance is a direct Main-Admin action and is not a
                  governance proposal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-title">Title</Label>
                <Input
                  id="prop-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of the proposal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-desc">Description</Label>
                <Textarea
                  id="prop-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the rationale and impact of this action…"
                />
              </div>

              {type === "revocation" ? (
                <div className="space-y-2">
                  <Label>Certificate to revoke</Label>
                  <Select value={targetRef} onValueChange={setTargetRef}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an issued certificate" />
                    </SelectTrigger>
                    <SelectContent>
                      {issuedDocs.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No issued certificates
                        </div>
                      ) : (
                        issuedDocs.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.filename} — {d.company}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="prop-target">Target reference (optional)</Label>
                  <Input
                    id="prop-target"
                    value={targetRef}
                    onChange={(e) => setTargetRef(e.target.value)}
                    placeholder="e.g. framework id, contract address"
                    className="font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createProposal.isPending}>
                  {createProposal.isPending ? "Creating…" : "Create proposal"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/admin/governance" })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
