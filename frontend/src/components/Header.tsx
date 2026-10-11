import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Award,
  Building2,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileDown,
  FileText,
  Home,
  LayoutDashboard,
  Layers,
  LogIn,
  LogOut,
  Menu,
  ScrollText,
  Scale,
  Upload,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { roleHome, roleLabel } from "../context/RoleContext";
import type { Role } from "../mock/types";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  // Real public surfaces backed by the live API. The legacy ICP demo screens
  // (/library, /compliance, /ai-assistant, …) are reachable by URL only — see
  // INTEGRATION_NOTES.md D8.
  public: [
    { path: "/", label: "Home", icon: Home },
    { path: "/registry", label: "Registry", icon: ScrollText },
    { path: "/verification", label: "Verification", icon: CheckCircle },
  ],
  company: [
    { path: "/company", label: "Dashboard", icon: LayoutDashboard },
    { path: "/company/submit", label: "Submit", icon: Upload },
    { path: "/company/documents", label: "My Workflows", icon: FileText },
    { path: "/company/templates", label: "Templates", icon: FileDown },
    { path: "/registry", label: "Registry", icon: ScrollText },
  ],
  sub_admin: [
    { path: "/expert", label: "Review Queue", icon: ClipboardList },
    { path: "/expert/history", label: "My Reviews", icon: ClipboardCheck },
  ],
  admin: [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/documents", label: "Workflows", icon: FileText },
    { path: "/admin/companies", label: "Companies", icon: Building2 },
    { path: "/admin/experts", label: "Sub-Admins", icon: Users },
    { path: "/admin/certificates", label: "Certificates", icon: Award },
    { path: "/admin/compliance-programs", label: "Compliance Programs", icon: Layers },
    { path: "/admin/governance", label: "Governance", icon: Scale },
    { path: "/admin/monitoring", label: "Monitoring", icon: Activity },
  ],
};

const ROLES: Role[] = ["public", "company", "sub_admin", "admin"];

export default function Header() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { role, setRole, isMock, status, logout } = useAuth();

  const currentPath = routerState.location.pathname;
  const navItems = NAV_BY_ROLE[role];

  // Active = the nav item whose path is the longest prefix of the current path.
  const activePath = useMemo(() => {
    const matches = navItems
      .filter(
        (i) => currentPath === i.path || currentPath.startsWith(`${i.path}/`),
      )
      .sort((a, b) => b.path.length - a.path.length);
    return matches[0]?.path;
  }, [navItems, currentPath]);

  const handleRoleChange = (next: Role) => {
    setRole(next);
    navigate({ to: roleHome[next] });
  };

  const handleSignOut = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/signin" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-6">
          <button
            type="button"
            // The logo always returns to the public verification portal (homepage).
            onClick={() => navigate({ to: "/" })}
            className="-ml-2 flex flex-shrink-0 items-center gap-2 text-lg font-bold text-foreground transition-opacity hover:opacity-80"
          >
            AITT
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={item.path === activePath ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate({ to: item.path })}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isMock ? (
            /* Demo "View as" role switcher (mock mode only) */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View as:</span>
                  <span className="font-medium">{roleLabel[role]}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Preview as role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLES.map((r) => (
                  <DropdownMenuCheckboxItem
                    key={r}
                    checked={role === r}
                    onCheckedChange={() => handleRoleChange(r)}
                  >
                    {roleLabel[r]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === "authenticated" ? (
            /* Real account menu */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="font-medium">{roleLabel[role]}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Real, signed out */
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate({ to: "/signin" })}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          )}

          {/* Mobile / medium nav */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => navigate({ to: item.path })}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
