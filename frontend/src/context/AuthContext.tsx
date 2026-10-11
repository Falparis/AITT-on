// Single auth/identity provider. In real mode it owns the JWT session and derives
// the current Role from the token. In mock mode it preserves the demo "View as"
// role switcher (localStorage) so the offline build behaves exactly as before.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { USE_MOCK } from "../api/config";
import * as authApi from "../api/auth";
import type { CompanyRegisterInput } from "../api/auth";
import type { Identity } from "../api/tokens";
import { useMockStore } from "../mock/store";
import type { Role } from "../mock/types";
import { fakeWallet } from "../mock/utils";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  role: Role;
  /** Set the previewed role. Only meaningful in mock mode ("View as"). */
  setRole: (role: Role) => void;
  identity: Identity | null;
  status: AuthStatus;
  isMock: boolean;
  login: (email: string, password: string) => Promise<Role>;
  registerCompany: (input: CompanyRegisterInput) => Promise<void>;
  logout: () => void;
}

const MOCK_ROLE_KEY = "aitt-demo-role";
const VALID_ROLES: Role[] = ["public", "company", "sub_admin", "admin"];

function readMockRole(): Role {
  try {
    const stored = localStorage.getItem(MOCK_ROLE_KEY) as Role | null;
    if (stored && VALID_ROLES.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return "public";
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mockRole, setMockRole] = useState<Role>(readMockRole);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    USE_MOCK ? "anonymous" : "loading",
  );

  // Real mode: restore the session from a stored refresh token on first load.
  useEffect(() => {
    if (USE_MOCK) return;
    let active = true;
    authApi.bootstrapSession().then((id) => {
      if (!active) return;
      setIdentity(id);
      setStatus(id ? "authenticated" : "anonymous");
    });
    return () => {
      active = false;
    };
  }, []);

  const setRole = useCallback((next: Role) => {
    if (!USE_MOCK) return; // real role comes from the token, not a switcher
    setMockRole(next);
    try {
      localStorage.setItem(MOCK_ROLE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<Role> => {
      if (USE_MOCK) return mockRole; // demo: no real credentials
      const id = await authApi.login(email, password);
      setIdentity(id);
      setStatus("authenticated");
      return id.role;
    },
    [mockRole],
  );

  const registerCompany = useCallback(async (input: CompanyRegisterInput) => {
    if (USE_MOCK) {
      useMockStore.getState().addCompany({
        name: input.name,
        email: input.email,
        wallet: input.wallet?.trim() || fakeWallet(),
      });
      return;
    }
    await authApi.registerCompany(input);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setIdentity(null);
    setStatus("anonymous");
  }, []);

  const role: Role = USE_MOCK ? mockRole : identity?.role ?? "public";

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      setRole,
      identity,
      status,
      isMock: USE_MOCK,
      login,
      registerCompany,
      logout,
    }),
    [role, setRole, identity, status, login, registerCompany, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
