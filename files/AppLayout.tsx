// Nexus AppLayout — Sidebar + Topbar + Embedded Chat System
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	LayoutDashboard,
	Users,
	ClipboardList,
	BookOpen,
	Star,
	Award,
	Radio,
	Newspaper,
	Wifi,
	MessageSquare,
	FolderUp,
	Camera,
	Phone,
	Package,
	BarChart3,
	DollarSign,
	Settings,
	Bell,
	LogOut,
	User,
	ChevronDown,
	ChevronRight,
	AlertTriangle,
	Shield,
	Menu,
	X,
	Activity,
	Calendar,
	Briefcase,
	GraduationCap,
	Zap,
	FileText,
	Building2,
	Headphones,
	Siren,
	TriangleAlert,
	Tv2,
} from "lucide-react";
import {
	useAuthStore,
	notificationsApi,
	emergencyApi,
} from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Chat imports ──────────────────────────────────────────────────────────────
import ChatPanel from "../chat/ChatPanel";
import { ChatTopbarButton } from "../chat/ChatTopbarButton";

interface NavItem {
	label: string;
	icon: React.ElementType;
	path?: string;
	children?: NavItem[];
	roles?: string[];
	badge?: string;
	badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },

	// ── Internship ─────────────────────────────────────────────
	{
		label: "Internship",
		icon: GraduationCap,
		roles: [
			"attachee",
			"supervisor",
			"department_leader",
			"hr_officer",
			"system_admin",
			"executive",
			"data_analyst",
			"university_coordinator",
		],
		children: [
			{ label: "Attachees", icon: Users, path: "/attachees" },
			{ label: "Attendance", icon: Activity, path: "/attendance" },
			{ label: "Tasks", icon: ClipboardList, path: "/tasks" },
			{ label: "Logbooks", icon: BookOpen, path: "/logbooks" },
			{ label: "Evaluations", icon: Star, path: "/evaluations" },
			{ label: "Certificates", icon: Award, path: "/certificates" },
		],
	},

	// ── Broadcast ──────────────────────────────────────────────
	{
		label: "Broadcast",
		icon: Tv2,
		roles: [
			"broadcast_admin",
			"broadcast_staff",
			"broadcast_student",
			"journalist",
			"presenter",
			"editor",
			"videographer",
			"station_engineer",
			"system_admin",
		],
		children: [
			{ label: "Equipment", icon: Package, path: "/equipment" },
			{ label: "Projects", icon: Briefcase, path: "/projects" },
			{
				label: "FM Station",
				icon: Radio,
				path: "/fm-report",
				badgeColor: "red",
			},
			{ label: "Radio Schedule", icon: Calendar, path: "/radio" },
			{ label: "News CMS", icon: Newspaper, path: "/news" },
			{ label: "Videography", icon: Camera, path: "/videography" },
			{ label: "Calls", icon: Phone, path: "/calls" },
		],
	},

	// ── Digital Services ───────────────────────────────────────
	{
		label: "Digital Services",
		icon: Zap,
		children: [
			{ label: "Software Licences", icon: Shield, path: "/subscriptions" },
			{ label: "Wi-Fi Access", icon: Wifi, path: "/wifi" },
			{ label: "File Transfer", icon: FolderUp, path: "/file-transfer" },
			{ label: "Feedback / Tickets", icon: MessageSquare, path: "/feedback" },
		],
	},

	// ── Enterprise ─────────────────────────────────────────────
	{
		label: "Enterprise",
		icon: Building2,
		roles: [
			"system_admin",
			"executive",
			"data_analyst",
			"hr_officer",
			"finance",
			"broadcast_admin",
		],
		children: [
			{ label: "Analytics", icon: BarChart3, path: "/analytics" },
			{ label: "HR", icon: Users, path: "/hr" },
			{ label: "Finance", icon: DollarSign, path: "/finance" },
			{ label: "User Management", icon: Shield, path: "/users" },
		],
	},

	// ── Standalone ─────────────────────────────────────────────
	{ label: "Notifications", icon: Bell, path: "/notifications" },
	{
		label: "🚨 Emergency Alert",
		icon: AlertTriangle,
		path: "/emergency-alerts",
		badgeColor: "red",
	},
	{
		label: "Settings",
		icon: Settings,
		path: "/settings",
		roles: [
			"system_admin",
			"broadcast_admin",
			"hr_officer",
			"supervisor",
			"department_leader",
			"executive",
			"data_analyst",
			"finance",
			"broadcast_staff",
			"journalist",
			"presenter",
			"editor",
			"videographer",
			"station_engineer",
			"university_coordinator",
		],
	},
];

function NavSection({ item, depth = 0 }: { item: NavItem; depth?: number }) {
	const { user } = useAuthStore();
	const location = useLocation();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (
			item.children?.some((c) => c.path && location.pathname.startsWith(c.path))
		) {
			setOpen(true);
		}
	}, [location.pathname]);

	if (item.roles && user && !item.roles.includes(user.role)) return null;

	if (item.children) {
		return (
			<div>
				<button
					onClick={() => setOpen(!open)}
					className={clsx(
						"sidebar-link w-full justify-between",
						depth > 0 && "pl-5",
					)}>
					<span className="flex items-center gap-3">
						<item.icon size={16} />
						<span>{item.label}</span>
					</span>
					{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
				</button>
				{open && (
					<div className="ml-3 pl-3 border-l border-surface-border mt-1 mb-1 space-y-0.5">
						{item.children.map((child) => (
							<NavSection key={child.label} item={child} depth={depth + 1} />
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<NavLink
			to={item.path!}
			className={({ isActive }) =>
				clsx("sidebar-link", isActive && "active", depth > 0 && "pl-5")
			}>
			<item.icon size={16} />
			<span className="flex-1">{item.label}</span>
			{item.badgeColor === "red" && (
				<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
			)}
		</NavLink>
	);
}

export default function AppLayout() {
	const { user, logout, refreshToken } = useAuthStore();
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);

	const { data: unreadCount = 0 } = useQuery({
		queryKey: ["unread-notifications"],
		queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
		refetchInterval: 30000,
	});

	const { data: emergencyAlerts = [] } = useQuery({
		queryKey: ["emergency-alerts"],
		queryFn: () =>
			emergencyApi.list().then((r) => r.data.filter((a: any) => !a.resolved)),
		refetchInterval: 60000,
	});

	const handleLogout = async () => {
		try {
			if (refreshToken) {
				await import("../../services/api").then((m) =>
					m.authApi.logout(refreshToken),
				);
			}
		} catch {}
		logout();
		navigate("/login");
		toast.success("Logged out successfully");
	};

	return (
		<div className="flex h-screen bg-surface overflow-hidden">
			{/* Mobile overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/60 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* ── Sidebar ── */}
			<aside
				className={clsx(
					"fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface-card border-r border-surface-border transition-transform duration-300",
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
				)}>
				{/* Logo */}
				<div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
					<div className="w-9 h-9 rounded-xl bg-gradient-Nexus flex items-center justify-center shadow-glow-blue">
						<Zap size={18} className="text-white" />
					</div>
					<div>
						<div className="font-display font-bold text-white text-base leading-none">
							Nexus
						</div>
						<div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">
							Enterprise
						</div>
					</div>
					<button
						className="ml-auto lg:hidden"
						onClick={() => setSidebarOpen(false)}>
						<X size={18} className="text-slate-400" />
					</button>
				</div>

				{/* Org info */}
				{user?.organisation_name && (
					<div className="px-5 py-3 border-b border-surface-border">
						<div className="text-xs text-slate-500 uppercase tracking-wide">
							Organisation
						</div>
						<div className="text-sm text-slate-300 font-medium truncate mt-0.5">
							{user.organisation_name}
						</div>
						{user.branch_name && (
							<div className="text-xs text-slate-500 truncate">
								{user.branch_name}
							</div>
						)}
					</div>
				)}

				{/* Nav */}
				<nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
					{NAV_ITEMS.map((item) => (
						<NavSection key={item.label} item={item} />
					))}
				</nav>

				{/* User */}
				<div className="border-t border-surface-border p-3">
					<div
						className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated cursor-pointer"
						onClick={() => navigate("/profile")}>
						<div className="w-9 h-9 rounded-full bg-gradient-Nexus flex items-center justify-center text-sm font-bold text-white shrink-0">
							{user?.first_name?.[0]}
							{user?.last_name?.[0]}
						</div>
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium text-white truncate">
								{user?.full_name}
							</div>
							<div className="text-[10px] text-slate-500">
								{user?.role_display}
							</div>
						</div>
					</div>
					<button
						onClick={handleLogout}
						className="sidebar-link w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-900/20">
						<LogOut size={15} />
						<span>Logout</span>
					</button>
				</div>
			</aside>

			{/* ── Main ── */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Topbar */}
				<header className="flex items-center gap-4 px-6 py-3.5 border-b border-surface-border bg-surface-card shrink-0">
					<button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
						<Menu size={20} className="text-slate-400" />
					</button>

					<div className="flex-1" />

					{/* Emergency alert badge */}
					{emergencyAlerts.length > 0 && (
						<button
							onClick={() => navigate("/emergency-alerts")}
							className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-500/40 rounded-lg text-red-400 text-xs font-semibold animate-pulse">
							<AlertTriangle size={14} />
							{emergencyAlerts.length} Active Alert
							{emergencyAlerts.length > 1 ? "s" : ""}
						</button>
					)}

					{/* ── Chat button with badge ── */}
					<ChatTopbarButton />

					{/* Notifications */}
					<button
						onClick={() => navigate("/notifications")}
						className="relative btn-icon btn-secondary">
						<Bell size={16} />
						{unreadCount > 0 && (
							<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
								{unreadCount > 9 ? "9+" : unreadCount}
							</span>
						)}
					</button>

					{/* Profile dropdown */}
					<div className="relative">
						<button
							className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
							onClick={() => setShowUserMenu(!showUserMenu)}>
							<div className="w-7 h-7 rounded-full bg-gradient-Nexus flex items-center justify-center text-xs font-bold text-white">
								{user?.first_name?.[0]}
								{user?.last_name?.[0]}
							</div>
							<span className="text-sm text-slate-300 hidden sm:block">
								{user?.first_name}
							</span>
							<ChevronDown size={13} className="text-slate-500" />
						</button>

						{showUserMenu && (
							<div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated z-50 py-1 animate-fade-in">
								<NavLink
									to="/profile"
									className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
									onClick={() => setShowUserMenu(false)}>
									<User size={14} /> My Profile
								</NavLink>

								{user?.role === "system_admin" && (
									<NavLink
										to="/settings"
										className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
										onClick={() => setShowUserMenu(false)}>
										<Settings size={14} /> Settings
									</NavLink>
								)}

								<div className="border-t border-surface-border my-1" />
								<button
									onClick={handleLogout}
									className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">
									<LogOut size={14} /> Logout
								</button>
							</div>
						)}
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto bg-surface p-6">
					<Outlet />
				</main>
			</div>

			{/* ── Chat Panel (fixed, floating) ── */}
			<ChatPanel />
		</div>
	);
}
