// Role is now sourced from AuthContext (JWT-derived in real mode, or the demo
// "View as" switcher in mock mode). This module keeps the stable `useRole`,
// `roleHome`, `roleLabel` surface the rest of the app imports.

import type { Role } from "../mock/types";
import { useAuth } from "./AuthContext";

/** Default landing route for each role. */
export const roleHome: Record<Role, string> = {
  public: "/",
  company: "/company",
  sub_admin: "/expert",
  admin: "/admin",
};

export const roleLabel: Record<Role, string> = {
  public: "Public",
  company: "Company",
  sub_admin: "Sub-Admin",
  admin: "Main Admin",
};

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

export function useRole(): RoleContextValue {
  const { role, setRole } = useAuth();
  return { role, setRole };
}
