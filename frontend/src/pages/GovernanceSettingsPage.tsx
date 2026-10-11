import { PageHeader } from "@/components/shared/PageHeader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Settings, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useAuth } from "../context/AuthContext";
import {
  useAddSignerWallet,
  useGovernance,
  useRemoveSignerWallet,
  useSetGovernance,
} from "../hooks/data";
import { fakeWallet } from "../mock/utils";

export default function GovernanceSettingsPage() {
  const navigate = useNavigate();
  const { isMock } = useAuth();
  const { data: gov, isLoading } = useGovernance();
  const setGovernance = useSetGovernance();
  const addSignerWallet = useAddSignerWallet();
  const removeSignerWallet = useRemoveSignerWallet();
  const [newWallet, setNewWallet] = useState("");

  if (isLoading || !gov) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { governance, signerWallets } = gov;
  const total = signerWallets.length;

  const handleRequiredChange = async (value: string) => {
    try {
      await setGovernance.mutateAsync({ required: Number(value), total });
      toast.success(`Threshold set to ${value}-of-${total}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update threshold");
    }
  };

  const handleAddWallet = async () => {
    const w = newWallet.trim();
    if (!w) return toast.error("Please enter or connect a wallet");
    if (signerWallets.includes(w)) return toast.error("That signer already exists");
    try {
      await addSignerWallet.mutateAsync(w);
      setNewWallet("");
      toast.success("Signer added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add signer");
    }
  };

  const handleRemoveWallet = async (wallet: string) => {
    if (total <= 1) return toast.error("At least one signer is required");
    try {
      await removeSignerWallet.mutateAsync(wallet);
      toast.success("Signer removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove signer");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Governance Settings"
        subtitle="Configure the multi-signature threshold and authorised signers."
        icon={Settings}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/admin/governance" })}>
            Back to governance
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Threshold */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Approval threshold</CardTitle>
            <CardDescription>
              How many signatures (N) of the total signers (M) are required to
              execute a proposal. Applies to new proposals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label>Required (N)</Label>
                <Select
                  value={String(governance.required)}
                  onValueChange={handleRequiredChange}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.max(1, total) }, (_, i) => i + 1).map(
                      (n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="pb-2 text-2xl font-bold text-muted-foreground">
                of {total}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Current threshold:{" "}
              <span className="font-semibold text-foreground">
                {governance.required}-of-{total}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Signers */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Authorised signers ({total})</CardTitle>
            <CardDescription>
              {isMock
                ? "Wallets allowed to approve proposals."
                : "Signers are the active sub-admins. Manage them under Sub-Admins."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {signerWallets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active signers yet — activate a sub-admin to add one.
                </p>
              ) : (
                signerWallets.map((wallet) => (
                  <div
                    key={wallet}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2"
                  >
                    <span className="font-mono text-xs break-all">{wallet}</span>
                    {isMock && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveWallet(wallet)}
                        disabled={total <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            {isMock ? (
              <div className="flex gap-2">
                <Input
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="G…"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-shrink-0 gap-2"
                  onClick={() => setNewWallet(fakeWallet())}
                >
                  <Wallet className="h-4 w-4" />
                  Connect
                </Button>
                <Button
                  type="button"
                  className="flex-shrink-0"
                  onClick={handleAddWallet}
                  disabled={addSignerWallet.isPending}
                >
                  Add
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/admin/experts" })}
              >
                Manage sub-admins
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
