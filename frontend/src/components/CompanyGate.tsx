
import { Clock, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useMyCompany } from "../hooks/data";

export function CompanyGate({ children }: { children: ReactNode }) {
  const { isMock, identity } = useAuth();
  const { data: company, isLoading } = useMyCompany(identity?.companyId);

  // Mock/demo mode is permissive; real mode enforces approval.
  if (isMock) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (company && company.status !== "active") {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold">Approval pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your company account
            {company.name ? (
              <>
                {" "}
                — <strong>{company.name}</strong> —
              </>
            ) : null}{" "}
            is awaiting review by an administrator. You'll be able to submit
            documents and use the platform once your account is approved.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Current status:{" "}
            <span className="font-medium capitalize">{company.status}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
