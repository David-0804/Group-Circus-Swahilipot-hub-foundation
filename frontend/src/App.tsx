// Nexus Enterprise Management System — Main Router
// All 31 pages wired up with role-based dashboard routing
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./services/api";
import AppLayout from "./components/layout/AppLayout";
import LoadingScreen from "./components/ui/LoadingScreen";

// ── Auth ─────────────────────────────────────────────────────────────────────
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const MFAPage = lazy(() => import("./pages/auth/MFAPage"));
const VerifyPage = lazy(() => import("./pages/certificates/VerifyPage"));
const ProfilePage = lazy(() => import("./pages/auth/ProfilePage"));

// ── Dashboards ────────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const BroadcastDash = lazy(
	() => import("./pages/dashboard/BroadcastDashboard"),
);
const ExecutiveDash = lazy(
	() => import("./pages/dashboard/ExecutiveDashboard"),
);
const AttacheeDash = lazy(() => import("./pages/dashboard/AttacheeDashboard"));
<<<<<<< HEAD
const DeptDashboard = lazy(
	// ← add this
	() => import("./pages/attendance/DeptDashboardPage"),
);
=======

>>>>>>> origin/main
// ── Internship modules ────────────────────────────────────────────────────────
const AttendancePage = lazy(() => import("./pages/attendance/AttendancePage"));
const TasksPage = lazy(() => import("./pages/tasks/TasksPage"));
const LogbooksPage = lazy(() => import("./pages/logbooks/LogbooksPage"));
const EvaluationsPage = lazy(
	() => import("./pages/evaluations/EvaluationsPage"),
);
const CertificatesPage = lazy(
	() => import("./pages/certificates/CertificatesPage"),
);
const AttacheeList = lazy(() => import("./pages/attachees/AttacheeListPage"));

// ── Broadcast modules ─────────────────────────────────────────────────────────
const EquipmentPage = lazy(() => import("./pages/equipment/EquipmentPage"));
const NewsPage = lazy(() => import("./pages/news/NewsPage"));
const FMReportPage = lazy(() => import("./pages/fm/FMReportPage"));
const RadioPage = lazy(() => import("./pages/radio/RadioPage"));
const VideographyPage = lazy(
	() => import("./pages/videography/VideographyPage"),
);
const CallsPage = lazy(() => import("./components/layout/calls/CallsPage"));

// ── Digital services ──────────────────────────────────────────────────────────
const SubscriptionsPage = lazy(
	() => import("./pages/subscriptions/SubscriptionsPage"),
);
const WifiPage = lazy(() => import("./pages/wifi/WifiPage"));
const FeedbackPage = lazy(() => import("./pages/feedback/FeedbackPage"));
const FileTransferPage = lazy(
	() => import("./pages/filetransfer/FileTransferPage"),
);

// ── Enterprise ────────────────────────────────────────────────────────────────
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const HRPage = lazy(() => import("./pages/admin/HRPage"));
const FinancePage = lazy(() => import("./pages/admin/FinancePage"));
const UserManagement = lazy(() => import("./pages/admin/UserManagementPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));

// ── Landing ───────────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import("./pages/LandingPage"));

// ── System ────────────────────────────────────────────────────────────────────
const NotificationsPage = lazy(
	() => import("./pages/notifications/NotificationsPage"),
);
const EmergencyPage = lazy(() => import("./pages/emergency/EmergencyPage"));

// ─────────────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
// ── RBAC role groups — exact strings from backend roles list ─────────────────
const ROLES = {
	// Attachee — own data only
	ATTACHEE: ["attachee"],

	// Supervisors — their assigned attachees/staff
	SUPERVISOR: ["supervisor"],

	// Department leaders — own department only
	DEPT_LEADER: ["department_leader"],

	// HR — full HR & internship administration
	HR: ["hr_officer"],

	// System administrator — full access
	ADMIN: ["system_admin"],

	// Data analytics — read-only cross-dept
	ANALYTICS: ["data_analyst"],

	// Executive — company-wide dashboards
	EXECUTIVE: ["executive"],

	// Finance department
	FINANCE: ["finance"],

	// University coordinators — external institution portal
	UNIVERSITY: ["university_coordinator"],

	// Broadcast cluster
	BROADCAST: [
		"broadcast_admin",
		"broadcast_staff",
		"journalist",
		"presenter",
		"editor",
		"videographer",
		"station_engineer",
	],
} as const;

// Helpers for composing allowed-role lists
const ALL_STAFF = [
	...ROLES.FINANCE,
	...ROLES.UNIVERSITY,
	...ROLES.ADMIN,
	...ROLES.HR,
	...ROLES.SUPERVISOR,
	...ROLES.DEPT_LEADER,
	...ROLES.EXECUTIVE,
	...ROLES.ANALYTICS,
];

const ALL_ROLES = [...ALL_STAFF, ...ROLES.ATTACHEE, ...ROLES.BROADCAST];

// ── Route-level RBAC guard ────────────────────────────────────────────────────
/**
 * Wraps a route element and redirects to /dashboard if the current user's
 * role is not in the `allowed` list.  Must be used inside a PrivateRoute so
 * `user` is always present.
 */
function RoleRoute({
	children,
	allowed,
}: {
	children: React.ReactNode;
	allowed: readonly string[] | string[];
}) {
	const { user } = useAuthStore();
	const role = user?.role ?? "";
	if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />;
	return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────

=======
>>>>>>> origin/main
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 3, // 3 min
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuthStore();
	if (isAuthenticated) return <Navigate to="/dashboard" replace />;
	return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuthStore();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

/** Route the /dashboard path to the correct dashboard based on user role */
function RoleDashboard() {
	const { user } = useAuthStore();
	const role = user?.role ?? "";

	if (role === "attachee") return <AttacheeDash />;

<<<<<<< HEAD
	if (([...ROLES.BROADCAST] as string[]).includes(role))
		return <BroadcastDash />;

	if (([...ROLES.EXECUTIVE, ...ROLES.ANALYTICS] as string[]).includes(role))
		return <ExecutiveDash />;

	if (([...ROLES.SUPERVISOR, ...ROLES.DEPT_LEADER] as string[]).includes(role))
		return <DeptDashboard />;

	// HR, Finance, University, Admin → full admin dashboard
=======
	if (
		[
			"broadcast_admin",
			"broadcast_staff",
			"broadcast_student",
			"journalist",
			"presenter",
			"editor",
			"videographer",
			"station_engineer",
		].includes(role)
	)
		return <BroadcastDash />;

	if (["executive", "data_analyst"].includes(role)) return <ExecutiveDash />;

	// All admin-type roles get the full admin dashboard
>>>>>>> origin/main
	return <AdminDashboard />;
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Suspense fallback={<LoadingScreen />}>
					<Routes>
						{/* ── Public ─────────────────────────────────────────────── */}
						<Route
							path="/"
							element={
								<PublicOnlyRoute>
									<LandingPage />
								</PublicOnlyRoute>
							}
						/>
						<Route
							path="/login"
							element={
								<PublicOnlyRoute>
									<LoginPage />
								</PublicOnlyRoute>
							}
						/>
						<Route path="/mfa" element={<MFAPage />} />
						<Route path="/verify/:code" element={<VerifyPage />} />{" "}
<<<<<<< HEAD
						{/* ── Protected (requires auth + role check) ─────────────── */}
=======
						{/* ── Protected (requires auth) ──────────────────────────── */}
>>>>>>> origin/main
						<Route
							element={
								<PrivateRoute>
									<AppLayout />
								</PrivateRoute>
							}>
<<<<<<< HEAD
							{/* ── Core — every authenticated user ───────────────────── */}
							<Route path="/dashboard" element={<RoleDashboard />} />
							<Route
								path="/profile"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<ProfilePage />
									</RoleRoute>
								}
							/>
							<Route
								path="/notifications"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<NotificationsPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/emergency-alerts"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<EmergencyPage />
									</RoleRoute>
								}
							/>

							{/* ── Internship — attachee self-service ────────────────── */}
							<Route
								path="/attendance"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ATTACHEE,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<AttendancePage />
									</RoleRoute>
								}
							/>
							{/* Department attendance dashboard — dept leaders & supervisors */}
							<Route
								path="/dept-dashboard"
								element={
									<RoleRoute
										allowed={[
											...ROLES.DEPT_LEADER,
											...ROLES.SUPERVISOR,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<DeptDashboard />
									</RoleRoute>
								}
							/>
							<Route
								path="/tasks"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ATTACHEE,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<TasksPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/logbooks"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ATTACHEE,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<LogbooksPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/evaluations"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ATTACHEE,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<EvaluationsPage />
									</RoleRoute>
								}
							/>
							{/* Certificates — attachees receive them; HR/Admin issue them */}
							<Route
								path="/certificates"
								element={
									<RoleRoute
										allowed={[...ROLES.ATTACHEE, ...ROLES.HR, ...ROLES.ADMIN]}>
										<CertificatesPage />
									</RoleRoute>
								}
							/>
							{/* Attachee list — supervisors, dept leaders, HR, admin */}
							<Route
								path="/attachees"
								element={
									<RoleRoute
										allowed={[
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.HR,
											...ROLES.ADMIN,
										]}>
										<AttacheeList />
									</RoleRoute>
								}
							/>

							{/* ── Broadcast ─────────────────────────────────────────── */}
							<Route
								path="/equipment"
								element={
									<RoleRoute allowed={[...ROLES.BROADCAST, ...ROLES.ADMIN]}>
										<EquipmentPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/projects"
								element={
									<RoleRoute
										allowed={[
											...ROLES.BROADCAST,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.ADMIN,
										]}>
										<AttacheeList />
									</RoleRoute>
								}
							/>
							<Route
								path="/fm-report"
								element={
									<RoleRoute allowed={[...ROLES.BROADCAST, ...ROLES.ADMIN]}>
										<FMReportPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/radio"
								element={
									<RoleRoute allowed={[...ROLES.BROADCAST, ...ROLES.ADMIN]}>
										<RadioPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/news"
								element={
									<RoleRoute allowed={[...ROLES.BROADCAST, ...ROLES.ADMIN]}>
										<NewsPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/videography"
								element={
									<RoleRoute allowed={[...ROLES.BROADCAST, ...ROLES.ADMIN]}>
										<VideographyPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/calls"
								element={
									<RoleRoute
										allowed={[
											...ROLES.BROADCAST,
											...ROLES.SUPERVISOR,
											...ROLES.DEPT_LEADER,
											...ROLES.ADMIN,
										]}>
										<CallsPage />
									</RoleRoute>
								}
							/>

							{/* ── Digital Services ──────────────────────────────────── */}
							<Route
								path="/subscriptions"
								element={
									<RoleRoute allowed={[...ROLES.ADMIN, ...ROLES.HR]}>
										<SubscriptionsPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/wifi"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<WifiPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/file-transfer"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<FileTransferPage />
									</RoleRoute>
								}
							/>
							<Route
								path="/feedback"
								element={
									<RoleRoute allowed={ALL_ROLES}>
										<FeedbackPage />
									</RoleRoute>
								}
							/>

							{/* ── Enterprise — analytics ────────────────────────────── */}
							{/*
							 * Analytics: Data Analysts get read-only cross-dept access.
							 * Executives get company-wide KPI dashboards.
							 * Admins always have access.
							 */}
							<Route
								path="/analytics"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ANALYTICS,
											...ROLES.EXECUTIVE,
											...ROLES.ADMIN,
										]}>
										<AnalyticsPage />
									</RoleRoute>
								}
							/>

							{/* ── Enterprise — HR portal ────────────────────────────── */}
							{/*
							 * HR Officers and System Admins only.
							 * Attachees, supervisors, dept leaders, broadcast, etc. are
							 * all explicitly excluded — the whole point of this fix.
							 */}
							<Route
								path="/hr"
								element={
									<RoleRoute allowed={[...ROLES.HR, ...ROLES.ADMIN]}>
										<HRPage />
									</RoleRoute>
								}
							/>

							{/* ── Enterprise — finance ──────────────────────────────── */}
							<Route
								path="/finance"
								element={
									<RoleRoute
										allowed={[
											...ROLES.ADMIN,
											...ROLES.EXECUTIVE,
											...ROLES.FINANCE,
										]}>
										<FinancePage />
									</RoleRoute>
								}
							/>

							{/* ── Enterprise — user management & settings ───────────── */}
							{/* System Administrator only per Section 7 */}
							<Route
								path="/users"
								element={
									<RoleRoute allowed={[...ROLES.ADMIN]}>
										<UserManagement />
									</RoleRoute>
								}
							/>
							<Route
								path="/settings"
								element={
									<RoleRoute allowed={[...ROLES.ADMIN]}>
										<SettingsPage />
									</RoleRoute>
								}
							/>
=======
							{/* Core */}
							<Route path="/dashboard" element={<RoleDashboard />} />
							<Route path="/profile" element={<ProfilePage />} />
							<Route path="/notifications" element={<NotificationsPage />} />
							<Route path="/emergency-alerts" element={<EmergencyPage />} />

							{/* Internship */}
							<Route path="/attendance" element={<AttendancePage />} />
							<Route path="/tasks" element={<TasksPage />} />
							<Route path="/logbooks" element={<LogbooksPage />} />
							<Route path="/evaluations" element={<EvaluationsPage />} />
							<Route path="/certificates" element={<CertificatesPage />} />
							<Route path="/attachees" element={<AttacheeList />} />

							{/* Broadcast */}
							<Route path="/equipment" element={<EquipmentPage />} />
							<Route path="/projects" element={<AttacheeList />} />
							<Route path="/fm-report" element={<FMReportPage />} />
							<Route path="/radio" element={<RadioPage />} />
							<Route path="/news" element={<NewsPage />} />
							<Route path="/videography" element={<VideographyPage />} />
							<Route path="/calls" element={<CallsPage />} />

							{/* Digital Services */}
							<Route path="/subscriptions" element={<SubscriptionsPage />} />
							<Route path="/wifi" element={<WifiPage />} />
							<Route path="/file-transfer" element={<FileTransferPage />} />
							<Route path="/feedback" element={<FeedbackPage />} />

							{/* Enterprise */}
							<Route path="/analytics" element={<AnalyticsPage />} />
							<Route path="/hr" element={<HRPage />} />
							<Route path="/finance" element={<FinancePage />} />
							<Route path="/users" element={<UserManagement />} />
							<Route path="/settings" element={<SettingsPage />} />
>>>>>>> origin/main
						</Route>
						<Route path="/verify/:code" element={<VerifyPage />} />
						{/* Catch-all */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Suspense>
			</BrowserRouter>

			<Toaster
				position="top-right"
				toastOptions={{
					style: {
						background: "#1e2538",
						color: "#f1f5f9",
						border: "1px solid #252d42",
						borderRadius: "12px",
						fontSize: "14px",
					},
					success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
					error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
					loading: { iconTheme: { primary: "#3b63f5", secondary: "#fff" } },
				}}
			/>
		</QueryClientProvider>
	);
}
