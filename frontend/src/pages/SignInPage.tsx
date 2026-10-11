import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { LogIn, Mail, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { roleHome, roleLabel } from "../context/RoleContext";

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, isMock, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMock && (!email.trim() || !password)) {
      toast.error("Enter your email and password");
      return;
    }
    setIsSubmitting(true);
    try {
      const signedInRole = await login(email.trim(), password);
      toast.success(
        isMock
          ? `Signed in as ${roleLabel[signedInRole]} (demo)`
          : "Signed in",
      );
      navigate({ to: roleHome[signedInRole] });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Sign in failed. Check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border shadow-sm lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between gap-8 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-10 lg:flex">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            AITT — AI Transparency Token
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Compliance &amp; Governance Platform
            </h2>
            <p className="text-muted-foreground">
              Submit, review and certify AI compliance documents with
              multi-signature governance and on-chain proof of authenticity.
            </p>
          </div>
          {isMock && (
            <p className="text-xs text-muted-foreground">
              Demo environment — credentials are ignored; you are signed in as the
              role selected in “View as”.
            </p>
          )}
        </div>

        {/* Form panel */}
        <div className="bg-card p-8 sm:p-10">
          <div className="mx-auto max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                {isMock ? (
                  <>
                    Previewing as{" "}
                    <span className="font-medium text-foreground">
                      {roleLabel[role]}
                    </span>
                    . Switch roles with “View as” in the header.
                  </>
                ) : (
                  "Sign in to your AITT account."
                )}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              New company?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => navigate({ to: "/register" })}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
