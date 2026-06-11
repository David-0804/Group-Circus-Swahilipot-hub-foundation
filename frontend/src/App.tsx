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
const CallsPage = lazy(() => import("./pages/calls/CallsPage"));

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

// ── System ────────────────────────────────────────────────────────────────────
const NotificationsPage = lazy(
	() => import("./pages/notifications/NotificationsPage"),
);
const EmergencyPage = lazy(() => import("./pages/emergency/EmergencyPage"));

// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 3, // 3 min
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

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
	return <AdminDashboard />;
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Suspense fallback={<LoadingScreen />}>
					<Routes>
						{/* ── Public ─────────────────────────────────────────────── */}
						<Route path="/login" element={<LoginPage />} />
						<Route path="/mfa" element={<MFAPage />} />
						<Route path="/verify/:code" element={<VerifyPage />} />{" "}
						{/* ── Protected (requires auth) ──────────────────────────── */}
						<Route
							element={
								<PrivateRoute>
									<AppLayout />
								</PrivateRoute>
							}>
							<Route index element={<Navigate to="/dashboard" replace />} />

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
						</Route>
						<Route path="/verify/:code" element={<VerifyPage />} />
						{/* Catch-all */}
						<Route path="*" element={<Navigate to="/dashboard" replace />} />
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
