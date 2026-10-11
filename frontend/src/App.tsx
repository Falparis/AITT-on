import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CompanyGate } from "./components/CompanyGate";
import { Protected } from "./components/Protected";
import { AuthProvider } from "./context/AuthContext";
import type { Role } from "./mock/types";
import AdminCertificatesPage from "./pages/AdminCertificatesPage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminDocumentsPage from "./pages/AdminDocumentsPage";
import AdminExpertsPage from "./pages/AdminExpertsPage";
import AdminComplianceProgramsPage from "./pages/AdminComplianceProgramsPage";
import CertificatePage from "./pages/CertificatePage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import CreateProposalPage from "./pages/CreateProposalPage";
import DocumentReviewPage from "./pages/DocumentReviewPage";
import GovernanceDashboardPage from "./pages/GovernanceDashboardPage";
import GovernanceSettingsPage from "./pages/GovernanceSettingsPage";
import PublicPortalPage from "./pages/PublicPortalPage";
import PublicCompanyProfilePage from "./pages/PublicCompanyProfilePage";
import MonitoringPage from "./pages/MonitoringPage";
import MyDocumentsPage from "./pages/MyDocumentsPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import ProposalDetailPage from "./pages/ProposalDetailPage";
import RegisterPage from "./pages/RegisterPage";
import RegistryPage from "./pages/RegistryPage";
import ReviewQueuePage from "./pages/ReviewQueuePage";
import SignInPage from "./pages/SignInPage";
import SubmitDocumentPage from "./pages/SubmitDocumentPage";
import TemplatesPage from "./pages/TemplatesPage";
import VerificationPage from "./pages/VerificationPage";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const route = (path: string, component: () => ReactNode) =>
  createRoute({ getParentRoute: () => rootRoute, path, component });

// Wrap a page in a role guard (enforced in real mode, permissive in mock mode).
const guard =
  (roles: Role[], Component: () => ReactNode): (() => ReactNode) =>
  () => (
    <Protected roles={roles}>
      <Component />
    </Protected>
  );

// Company routes: role guard + approval gate. A company that isn't approved yet
// sees an "approval pending" screen instead of the feature pages.
const companyGuard = (Component: () => ReactNode): (() => ReactNode) =>
  guard(["company"], () => (
    <CompanyGate>
      <Component />
    </CompanyGate>
  ));

// --- Real public screens ---
const indexRoute = route("/", PublicPortalPage);
const verificationRoute = route("/verification", VerificationPage);

// --- Auth (Phase 1) ---
const signInRoute = route("/signin", SignInPage);
const registerRoute = route("/register", RegisterPage);

// --- Public + Company (Phase 2) ---
const registryRoute = route("/registry", RegistryPage);
const certificateRoute = route("/certificate/$id", CertificatePage);
const companyProfileRoute = route("/company-profile/$name", PublicCompanyProfilePage);
const companyRoute = route("/company", companyGuard(CompanyDashboardPage));
const companySubmitRoute = route("/company/submit", companyGuard(SubmitDocumentPage));
const companyDocsRoute = route("/company/documents", companyGuard(MyDocumentsPage));
const companyTemplatesRoute = route("/company/templates", companyGuard(TemplatesPage));

// --- Sub-Admin (Phase 3) ---
const expertRoute = route("/expert", guard(["sub_admin"], ReviewQueuePage));
const expertReviewRoute = route("/expert/review/$id", guard(["sub_admin"], DocumentReviewPage));
const expertHistoryRoute = route("/expert/history", guard(["sub_admin"], MyReviewsPage));

// --- Main Admin (Phase 4) ---
const adminRoute = route("/admin", guard(["admin"], AdminDashboardPage));
const adminDocsRoute = route("/admin/documents", guard(["admin"], AdminDocumentsPage));
const adminCompaniesRoute = route("/admin/companies", guard(["admin"], AdminCompaniesPage));
const adminExpertsRoute = route("/admin/experts", guard(["admin"], AdminExpertsPage));
const adminCertificatesRoute = route("/admin/certificates", guard(["admin"], AdminCertificatesPage));
const adminProgramsRoute = route("/admin/compliance-programs", guard(["admin"], AdminComplianceProgramsPage));
// Main Admin can review documents too (shares the sub-admin review screen).
const adminReviewRoute = route("/admin/review/$id", guard(["admin"], DocumentReviewPage));

// --- Governance (Phase 5) ---
// NOTE on route precedence: TanStack Router ranks static segments above dynamic
// ones, so "/admin/governance/new" and "/admin/governance/settings" always win
// over "/admin/governance/$id" regardless of registration order.
const governanceRoute = route("/admin/governance", guard(["admin"], GovernanceDashboardPage));
const governanceNewRoute = route("/admin/governance/new", guard(["admin"], CreateProposalPage));
const governanceSettingsRoute = route("/admin/governance/settings", guard(["admin"], GovernanceSettingsPage));
const governanceDetailRoute = route("/admin/governance/$id", guard(["admin"], ProposalDetailPage));

// --- Monitoring (Phase 6) ---
const monitoringRoute = route("/admin/monitoring", guard(["admin"], MonitoringPage));

const routeTree = rootRoute.addChildren([
  indexRoute,
  verificationRoute,
  signInRoute,
  registerRoute,
  registryRoute,
  certificateRoute,
  companyProfileRoute,
  companyRoute,
  companySubmitRoute,
  companyDocsRoute,
  companyTemplatesRoute,
  expertRoute,
  expertReviewRoute,
  expertHistoryRoute,
  adminRoute,
  adminDocsRoute,
  adminCompaniesRoute,
  adminExpertsRoute,
  adminCertificatesRoute,
  adminProgramsRoute,
  adminReviewRoute,
  governanceRoute,
  governanceNewRoute,
  governanceSettingsRoute,
  governanceDetailRoute,
  monitoringRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}
