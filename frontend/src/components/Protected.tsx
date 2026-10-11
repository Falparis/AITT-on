// Route guard. In real mode it enforces auth + role and redirects; in mock mode
// it is permissive so the "View as" demo can reach every screen.

import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../context/RoleContext";
import type { Role } from "../mock/types";

export function Protected({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { isMock, status, role } = useAuth();

  if (isMock) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/signin" />;
  }

  if (!roles.includes(role)) {
    return <Navigate to={roleHome[role]} />;
  }

  return <>{children}</>;
}
