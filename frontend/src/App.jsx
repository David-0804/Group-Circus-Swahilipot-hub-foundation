import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/auth";

import Layout from "./components/layout/Layout";

import BroadcastMIS_PublicSite from "./pages/auth/BroadcastMIS_PublicSite";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/dashboard/Dashboard";
import EquipmentList from "./pages/equipment/EquipmentList";
import Requests from "./pages/equipment/Requests";
import Projects from "./pages/projects/Projects";
import FM from "./pages/fm/FM";
import News from "./pages/news/News";
import Infrastructure from "./pages/infrastructure/Infrastructure";
import Videography from "./pages/videography/Videography";
import AdminUsers from "./pages/dashboard/AdminUsers";

const qc = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30000,
		},
	},
});

function PrivateRoute({ children, roles }) {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (roles && !roles.includes(user?.role)) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
}

export default function App() {
	const { isAuthenticated } = useAuthStore();

	return (
		<QueryClientProvider client={qc}>
			<BrowserRouter>
				<Routes>
					{/* PUBLIC WEBSITE */}
					<Route path="/" element={<BroadcastMIS_PublicSite />} />

					{/* LOGIN PAGE */}
					<Route
						path="/login"
						element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
					/>

					{/* PROTECTED PORTAL */}
					<Route
						path="/"
						element={
							<PrivateRoute>
								<Layout />
							</PrivateRoute>
						}>
						<Route path="dashboard" element={<Dashboard />} />
						<Route path="equipment" element={<EquipmentList />} />
						<Route path="equipment/requests" element={<Requests />} />
						<Route path="projects" element={<Projects />} />
						<Route path="fm" element={<FM />} />
						<Route path="news" element={<News />} />
						<Route path="infrastructure" element={<Infrastructure />} />
						<Route path="videography" element={<Videography />} />
						<Route
							path="admin/users"
							element={
								<PrivateRoute roles={["admin"]}>
									<AdminUsers />
								</PrivateRoute>
							}
						/>
					</Route>

					{/* UNKNOWN ROUTES */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}
