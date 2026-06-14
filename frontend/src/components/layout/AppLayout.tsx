// Nexus AppLayout — Sidebar + Topbar + Embedded Chat System
import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
	Moon,
	Sun,
	Accessibility,
	SlidersHorizontal,
	CheckCheck,
	Type,
} from "lucide-react";
import {
	useAuthStore,
	notificationsApi,
	emergencyApi,
	api,
} from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Chat imports ──────────────────────────────────────────────────────────────
import ChatPanel from "../chat/ChatPanel";
import { ChatTopbarButton } from "../chat/ChatTopbarButton";

// ── AI Assistant imports ────────────────────────────────────────────────────
import { AITopbarButton, AIPanel } from "../ai/AIAssistant";

// ── Font definitions ──────────────────────────────────────────────────────────
const FONT_OPTIONS = [
	{
		id: "default",
		label: "Default",
		description: "System default — clean and neutral",
		cssClass: "",
		preview: "Aa",
		fontFamily: "",
	},
	{
		id: "dyslexic",
		label: "Dyslexic-friendly",
		description: "OpenDyslexic — optimised for readability",
		cssClass: "font-dyslexic",
		preview: "Aa",
		fontFamily: "'OpenDyslexic', sans-serif",
	},
	{
		id: "mono",
		label: "Monospace",
		description: "JetBrains Mono — precise and structured",
		cssClass: "font-mono-nexus",
		preview: "Aa",
		fontFamily: "'JetBrains Mono', monospace",
	},
	{
		id: "serif",
		label: "Serif",
		description: "Georgia — traditional and readable",
		cssClass: "font-serif-nexus",
		preview: "Aa",
		fontFamily: "Georgia, serif",
	},
] as const;

type FontId = (typeof FONT_OPTIONS)[number]["id"];

/** Apply a font to the document and mirror to localStorage cache */
function applyFont(fontId: FontId) {
	const root = document.documentElement;
	FONT_OPTIONS.forEach((f) => {
		if (f.cssClass) root.classList.remove(f.cssClass);
	});
	const chosen = FONT_OPTIONS.find((f) => f.id === fontId);
	if (chosen?.cssClass) root.classList.add(chosen.cssClass);
	if (chosen?.fontFamily) {
		root.style.setProperty("--nexus-font-body", chosen.fontFamily);
		document.body.style.fontFamily = chosen.fontFamily;
	} else {
		root.style.removeProperty("--nexus-font-body");
		document.body.style.fontFamily = "";
	}
	localStorage.setItem("nexus-font", fontId);
}

// ── Preferences API ───────────────────────────────────────────────────────────
const preferencesApi = {
	get: () => api.get("/accounts/preferences/").then((r) => r.data),
	patch: (data: { font_preference: FontId }) =>
		api.patch("/accounts/preferences/", data).then((r) => r.data),
};

// ── Accessibility Modal ───────────────────────────────────────────────────────
function AccessibilityModal({ onClose }: { onClose: () => void }) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const qc = useQueryClient();

	const { data: prefs, isLoading } = useQuery({
		queryKey: ["user-preferences"],
		queryFn: preferencesApi.get,
		staleTime: Infinity,
	});

	const [selectedFont, setSelectedFont] = useState<FontId>("default");

	useEffect(() => {
		if (prefs?.font_preference)
			setSelectedFont(prefs.font_preference as FontId);
	}, [prefs]);

	const saveMutation = useMutation({
		mutationFn: (font: FontId) =>
			preferencesApi.patch({ font_preference: font }),
		onSuccess: (_, font) => {
			applyFont(font);
			qc.invalidateQueries({ queryKey: ["user-preferences"] });
			toast.success("Accessibility settings successfully saved", {
				icon: "✅",
				duration: 3000,
				style: {
					background: "#1e2538",
					color: "#f1f5f9",
					border: "1px solid #22c55e40",
					borderRadius: "12px",
					fontSize: "14px",
				},
			});
			onClose();
		},
		onError: () => toast.error("Failed to save — please try again"),
	});

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onClose();
	};
	useEffect(() => {
		const fn = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", fn);
		return () => window.removeEventListener("keydown", fn);
	}, [onClose]);

	return (
		<div
			ref={overlayRef}
			onClick={handleOverlayClick}
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
			<div className="bg-surface-card border border-surface-border rounded-2xl shadow-elevated w-full max-w-md animate-slide-up">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-Swahilipot-600/20 border border-Swahilipot-500/30 flex items-center justify-center">
							<Accessibility size={16} className="text-Swahilipot-400" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-white leading-none">
								Accessibility
							</h2>
							<p className="text-xs text-slate-500 mt-0.5">
								Synced across all your devices
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-surface-elevated transition-colors">
						<X size={16} />
					</button>
				</div>

				{/* Body */}
				<div className="px-6 py-5 space-y-4">
					<div>
						<div className="flex items-center gap-2 mb-3">
							<Type size={13} className="text-slate-400" />
							<span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
								Font type
							</span>
						</div>

						{isLoading ? (
							<div className="space-y-2">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="skeleton h-16 rounded-xl" />
								))}
							</div>
						) : (
							<div className="space-y-2">
								{FONT_OPTIONS.map((font) => {
									const isSelected = selectedFont === font.id;
									return (
										<button
											key={font.id}
											onClick={() => setSelectedFont(font.id)}
											className={clsx(
												"w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-150 text-left group",
												isSelected
													? "bg-Swahilipot-600/15 border-Swahilipot-500/50 shadow-glow-blue"
													: "bg-surface-elevated border-surface-border hover:border-slate-600",
											)}>
											{/* Font preview swatch */}
											<div
												className={clsx(
													"w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-colors",
													isSelected
														? "bg-Swahilipot-600/30 text-Swahilipot-400"
														: "bg-surface-muted text-slate-400 group-hover:text-slate-200",
												)}
												style={
													font.fontFamily ? { fontFamily: font.fontFamily } : {}
												}>
												{font.preview}
											</div>
											{/* Labels */}
											<div className="flex-1 min-w-0">
												<div
													className={clsx(
														"text-sm font-medium leading-none",
														isSelected ? "text-white" : "text-slate-300",
													)}>
													{font.label}
												</div>
												<div className="text-xs text-slate-500 mt-1 truncate">
													{font.description}
												</div>
											</div>
											{/* Radio indicator */}
											<div
												className={clsx(
													"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
													isSelected
														? "border-Swahilipot-500 bg-Swahilipot-500"
														: "border-surface-muted",
												)}>
												{isSelected && (
													<CheckCheck
														size={11}
														className="text-white"
														strokeWidth={3}
													/>
												)}
											</div>
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
					<button onClick={onClose} className="btn btn-secondary text-sm">
						Cancel
					</button>
					<button
						onClick={() => saveMutation.mutate(selectedFont)}
						disabled={saveMutation.isPending || isLoading}
						className="btn btn-primary text-sm min-w-[96px] justify-center">
						{saveMutation.isPending ? (
							<span className="flex items-center gap-2">
								<span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
								Saving…
							</span>
						) : (
							"Save changes"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Preferences Modal ─────────────────────────────────────────────────────────
function PreferencesModal({
	isDark,
	onToggleDark,
	onClose,
}: {
	isDark: boolean;
	onToggleDark: () => void;
	onClose: () => void;
}) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onClose();
	};
	useEffect(() => {
		const fn = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", fn);
		return () => window.removeEventListener("keydown", fn);
	}, [onClose]);

	return (
		<div
			ref={overlayRef}
			onClick={handleOverlayClick}
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
			<div className="bg-surface-card border border-surface-border rounded-2xl shadow-elevated w-full max-w-sm animate-slide-up">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
							<SlidersHorizontal size={16} className="text-purple-400" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-white leading-none">
								Preferences
							</h2>
							<p className="text-xs text-slate-500 mt-0.5">
								Appearance & display settings
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-surface-elevated transition-colors">
						<X size={16} />
					</button>
				</div>

				{/* Body */}
				<div className="px-6 py-5 space-y-3">
					<div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center">
								{isDark ? (
									<Moon size={15} className="text-slate-400" />
								) : (
									<Sun size={15} className="text-amber-400" />
								)}
							</div>
							<div>
								<div className="text-sm font-medium text-white">Theme</div>
								<div className="text-xs text-slate-500">
									{isDark ? "Dark mode active" : "Light mode active"}
								</div>
							</div>
						</div>
						{/* Toggle pill */}
						<button
							onClick={onToggleDark}
							style={{ width: "42px", height: "22px" }}
							className={clsx(
								"relative rounded-full transition-colors duration-200 flex-shrink-0",
								isDark ? "bg-Swahilipot-600" : "bg-surface-muted",
							)}>
							<span
								className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform duration-200"
								style={{
									width: "18px",
									height: "18px",
									transform: isDark ? "translateX(20px)" : "translateX(0)",
								}}
							/>
						</button>
					</div>
					<p className="text-xs text-slate-600 px-1">
						More preferences will be available in a future update.
					</p>
				</div>

				<div className="flex justify-end px-6 py-4 border-t border-surface-border">
					<button onClick={onClose} className="btn btn-secondary text-sm">
						Done
					</button>
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

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

/** Derives a readable page name from the current URL path */
function PageBreadcrumb() {
	const location = useLocation();
	const segment =
		location.pathname.split("/").filter(Boolean)[0] ?? "dashboard";
	const label = segment
		.replace(/-/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());

	const labelMap: Record<string, string> = {
		dashboard: "Dashboard",
		attendance: "Attendance",
		tasks: "Tasks",
		logbooks: "Logbooks",
		evaluations: "Evaluations",
		certificates: "Certificates",
		attachees: "Attachees",
		equipment: "Equipment",
		projects: "Projects",
		"fm-report": "FM Station",
		radio: "Radio Schedule",
		news: "News CMS",
		videography: "Videography",
		calls: "Calls",
		subscriptions: "Software Licences",
		wifi: "Wi-Fi Access",
		"file-transfer": "File Transfer",
		feedback: "Feedback / Tickets",
		analytics: "Analytics",
		hr: "HR",
		finance: "Finance",
		users: "User Management",
		settings: "Settings",
		notifications: "Notifications",
		"emergency-alerts": "Emergency Alerts",
		profile: "My Profile",
	};

	return (
		<div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
			<span className="text-slate-500 truncate">
				{labelMap[segment] ?? label}
			</span>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AppLayout() {
	const { user, logout, refreshToken } = useAuthStore();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [ showNotifMenu, setShowNotifMenu ] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showAccessibility, setShowAccessibility] = useState(false);
	const [showPreferences, setShowPreferences] = useState(false);
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("nexus-theme");
		return saved ? saved === "dark" : true;
	});

	// ── 1. Apply localStorage cache instantly on mount (no flash) ─────────────
	// ── 2. Then fetch from backend and re-apply if the server value differs ───
	useEffect(() => {
		const cached = localStorage.getItem("nexus-font") as FontId | null;
		if (cached && cached !== "default") applyFont(cached);

		preferencesApi
			.get()
			.then((prefs) => {
				const serverFont = (prefs?.font_preference ?? "default") as FontId;
				const localFont = (localStorage.getItem("nexus-font") ??
					"default") as FontId;
				if (serverFont !== localFont) applyFont(serverFont);
			})
			.catch(() => {
				/* silently fall back to cached / default */
			});
	}, []);

	// Apply / remove the "light" class on <html> whenever isDark changes
	useEffect(() => {
		const root = document.documentElement;
		if (isDark) {
			root.classList.remove("light");
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
			root.classList.add("light");
		}
		localStorage.setItem("nexus-theme", isDark ? "dark" : "light");
	}, [isDark]);

	const { data: unreadCount = 0 } = useQuery({
		queryKey: ["unread-notifications"],
		queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
		refetchInterval: 30000,
	});
	const { data: recentNotifications = [] } = useQuery({
		queryKey: ["notifications-preview"],
		queryFn: () =>
			notificationsApi
				.list({ unread: "true" })
				.then((r) => (r.data.results ?? r.data).slice(0, 5)),
		enabled: showNotifMenu,
		refetchInterval: showNotifMenu ? 30000 : false,
	});

	const markAllMutation = useMutation({
		mutationFn: () => notificationsApi.markAllRead(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
			qc.invalidateQueries({ queryKey: ["unread-notifications"] });
			qc.invalidateQueries({ queryKey: ["notifications-preview"] });
			toast.success("All notifications marked as read");
		},
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
		// Reset font so the next user on this browser starts clean
		applyFont("default");
		logout();
		navigate("/login");
		toast.success("Logged out successfully");
	};

	const handleToggleDark = () => setIsDark((d) => !d);

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
							Swahilipot
						</div>
						<div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">
							Foundation
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
					<NavLink
						to="/profile"
						className={({ isActive }) =>
							clsx("sidebar-link", isActive && "active")
						}>
						<div className="w-9 h-9 rounded-full bg-gradient-Nexus flex items-center justify-center text-sm font-bold text-white shrink-0">
							{user?.first_name?.[0]}
							{user?.last_name?.[0]}
						</div>
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium truncate">
								{user?.full_name}
							</div>
							<div className="text-[10px] text-slate-500">
								{user?.role_display}
							</div>
						</div>
					</NavLink>
					<button
						onClick={handleLogout}
						className="sidebar-link w-full mt-1 text-red-500 transition-colors"
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(239,68,68,0.12)";
							e.currentTarget.style.color = "#dc2626";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color = "";
						}}>
						<LogOut size={15} />
						<span>Logout</span>
					</button>
				</div>
			</aside>

			{/* ── Main ── */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Topbar */}
				<header className="flex items-center gap-2 px-4 py-0 h-12 border-b border-surface-border bg-surface-card shrink-0 z-10 relative">
					<button
						className="lg:hidden shrink-0 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
						onClick={() => setSidebarOpen(true)}>
						<Menu size={18} className="text-slate-400" />
					</button>

					{/* Breadcrumb */}
					<PageBreadcrumb />

					<div className="flex-1" />

					{/* Emergency alert badge */}
					{emergencyAlerts.length > 0 && (
						<button
							onClick={() => navigate("/emergency-alerts")}
							className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/30 border border-red-500/40 rounded-lg text-red-400 text-xs font-semibold animate-pulse">
							<AlertTriangle size={13} />
							{emergencyAlerts.length} Alert
							{emergencyAlerts.length > 1 ? "s" : ""}
						</button>
					)}

					{/* ── Chat button with badge ── */}
					<ChatTopbarButton />

					{/* ── AI Assistant button ── */}
					<AITopbarButton />

					{/* ── Dark / Light mode toggle ── */}
					<button
						onClick={handleToggleDark}
						className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
						title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
						{isDark ? <Moon size={15} /> : <Sun size={15} />}
					</button>

					{/* Notifications dropdown */}
					<div className="relative">
						<button
							onClick={() => {
								setShowNotifMenu((v) => !v);
								setShowUserMenu(false);
							}}
							className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors">
							<Bell size={15} />
							{unreadCount > 0 && (
								<span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
									{unreadCount > 9 ? "9+" : unreadCount}
								</span>
							)}
						</button>

						{showNotifMenu && (
							<>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setShowNotifMenu(false)}
								/>
								<div className="absolute right-0 top-full mt-2 w-80 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated z-50 animate-fade-in overflow-hidden">
									{/* Header */}
									<div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
										<span className="text-sm font-semibold text-white">
											Notifications
										</span>
										{unreadCount > 0 && (
											<button
												onClick={() => markAllMutation.mutate()}
												disabled={markAllMutation.isPending}
												title="Mark all as read"
												className="p-1.5 rounded-lg text-slate-400 hover:text-nexus-400 hover:bg-nexus-500/10 transition-colors">
												<CheckCheck size={14} />
											</button>
										)}
									</div>

									{/* Items */}
									<div className="max-h-72 overflow-y-auto divide-y divide-surface-border">
										{recentNotifications.length === 0 ? (
											<div className="py-10 text-center">
												<Bell
													size={24}
													className="mx-auto text-slate-600 mb-2"
												/>
												<p className="text-xs text-slate-500">
													You have no notifications
												</p>
											</div>
										) : (
											recentNotifications.map((n: any) => {
												const TYPE_ICONS: Record<string, any> = {
													emergency_alert: AlertTriangle,
													fm_outage: Bell,
													task_assigned: Bell,
												};
												const Icon = TYPE_ICONS[n.notification_type] ?? Bell;
												return (
													<div
														key={n.id}
														className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted transition-colors cursor-pointer"
														onClick={() => {
															setShowNotifMenu(false);
															navigate("/notifications");
														}}>
														<div className="w-7 h-7 rounded-lg bg-nexus-500/10 flex items-center justify-center shrink-0 mt-0.5">
															<Icon size={13} className="text-nexus-400" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs font-medium text-white leading-snug truncate">
																{n.title}
															</p>
															<p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
																{n.body}
															</p>
														</div>
														{!(n.is_read ?? n.read) && (
															<div className="w-1.5 h-1.5 rounded-full bg-nexus-400 shrink-0 mt-1.5" />
														)}
													</div>
												);
											})
										)}
									</div>

									{/* Footer */}
									<div className="border-t border-surface-border">
										<button
											onClick={() => {
												setShowNotifMenu(false);
												navigate("/notifications");
											}}
											className="w-full py-2.5 text-xs text-slate-400 hover:text-white hover:bg-surface-muted transition-colors font-medium">
											See all
										</button>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Profile dropdown */}
					<div className="relative">
						<button
							className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-surface-elevated transition-colors"
							onClick={() => setShowUserMenu(!showUserMenu)}>
							<div className="w-6 h-6 rounded-full bg-gradient-Nexus flex items-center justify-center text-[10px] font-bold text-white">
								{user?.first_name?.[0]}
								{user?.last_name?.[0]}
							</div>
							<span className="text-sm text-slate-300 hidden sm:block">
								{user?.first_name}
							</span>
							<ChevronDown size={12} className="text-slate-500" />
						</button>

						{showUserMenu && (
							<>
								{/* Click-outside backdrop */}
								<div
									className="fixed inset-0 z-40"
									onClick={() => setShowUserMenu(false)}
								/>
								<div className="absolute right-0 top-full mt-2 w-52 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated z-50 py-1.5 animate-fade-in">
									{/* My Profile */}
									<NavLink
										to="/profile"
										className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
										onClick={() => setShowUserMenu(false)}>
										<User size={14} className="text-slate-400" /> My Profile
									</NavLink>

									{/* Accessibility */}
									<button
										className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
										onClick={() => {
											setShowUserMenu(false);
											setShowAccessibility(true);
										}}>
										<Accessibility size={14} className="text-slate-400" />
										Accessibility
									</button>

									{/* Preferences */}
									<button
										className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
										onClick={() => {
											setShowUserMenu(false);
											setShowPreferences(true);
										}}>
										<SlidersHorizontal size={14} className="text-slate-400" />
										Preferences
									</button>

									{/* Settings — admin only */}
									{user?.role === "system_admin" && (
										<NavLink
											to="/settings"
											className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-muted transition-colors"
											onClick={() => setShowUserMenu(false)}>
											<Settings size={14} className="text-slate-400" /> Settings
										</NavLink>
									)}

									<div className="border-t border-surface-border my-1" />

									{/* Logout */}
									<button
										onClick={() => {
											setShowUserMenu(false);
											handleLogout();
										}}
										className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 transition-colors"
										onMouseEnter={(e) => {
											e.currentTarget.style.background = "rgba(239,68,68,0.12)";
											e.currentTarget.style.color = "#dc2626";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = "transparent";
											e.currentTarget.style.color = "";
										}}>
										<LogOut size={14} /> Logout
									</button>
								</div>
							</>
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

			{/* ── AI Assistant Panel (fixed, floating) ── */}
			<AIPanel />

			{/* ── Modals ── */}
			{showAccessibility && (
				<AccessibilityModal onClose={() => setShowAccessibility(false)} />
			)}
			{showPreferences && (
				<PreferencesModal
					isDark={isDark}
					onToggleDark={handleToggleDark}
					onClose={() => setShowPreferences(false)}
				/>
			)}
		</div>
	);
}
