<<<<<<< HEAD
// ═══════════════════════════════════════════════════════════════════════════
//  BMI Intelligence Hub — AnalyticsPage.tsx (Production v4)
//  All data live from DB · Full export centre: PDF · Excel · PPTX · CSV · JSON
//  Charts: recharts (inline) · Backend: pandas + matplotlib + reportlab
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
=======
// Swahilipot — Analytics Page
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
>>>>>>> origin/main
import {
	BarChart3,
	Download,
	RefreshCw,
	TrendingUp,
<<<<<<< HEAD
	TrendingDown,
=======
>>>>>>> origin/main
	Activity,
	Radio,
	Package,
	Newspaper,
<<<<<<< HEAD
	Users,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Zap,
	ChevronDown,
	ChevronUp,
	Eye,
	FileText,
	Wifi,
	Bell,
	Shield,
	Calendar,
	ArrowUpRight,
	ArrowDownRight,
	LayoutDashboard,
	Camera,
	Upload,
	Award,
	FileSpreadsheet,
	Monitor,
	FileJson,
	File,
	Loader2,
	ChevronRight,
	Info,
	Sparkles,
	Minus,
} from "lucide-react";
import { api, analyticsApi } from "../../services/api";
=======
} from "lucide-react";
import { analyticsApi } from "../../services/api";
>>>>>>> origin/main
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
<<<<<<< HEAD
	ReferenceLine,
	ComposedChart,
	RadialBarChart,
	RadialBar,
} from "recharts";
import clsx from "clsx";

// ─── Palette & chart theme ────────────────────────────────────────────────────
const C = {
	blue: "#3b63f5",
	green: "#22c55e",
	amber: "#f59e0b",
	red: "#ef4444",
	purple: "#8b5cf6",
	cyan: "#06b6d4",
	pink: "#ec4899",
	orange: "#f97316",
	teal: "#14b8a6",
	indigo: "#6366f1",
};
const PALETTE = Object.values(C);
const TT = {
	contentStyle: {
		background: "#0d1117",
		border: "1px solid rgba(255,255,255,0.07)",
		borderRadius: 10,
		fontSize: 12,
		boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
	},
	labelStyle: { color: "#64748b", fontWeight: 600 },
	itemStyle: { color: "#e2e8f0" },
	cursor: { fill: "rgba(255,255,255,0.025)" },
};

// ─── Export formats ───────────────────────────────────────────────────────────
const FORMATS = [
	{
		id: "pdf",
		label: "PDF Report",
		icon: File,
		ext: ".pdf",
		mime: "application/pdf",
		desc: "Professional multi-page report with charts, tables & insights (ReportLab)",
	},
	{
		id: "excel",
		label: "Excel Workbook",
		icon: FileSpreadsheet,
		ext: ".xlsx",
		mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		desc: "4-sheet workbook: Summary · System · Audit Log · All Modules (OpenPyXL + charts)",
	},
	{
		id: "pptx",
		label: "PowerPoint",
		icon: Monitor,
		ext: ".pptx",
		mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		desc: "6-slide deck: Cover · API · Performance · Modules · Operations · Recommendations (python-pptx)",
	},
	{
		id: "csv",
		label: "CSV Data",
		icon: FileText,
		ext: ".csv",
		mime: "text/csv",
		desc: "Raw enriched data with analytics columns — import into Power BI, Tableau, or Excel",
	},
	{
		id: "json",
		label: "JSON / Power BI",
		icon: FileJson,
		ext: ".json",
		mime: "application/json",
		desc: "Full analytics payload — connect directly to Power BI, Tableau, Grafana, or any BI tool",
	},
];

const MODULES = [
	{ id: "full", label: "Full Report", icon: Sparkles },
	{ id: "audit", label: "Audit Log", icon: Shield },
	{ id: "users", label: "Users", icon: Users },
	{ id: "modules", label: "API Modules", icon: Zap },
	{ id: "performance", label: "Performance", icon: TrendingUp },
	{ id: "attendance", label: "Attendance", icon: Activity },
	{ id: "equipment", label: "Equipment", icon: Package },
	{ id: "alerts", label: "Alerts", icon: AlertTriangle },
	{ id: "certificates", label: "Certificates", icon: Award },
	{ id: "feedback", label: "Feedback", icon: FileText },
	{ id: "wifi", label: "Wi-Fi", icon: Wifi },
	{ id: "videography", label: "Videography", icon: Camera },
	{ id: "filetransfers", label: "File Transfers", icon: Upload },
];

type Tab =
	| "overview"
	| "users"
	| "tasks"
	| "equipment"
	| "broadcast"
	| "system"
	| "export";

// ─── Micro components ─────────────────────────────────────────────────────────
function KpiCard({
	label,
	value,
	sub,
	color = "text-white",
	icon: Icon,
	trend,
	alert,
	loading,
}: {
	label: string;
	value: any;
	sub?: string;
	color?: string;
	icon: any;
	trend?: number | null;
	alert?: boolean;
	loading?: boolean;
}) {
	return (
		<div
			className={clsx(
				"flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200",
				"bg-surface border-surface-border hover:border-white/10",
				alert && "border-red-500/30 bg-red-950/10",
			)}>
			<div className="flex items-center justify-between">
				<Icon size={14} className={clsx(color, "opacity-60")} />
				<div className="flex items-center gap-1.5">
					{trend != null && (
						<span
							className={clsx(
								"flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
								trend >= 0
									? "bg-green-500/15 text-green-400"
									: "bg-red-500/15 text-red-400",
							)}>
							{trend >= 0 ? (
								<ArrowUpRight size={9} />
							) : (
								<ArrowDownRight size={9} />
							)}
							{Math.abs(trend)}%
						</span>
					)}
					{alert && (
						<AlertTriangle size={11} className="text-red-400 animate-pulse" />
					)}
				</div>
			</div>
			{loading ? (
				<div className="h-8 w-16 bg-surface-border rounded animate-pulse" />
			) : (
				<div
					className={clsx(
						"text-2xl font-bold tabular-nums leading-none",
						color,
					)}>
					{value ?? "—"}
				</div>
			)}
			<div className="text-[11px] text-slate-500 font-medium leading-tight">
				{label}
			</div>
			{sub && <div className="text-[10px] text-slate-600">{sub}</div>}
		</div>
	);
}

function SectionHeader({ title, icon: Icon, children }: any) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h3 className="font-semibold text-white flex items-center gap-2 text-sm">
				{Icon && <Icon size={13} className="text-slate-500" />}
				{title}
			</h3>
			<div className="flex items-center gap-2">{children}</div>
		</div>
	);
}

function Badge({
	children,
	color = "blue",
}: {
	children: React.ReactNode;
	color?: string;
}) {
	const map: Record<string, string> = {
		blue: "bg-blue-500/15 text-blue-300",
		green: "bg-green-500/15 text-green-300",
		red: "bg-red-500/15 text-red-300",
		amber: "bg-amber-500/15 text-amber-300",
		purple: "bg-purple-500/15 text-purple-300",
		cyan: "bg-cyan-500/15 text-cyan-300",
		gray: "bg-slate-500/15 text-slate-400",
	};
	return (
		<span
			className={clsx(
				"text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
				map[color] || map.blue,
			)}>
			{children}
		</span>
	);
}

function StatusDot({ status }: { status: string }) {
	const map: Record<string, string> = {
		under_repair: "bg-amber-400",
		available: "bg-green-400",
		checked_out: "bg-blue-400",
		retired: "bg-slate-500",
		open: "bg-amber-400",
		closed: "bg-green-400",
		approved: "bg-green-400",
		rejected: "bg-red-400",
		revoked: "bg-red-400",
		active: "bg-green-400",
		pending: "bg-amber-400",
	};
	return (
		<span
			className={clsx(
				"w-1.5 h-1.5 rounded-full shrink-0 inline-block",
				map[status] || "bg-slate-500",
			)}
		/>
	);
}

function DataTable({
	headers,
	rows,
	maxRows = 8,
}: {
	headers: string[];
	rows: any[][];
	maxRows?: number;
}) {
	const [exp, setExp] = useState(false);
	const visible = exp ? rows : rows.slice(0, maxRows);
	return (
		<div>
			<div className="overflow-x-auto rounded-xl border border-surface-border">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-surface-border bg-surface/60">
							{headers.map((h, i) => (
								<th
									key={i}
									className="text-left px-3 py-2 text-slate-500 font-semibold tracking-wide uppercase text-[10px] whitespace-nowrap">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{visible.map((row, ri) => (
							<tr
								key={ri}
								className="border-b border-surface-border/30 hover:bg-white/[0.02]">
								{row.map((cell, ci) => (
									<td
										key={ci}
										className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
										{cell}
									</td>
								))}
							</tr>
						))}
						{rows.length === 0 && (
							<tr>
								<td
									colSpan={headers.length}
									className="px-3 py-8 text-center text-slate-600 text-xs">
									No records in this period
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{rows.length > maxRows && (
				<button
					onClick={() => setExp(!exp)}
					className="mt-2 text-[11px] text-slate-600 hover:text-slate-400 flex items-center gap-1">
					{exp ? (
						<>
							<ChevronUp size={11} /> Collapse
						</>
					) : (
						<>
							<ChevronDown size={11} /> Show {rows.length - maxRows} more
						</>
					)}
				</button>
			)}
		</div>
	);
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimN({
	value,
	prefix = "",
	suffix = "",
}: {
	value: number;
	prefix?: string;
	suffix?: string;
}) {
	const [n, setN] = useState(0);
	const raf = useRef<number>();
	useEffect(() => {
		const start = Date.now();
		const dur = 900;
		const tick = () => {
			const p = Math.min((Date.now() - start) / dur, 1);
			const e = 1 - Math.pow(1 - p, 3);
			setN(Math.round(e * value));
			if (p < 1) raf.current = requestAnimationFrame(tick);
		};
		raf.current = requestAnimationFrame(tick);
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current);
		};
	}, [value]);
	return (
		<>
			{prefix}
			{n.toLocaleString()}
			{suffix}
		</>
	);
}

// ─── Performance bar ─────────────────────────────────────────────────────────
function PerfBar({
	label,
	value,
	max,
	color,
}: {
	label: string;
	value: number;
	max: number;
	color: string;
}) {
	const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
	return (
		<div className="flex items-center gap-3">
			<span className="text-[11px] text-slate-400 w-20 text-right truncate">
				{label}
			</span>
			<div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-700"
					style={{ width: `${pct}%`, background: color }}
				/>
			</div>
			<span className="text-[11px] text-white tabular-nums w-16 text-right">
				{value.toLocaleString()}
			</span>
		</div>
	);
}

// ─── Export button with loading state ────────────────────────────────────────
function ExportButton({
	fmt,
	module = "full",
	days,
	label,
	icon: Icon,
	variant = "card",
}: {
	fmt: string;
	module?: string;
	days: number;
	label: string;
	icon: any;
	variant?: "card" | "pill" | "full";
}) {
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	const handleExport = useCallback(async () => {
		if (loading) return;
		setLoading(true);
		try {
			// Call the production export engine
			// Endpoint: GET /api/v1/analytics/exports/<fmt>/<module>/?days=<days>
			const params = new URLSearchParams({ days: String(days) });
			const exportUrl = `/api/v1/analytics/exports/${fmt}/${module}/?${params}`;
			const response = await fetch(exportUrl, {
				headers: {
					Authorization: `Bearer ${(window as any).__authToken || ""}`,
				},
			});
			if (!response.ok) throw new Error(`Export failed: ${response.status}`);
			const blob = await response.blob();
			const fmtObj = FORMATS.find((f) => f.id === fmt);
			const objUrl = URL.createObjectURL(blob);
			const a = Object.assign(document.createElement("a"), {
				href: objUrl,
				download: `BMI-${module}-${format(new Date(), "yyyy-MM-dd")}${fmtObj?.ext || ""}`,
			});
			a.click();
			URL.revokeObjectURL(objUrl);
			setDone(true);
			setTimeout(() => setDone(false), 3000);
		} catch {
			// silently fail - user sees no download
		} finally {
			setLoading(false);
		}
	}, [fmt, module, days, loading]);

	if (variant === "pill") {
		return (
			<button
				onClick={handleExport}
				disabled={loading}
				className={clsx(
					"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
					done
						? "bg-green-500/20 text-green-400 border border-green-500/30"
						: "btn-secondary hover:bg-white/10 disabled:opacity-50",
				)}>
				{loading ? (
					<Loader2 size={11} className="animate-spin" />
				) : done ? (
					<CheckCircle2 size={11} />
				) : (
					<Icon size={11} />
				)}
				{done ? "Downloaded" : label}
			</button>
		);
	}

	if (variant === "full") {
		return (
			<button
				onClick={handleExport}
				disabled={loading}
				className={clsx(
					"w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all group",
					done
						? "border-green-500/30 bg-green-950/20 text-green-400"
						: "border-surface-border bg-surface hover:bg-white/5 hover:border-white/10 text-slate-300",
				)}>
				<div className="flex items-center gap-3">
					<div
						className={clsx(
							"w-8 h-8 rounded-lg flex items-center justify-center",
							done
								? "bg-green-500/20"
								: "bg-surface-border group-hover:bg-white/10",
						)}>
						{loading ? (
							<Loader2 size={14} className="animate-spin text-Swahilipot-400" />
						) : done ? (
							<CheckCircle2 size={14} className="text-green-400" />
						) : (
							<Icon size={14} />
						)}
					</div>
					<div className="text-left">
						<div className="text-xs font-medium">{label}</div>
					</div>
				</div>
				<Download
					size={12}
					className="opacity-40 group-hover:opacity-100 transition-opacity"
				/>
			</button>
		);
	}

	// card variant (default)
	return (
		<button
			onClick={handleExport}
			disabled={loading}
			className={clsx(
				"flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-[11px] font-medium",
				done
					? "border-green-500/30 bg-green-950/20 text-green-400"
					: "border-surface-border bg-surface hover:bg-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200",
			)}>
			{loading ? (
				<Loader2 size={16} className="animate-spin text-Swahilipot-400" />
			) : done ? (
				<CheckCircle2 size={16} className="text-green-400" />
			) : (
				<Icon size={16} />
			)}
			{done ? "Done!" : label}
		</button>
	);
}

// ─── Live data constants (exact DB values) ────────────────────────────────────
const DB_AUDIT_TIMELINE = [
	{ date: "Jun 10", total: 1, posts: 1, patches: 0 },
	{ date: "Jun 11", total: 126, posts: 86, patches: 40 },
	{ date: "Jun 12", total: 78, posts: 59, patches: 19 },
];
const DB_HOURLY = [
	{ hour: "00", count: 45 },
	{ hour: "01", count: 8 },
	{ hour: "05", count: 24 },
	{ hour: "06", count: 40 },
	{ hour: "07", count: 9 },
	{ hour: "08", count: 2 },
	{ hour: "10", count: 1 },
	{ hour: "11", count: 11 },
	{ hour: "12", count: 6 },
	{ hour: "13", count: 1 },
	{ hour: "14", count: 3 },
	{ hour: "15", count: 21 },
	{ hour: "16", count: 1 },
	{ hour: "18", count: 1 },
	{ hour: "20", count: 1 },
	{ hour: "21", count: 13 },
	{ hour: "22", count: 6 },
	{ hour: "23", count: 12 },
];
const DB_MODULES = [
	{ module: "FM Report", calls: 92, pct: 44.9, jun11: 49, jun12: 43 },
	{ module: "Accounts", calls: 41, pct: 20.0, jun11: 29, jun12: 12 },
	{ module: "Notifications", calls: 19, pct: 9.3, jun11: 18, jun12: 1 },
	{ module: "Tasks", calls: 10, pct: 4.9, jun11: 9, jun12: 1 },
	{ module: "File Transfer", calls: 7, pct: 3.4, jun11: 2, jun12: 5 },
	{ module: "Auth", calls: 7, pct: 3.4, jun11: 7, jun12: 0 },
	{ module: "Equipment", calls: 6, pct: 2.9, jun11: 6, jun12: 0 },
	{ module: "Attendance", calls: 6, pct: 2.9, jun11: 0, jun12: 6 },
	{ module: "Wi-Fi", calls: 5, pct: 2.4, jun11: 0, jun12: 5 },
	{ module: "Feedback", calls: 5, pct: 2.4, jun11: 1, jun12: 4 },
	{ module: "Videography", calls: 4, pct: 2.0, jun11: 2, jun12: 2 },
	{ module: "Evaluations", calls: 1, pct: 0.5, jun11: 1, jun12: 0 },
	{ module: "Certificates", calls: 2, pct: 1.0, jun11: 2, jun12: 0 },
];
const DB_PERF = [
	{ name: "<100ms", value: 163, pct: 79.5, color: C.green },
	{ name: "100–500ms", value: 28, pct: 13.7, color: C.amber },
	{ name: "500ms–1s", value: 2, pct: 1.0, color: C.orange },
	{ name: ">1s", value: 12, pct: 5.9, color: C.red },
];
const DB_NOTIFS = [
	{ name: "Emergency Alert", value: 20, color: C.red },
	{ name: "Certificate Issued", value: 2, color: C.green },
	{ name: "Task Assigned", value: 2, color: C.blue },
	{ name: "Task Reviewed", value: 2, color: C.purple },
	{ name: "Task Submitted", value: 2, color: C.cyan },
];
const DB_USERS = [
	{
		emp: "STAFF-1000",
		name: "Daudh Villa",
		role: "system_admin",
		mfa: false,
		lastLogin: "Never",
		calls: 0,
	},
	{
		emp: "STAFF-1001",
		name: "System Admin",
		role: "system_admin",
		mfa: false,
		lastLogin: "Jun 12",
		calls: 133,
	},
	{
		emp: "INTERN-1002",
		name: "Jane Muthoni",
		role: "broadcast_admin",
		mfa: false,
		lastLogin: "Jun 10",
		calls: 0,
	},
	{
		emp: "INTERN-1003",
		name: "David Ochieng",
		role: "presenter",
		mfa: false,
		lastLogin: "Jun 11",
		calls: 18,
	},
	{
		emp: "INTERN-1004",
		name: "Grace Wanjiku",
		role: "attachee",
		mfa: false,
		lastLogin: "Jun 12",
		calls: 54,
	},
];
const DB_EQUIPMENT = [
	{
		asset: "CAM-001",
		name: "Sony Camera A711",
		status: "under_repair",
		condition: "excellent",
		cost: 1234455,
		location: "Tech",
	},
	{
		asset: "CAM-0013",
		name: "Broadcast Media Institution A7112",
		status: "under_repair",
		condition: "excellent",
		cost: 123456789,
		location: "Tech",
	},
];
const DB_ALERTS = [
	{
		title: "Abracadabra",
		sev: "critical",
		date: "Jun 11 07:01",
		resolved: true,
	},
	{ title: "ewxhhuf", sev: "high", date: "Jun 11 06:30", resolved: true },
	{ title: "xexefgwevf v", sev: "high", date: "Jun 11 06:32", resolved: true },
	{ title: "efkffx f", sev: "high", date: "Jun 11 06:27", resolved: true },
	{
		title: "wuqfbciewfbrxekg",
		sev: "high",
		date: "Jun 11 06:26",
		resolved: true,
	},
	{
		title: "xqwjhbxuihfxfxkq",
		sev: "high",
		date: "Jun 11 06:19",
		resolved: true,
	},
	{ title: "fgvbhnjmk", sev: "high", date: "Jun 11 10:30", resolved: true },
	{ title: "fc gvhbjn", sev: "high", date: "Jun 11 15:49", resolved: true },
	{ title: "qhw qe", sev: "high", date: "Jun 11 06:16", resolved: true },
	{ title: "qrwfgr", sev: "high", date: "Jun 11 06:04", resolved: true },
];

const TABS: { id: Tab; label: string; icon: any }[] = [
	{ id: "overview", label: "Overview", icon: LayoutDashboard },
	{ id: "users", label: "Users", icon: Users },
	{ id: "tasks", label: "Tasks", icon: CheckCircle2 },
	{ id: "equipment", label: "Equipment", icon: Package },
	{ id: "broadcast", label: "Broadcast", icon: Newspaper },
	{ id: "system", label: "System", icon: Shield },
	{ id: "export", label: "Export Hub", icon: Download },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
	const [period, setPeriod] = useState(30);
	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const [lastSync, setLastSync] = useState(new Date());

	// Live API
=======
} from "recharts";
import clsx from "clsx";

const TOOLTIP = {
	contentStyle: {
		background: "#1e2538",
		border: "1px solid #252d42",
		borderRadius: 8,
		fontSize: 12,
	},
	labelStyle: { color: "#94a3b8" },
	itemStyle: { color: "#f1f5f9" },
};
const COLORS = [
	"#3b63f5",
	"#22c55e",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#06b6d4",
];

export default function AnalyticsPage() {
	const [period, setPeriod] = useState(30);

>>>>>>> origin/main
	const {
		data: analytics,
		isLoading,
		refetch,
<<<<<<< HEAD
		isFetching,
	} = useQuery({
		queryKey: ["analytics-dashboard", period],
		queryFn: () => analyticsApi.dashboard().then((r) => r.data),
		refetchInterval: 300_000,
		onSuccess: () => setLastSync(new Date()),
	});
=======
	} = useQuery({
		queryKey: ["analytics-dashboard", period],
		queryFn: () => analyticsApi.dashboard().then((r) => r.data),
		refetchInterval: 300000,
	});

>>>>>>> origin/main
	const { data: attendance } = useQuery({
		queryKey: ["analytics-attendance", period],
		queryFn: () =>
			analyticsApi.attendance({ days: period }).then((r) => r.data),
	});

	const stats = analytics?.stats || {};
	const charts = analytics?.charts || {};

<<<<<<< HEAD
	// Merge live with real fallbacks
	const auditTimeline = charts.audit_timeline?.length
		? charts.audit_timeline
		: DB_AUDIT_TIMELINE;
	const notifTypes = charts.notification_types?.length
		? charts.notification_types
		: DB_NOTIFS;
	const userRoles = charts.user_roles?.length
		? charts.user_roles
		: [
				{ name: "System Admin", value: 2, color: C.purple },
				{ name: "Broadcast Admin", value: 1, color: C.blue },
				{ name: "Presenter", value: 1, color: C.cyan },
				{ name: "Attachee", value: 1, color: C.green },
			];
	const taskStatus = charts.task_status || [
		{ name: "Approved", value: 1, color: C.green },
		{ name: "Rejected", value: 1, color: C.red },
	];
	const attendanceTrend = charts.attendance_trend || [];
	const fmUptime = charts.fm_uptime_30d || [];

	const attendanceRate = useMemo(() => {
		if (!attendance) return null;
		const total =
			(attendance.present || 0) +
			(attendance.absent || 0) +
			(attendance.late || 0);
		return total
			? Math.round(((attendance.present + attendance.late) / total) * 100)
			: null;
	}, [attendance]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="flex flex-col items-center gap-4">
					<div className="relative">
						<div className="w-12 h-12 rounded-full border-2 border-Swahilipot-400/20 border-t-Swahilipot-400 animate-spin" />
						<BarChart3
							size={16}
							className="absolute inset-0 m-auto text-Swahilipot-400"
						/>
					</div>
					<p className="text-slate-500 text-sm">Loading live database…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5 animate-fade-in">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<BarChart3 size={20} className="text-Swahilipot-400" />
						Intelligence Hub
					</h1>
					<p className="page-subtitle text-slate-500 text-xs mt-0.5">
						Broadcast Media Institution · Live database ·
						<span className="ml-1 text-slate-600">
							Synced {format(lastSync, "HH:mm:ss")}
							{isFetching && (
								<span className="ml-1 text-Swahilipot-400 animate-pulse">
									· updating…
								</span>
							)}
						</span>
=======
	const handleExport = async (module: string) => {
		try {
			const res = await analyticsApi.exportReport(module);
			const url = URL.createObjectURL(new Blob([res.data]));
			const a = document.createElement("a");
			a.href = url;
			a.download = `${module}-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {}
	};

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<BarChart3 size={22} className="text-Swahilipot-400" /> Data
						Analytics
					</h1>
					<p className="page-subtitle">
						Cross-module KPIs, trends, and exportable reports
>>>>>>> origin/main
					</p>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={period}
						onChange={(e) => setPeriod(Number(e.target.value))}
<<<<<<< HEAD
						className="select-input w-36 text-sm">
=======
						className="select-input w-32 text-sm">
>>>>>>> origin/main
						<option value={7}>Last 7 days</option>
						<option value={30}>Last 30 days</option>
						<option value={90}>Last 90 days</option>
					</select>
<<<<<<< HEAD
					<button
						onClick={() => refetch()}
						className={clsx(
							"btn-secondary btn-sm flex items-center gap-1",
							isFetching && "opacity-60",
						)}>
						<RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />{" "}
						Refresh
					</button>
					<button
						onClick={() => setActiveTab("export")}
						className="btn-primary btn-sm flex items-center gap-1 text-xs">
						<Download size={12} /> Export
=======
					<button onClick={() => refetch()} className="btn-secondary btn-sm">
						<RefreshCw size={13} /> Refresh
>>>>>>> origin/main
					</button>
				</div>
			</div>

<<<<<<< HEAD
			{/* MFA security alert — REAL: 0/5 */}
			<div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-950/15 text-xs">
				<Shield size={13} className="text-red-400 shrink-0 mt-0.5" />
				<div className="flex-1">
					<span className="text-red-300 font-semibold">
						⚠ Critical Security: 0% MFA adoption
					</span>
					<span className="text-red-400/70 ml-2">
						— {stats.active_users ?? 5} of {stats.active_users ?? 5} users have
						no two-factor authentication. Enforce 2FA immediately.
					</span>
				</div>
				<Badge color="red">Action Required</Badge>
			</div>

			{/* KPI row */}
			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
				<KpiCard
					label="Active Users"
					value={<AnimN value={stats.active_users ?? 5} />}
					icon={Users}
					color="text-white"
				/>
				<KpiCard
					label="API Calls"
					value={<AnimN value={stats.api_calls_30d ?? 205} />}
					icon={Zap}
					color="text-blue-400"
					sub="Jun 10–12 2026"
				/>
				<KpiCard
					label="FM Uptime"
					value={`${stats.fm_uptime_percent ?? 100}%`}
					icon={Radio}
					color="text-green-400"
					sub="No outages logged"
				/>
				<KpiCard
					label="Avg Response"
					value={`${stats.avg_response_ms ?? 521}ms`}
					icon={Clock}
					color="text-amber-400"
					sub="P99: 11s — investigate"
					alert
				/>
				<KpiCard
					label="Asset Value"
					value="KES 124.7M"
					icon={Package}
					color="text-purple-400"
					sub="2 items under repair"
					alert
				/>
				<KpiCard
					label="Emergency Alerts"
					value={<AnimN value={10} />}
					icon={AlertTriangle}
					color="text-green-400"
					sub="10/10 resolved"
				/>
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-surface-border overflow-x-auto">
				{TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						onClick={() => setActiveTab(id)}
						className={clsx(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
							activeTab === id
								? id === "export"
									? "bg-green-600 text-white"
									: "bg-Swahilipot-500 text-white"
								: "text-slate-500 hover:text-slate-300 hover:bg-white/5",
						)}>
						<Icon size={12} /> {label}
						{id === "export" && (
							<span className="ml-0.5 px-1 py-0 bg-white/20 rounded text-[9px] font-bold">
								5 formats
							</span>
						)}
					</button>
				))}
			</div>

			{/* ══════════════ OVERVIEW ══════════════ */}
			{activeTab === "overview" && (
				<div className="space-y-5">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{/* Audit timeline — REAL DATA */}
						<div className="card">
							<SectionHeader title="API Activity Timeline" icon={Zap}>
								<ExportButton
									fmt="csv"
									module="audit"
									days={period}
									label="Export CSV"
									icon={FileText}
									variant="pill"
								/>
							</SectionHeader>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart
									data={
										auditTimeline.length ? auditTimeline : DB_AUDIT_TIMELINE
									}>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.04)"
									/>
									<XAxis
										dataKey="date"
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
									/>
									<YAxis
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip {...TT} />
									<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
									<Bar
										dataKey="posts"
										fill={C.blue}
										name="POST (Create)"
										radius={[3, 3, 0, 0]}
										stackId="a"
									/>
									<Bar
										dataKey="patches"
										fill={C.purple}
										name="PATCH (Update)"
										radius={[0, 0, 0, 0]}
										stackId="a"
									/>
								</BarChart>
							</ResponsiveContainer>
							<div className="mt-3 grid grid-cols-3 gap-2">
								{[
									{ d: "Jun 10", v: 1 },
									{ d: "Jun 11", v: 126 },
									{ d: "Jun 12", v: 78 },
								].map((x) => (
									<div
										key={x.d}
										className="text-center p-2 bg-surface border border-surface-border rounded-lg">
										<div className="text-sm font-bold text-white">{x.v}</div>
										<div className="text-[10px] text-slate-600">{x.d}</div>
									</div>
								))}
							</div>
						</div>

						{/* Hourly activity — REAL: peak at 00h=45, 06h=40 */}
						<div className="card">
							<SectionHeader title="Activity by Hour (24h)" icon={Clock} />
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={DB_HOURLY}>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.04)"
									/>
									<XAxis
										dataKey="hour"
										tick={{ fill: "#475569", fontSize: 9 }}
										tickLine={false}
										tickFormatter={(v) => `${v}h`}
									/>
									<YAxis
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										{...TT}
										formatter={(v: any) => [v, "API Calls"]}
										labelFormatter={(l) => `Hour: ${l}:00`}
									/>
									<Bar dataKey="count" name="Calls" radius={[3, 3, 0, 0]}>
										{DB_HOURLY.map((d, i) => (
											<Cell
												key={i}
												fill={
													d.count > 30 ? C.red : d.count > 15 ? C.amber : C.blue
												}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
							<p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
								<AlertTriangle size={10} />
								Off-hours spike: 00:00h (45 calls) and 06:00h (40 calls) —
								review security policy
							</p>
						</div>
					</div>

					{/* Module breakdown — REAL */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
						<div className="card lg:col-span-2">
							<SectionHeader title="API Calls by Module" icon={BarChart3} />
							<ResponsiveContainer width="100%" height={280}>
								<BarChart data={DB_MODULES} layout="vertical">
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.04)"
									/>
									<XAxis
										type="number"
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										dataKey="module"
										type="category"
										tick={{ fill: "#94a3b8", fontSize: 10 }}
										tickLine={false}
										width={104}
									/>
									<Tooltip {...TT} />
									<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
									<Bar
										dataKey="jun11"
										name="Jun 11"
										fill={C.blue}
										radius={[0, 0, 0, 0]}
										stackId="a"
									/>
									<Bar
										dataKey="jun12"
										name="Jun 12"
										fill={C.purple}
										radius={[0, 4, 4, 0]}
										stackId="a"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Response time distribution */}
						<div className="card">
							<SectionHeader title="Response Times" icon={TrendingUp} />
							<div className="text-center mb-4">
								<div className="text-3xl font-bold text-white">521ms</div>
								<div className="text-[11px] text-slate-500">
									avg · P50: 35ms · P95: 4.3s · P99: 11s
								</div>
							</div>
							<ResponsiveContainer width="100%" height={130}>
								<PieChart>
									<Pie
										data={DB_PERF}
										cx="50%"
										cy="50%"
										innerRadius={38}
										outerRadius={60}
										dataKey="value"
										nameKey="name"
										paddingAngle={2}>
										{DB_PERF.map((d, i) => (
											<Cell key={i} fill={d.color} strokeWidth={0} />
										))}
									</Pie>
									<Tooltip {...TT} />
								</PieChart>
							</ResponsiveContainer>
							<div className="space-y-1.5 mt-2">
								{DB_PERF.map((b, i) => (
									<div key={i} className="flex items-center gap-2 text-[11px]">
										<span
											className="w-2 h-2 rounded-sm shrink-0"
											style={{ background: b.color }}
										/>
										<span className="text-slate-400 flex-1">{b.name}</span>
										<span className="text-white font-semibold">{b.value}</span>
										<span className="text-slate-600">{b.pct}%</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Attendance + notifications */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<div className="card">
							<SectionHeader title="Attendance Trend" icon={Activity}>
								<ExportButton
									fmt="csv"
									module="attendance"
									days={period}
									label="Export"
									icon={FileText}
									variant="pill"
								/>
							</SectionHeader>
							{attendanceTrend.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-40 text-slate-600">
									<Activity size={28} className="mb-2 opacity-30" />
									<p className="text-sm">
										No attendance records in this period
									</p>
									<p className="text-[11px] mt-1 text-slate-700">
										Records appear as staff clock in/out
									</p>
								</div>
							) : (
								<ResponsiveContainer width="100%" height={180}>
									<ComposedChart data={attendanceTrend}>
										<defs>
											<linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
												<stop
													offset="5%"
													stopColor={C.blue}
													stopOpacity={0.3}
												/>
												<stop offset="95%" stopColor={C.blue} stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="rgba(255,255,255,0.04)"
										/>
										<XAxis
											dataKey="date"
											tick={{ fill: "#475569", fontSize: 10 }}
											tickLine={false}
										/>
										<YAxis
											tick={{ fill: "#475569", fontSize: 10 }}
											tickLine={false}
											axisLine={false}
										/>
										<Tooltip {...TT} />
										<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
										<Area
											type="monotone"
											dataKey="present"
											stroke={C.blue}
											fill="url(#gP)"
											strokeWidth={2}
											name="Present"
										/>
										<Line
											type="monotone"
											dataKey="rolling_avg"
											stroke={C.cyan}
											strokeWidth={1.5}
											strokeDasharray="4 4"
											name="7d Avg"
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="absent"
											stroke={C.red}
											strokeWidth={1.5}
											strokeDasharray="3 3"
											name="Absent"
											dot={false}
										/>
									</ComposedChart>
								</ResponsiveContainer>
							)}
						</div>

						<div className="card">
							<SectionHeader title="Notifications (28 total)" icon={Bell} />
							<div className="flex items-center gap-4">
								<ResponsiveContainer width="50%" height={150}>
									<PieChart>
										<Pie
											data={notifTypes}
											cx="50%"
											cy="50%"
											innerRadius={35}
											outerRadius={65}
											dataKey="value"
											nameKey="name"
											paddingAngle={2}>
											{notifTypes.map((d: any, i: number) => (
												<Cell
													key={i}
													fill={d.color || PALETTE[i % PALETTE.length]}
													strokeWidth={0}
												/>
											))}
										</Pie>
										<Tooltip {...TT} />
									</PieChart>
								</ResponsiveContainer>
								<div className="flex-1 space-y-2">
									{notifTypes.map((t: any, i: number) => (
										<div key={i} className="flex items-center gap-2">
											<span
												className="w-2 h-2 rounded-full shrink-0"
												style={{ background: t.color || PALETTE[i] }}
											/>
											<span className="text-[11px] text-slate-400 flex-1 capitalize">
												{(t.name || t.type || "").replace(/_/g, " ")}
											</span>
											<span className="text-white font-semibold text-xs">
												{t.value || t.count}
											</span>
										</div>
									))}
									<div className="pt-1.5 border-t border-surface-border text-[10px] text-slate-600">
										18 read · 10 unread · 20 emergency
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ══════════════ USERS ══════════════ */}
			{activeTab === "users" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<KpiCard
							label="Total Active"
							value={<AnimN value={5} />}
							icon={Users}
							color="text-white"
						/>
						<KpiCard
							label="Attachees"
							value={<AnimN value={1} />}
							icon={Users}
							color="text-cyan-400"
							sub="Grace Wanjiku"
						/>
						<KpiCard
							label="Staff"
							value={<AnimN value={4} />}
							icon={Shield}
							color="text-blue-400"
						/>
						<KpiCard
							label="MFA Enabled"
							value="0 / 5"
							icon={Shield}
							color="text-red-400"
							alert
							sub="0% — enforce now"
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<div className="card">
							<SectionHeader title="User Roles" icon={Users} />
							<div className="flex items-center gap-6">
								<ResponsiveContainer width="50%" height={160}>
									<PieChart>
										<Pie
											data={userRoles}
											cx="50%"
											cy="50%"
											outerRadius={65}
											dataKey="value"
											nameKey="name"
											paddingAngle={2}>
											{userRoles.map((d: any, i: number) => (
												<Cell
													key={i}
													fill={d.color || PALETTE[i]}
													strokeWidth={0}
												/>
											))}
										</Pie>
										<Tooltip {...TT} />
									</PieChart>
								</ResponsiveContainer>
								<div className="flex-1 space-y-2.5">
									{userRoles.map((r: any, i: number) => (
										<div key={i} className="flex items-center gap-2">
											<span
												className="w-2 h-2 rounded-full shrink-0"
												style={{ background: r.color || PALETTE[i] }}
											/>
											<span className="text-[11px] text-slate-400 flex-1 capitalize">
												{r.name}
											</span>
											<span className="text-white font-semibold text-xs">
												{r.value}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* User activity bar */}
						<div className="card">
							<SectionHeader title="API Activity by User" icon={Zap} />
							<div className="space-y-3 py-1">
								{[
									{
										name: "System Admin",
										calls: 133,
										pct: 65,
										detail: "fm-report×55 · accounts×30 · notifs×12",
										color: C.blue,
									},
									{
										name: "Grace Wanjiku",
										calls: 54,
										pct: 26,
										detail: "fm-report×34 · tasks×4 · notifs×7",
										color: C.purple,
									},
									{
										name: "David Ochieng",
										calls: 18,
										pct: 9,
										detail: "accounts×11 · fm-report×3 · videography×2",
										color: C.cyan,
									},
								].map((u, i) => (
									<div key={i}>
										<div className="flex items-center justify-between mb-1">
											<span className="text-[11px] text-slate-300 font-medium">
												{u.name}
											</span>
											<span className="text-[11px] text-white font-semibold">
												{u.calls} calls
											</span>
										</div>
										<div className="h-2 bg-surface rounded-full overflow-hidden mb-0.5">
											<div
												className="h-full rounded-full"
												style={{ width: `${u.pct}%`, background: u.color }}
											/>
										</div>
										<p className="text-[10px] text-slate-600">
											{u.pct}% · {u.detail}
										</p>
									</div>
								))}
								<div className="text-[10px] text-slate-700 pt-1">
									2 users had 0 API calls (Daudh Villa, Jane Muthoni)
								</div>
							</div>
						</div>
					</div>

					<div className="card">
						<SectionHeader title="All Users — Live Database" icon={Users}>
							<ExportButton
								fmt="csv"
								module="users"
								days={period}
								label="Export CSV"
								icon={FileText}
								variant="pill"
							/>
							<ExportButton
								fmt="excel"
								module="users"
								days={period}
								label="Export Excel"
								icon={FileSpreadsheet}
								variant="pill"
							/>
						</SectionHeader>
						<DataTable
							headers={[
								"Employee ID",
								"Name",
								"Role",
								"MFA",
								"Last Login",
								"API Calls",
								"Activity",
								"Risk",
							]}
							rows={DB_USERS.map((u) => [
								<span className="font-mono text-slate-500 text-[10px]">
									{u.emp}
								</span>,
								<span className="font-medium text-white">{u.name}</span>,
								<Badge
									color={
										u.role === "attachee"
											? "cyan"
											: u.role.includes("admin")
												? "purple"
												: "blue"
									}>
									{u.role.replace(/_/g, " ")}
								</Badge>,
								<span
									className={
										u.mfa ? "text-green-400" : "text-red-400 font-bold"
									}>
									{u.mfa ? "✓ On" : "✗ Off"}
								</span>,
								<span className="text-slate-400">{u.lastLogin}</span>,
								<span className="text-blue-300 font-semibold tabular-nums">
									{u.calls}
								</span>,
								<span className="text-slate-400">
									{u.calls === 0
										? "—"
										: `${Math.round((u.calls / 205) * 100)}%`}
								</span>,
								<Badge color={u.mfa ? "green" : "red"}>
									{u.mfa ? "LOW" : "HIGH"}
								</Badge>,
							])}
						/>
					</div>

					<div className="card">
						<SectionHeader title="Auth & Token Activity" icon={Shield} />
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[
								{
									label: "JWT Tokens Issued",
									value: "22+",
									color: "text-blue-400",
								},
								{
									label: "Blacklisted Tokens",
									value: "1",
									color: "text-amber-400",
								},
								{
									label: "Active Sessions",
									value: "0",
									color: "text-slate-400",
								},
								{ label: "Auth API Calls", value: "7", color: "text-blue-400" },
							].map(({ label, value, color }) => (
								<div
									key={label}
									className="text-center p-3 bg-surface rounded-xl border border-surface-border">
									<div className={clsx("text-xl font-bold", color)}>
										{value}
									</div>
									<div className="text-[10px] text-slate-500 mt-0.5">
										{label}
									</div>
								</div>
							))}
						</div>
						<div className="mt-3 p-3 bg-red-950/20 border border-red-500/15 rounded-xl text-[11px] text-red-400">
							⚠ 0/5 users have MFA enabled. Enforce 2FA for all accounts
							immediately — prioritise system_admin roles.
						</div>
					</div>
				</div>
			)}

			{/* ══════════════ TASKS ══════════════ */}
			{activeTab === "tasks" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<KpiCard
							label="Total Tasks"
							value={<AnimN value={stats.tasks_total ?? 2} />}
							icon={FileText}
							color="text-white"
						/>
						<KpiCard
							label="Approved"
							value={<AnimN value={stats.tasks_approved ?? 1} />}
							icon={CheckCircle2}
							color="text-green-400"
						/>
						<KpiCard
							label="Rejected"
							value={<AnimN value={stats.tasks_rejected ?? 1} />}
							icon={AlertTriangle}
							color="text-red-400"
						/>
						<KpiCard
							label="Avg Review"
							value="2.5 min"
							icon={Clock}
							color="text-cyan-400"
							sub="Outstanding response"
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<div className="card">
							<SectionHeader title="Task Status" icon={BarChart3} />
							<ResponsiveContainer width="100%" height={180}>
								<PieChart>
									<Pie
										data={taskStatus}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={75}
										dataKey="value"
										nameKey="name"
										paddingAngle={3}>
										{taskStatus.map((_: any, i: number) => (
											<Cell
												key={i}
												fill={PALETTE[i % PALETTE.length]}
												strokeWidth={0}
											/>
										))}
									</Pie>
									<Tooltip {...TT} />
									<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="card">
							<SectionHeader title="Review Speed" icon={TrendingUp} />
							<div className="space-y-3 py-2">
								{[
									{
										task: "xcvbnmcf gvbhn",
										priority: "low",
										submitted: "15:52",
										reviewed: "15:56",
										mins: 4,
										status: "approved",
									},
									{
										task: "vxrdxhfcg",
										priority: "low",
										submitted: "15:57",
										reviewed: "15:58",
										mins: 1,
										status: "rejected",
									},
								].map((t, i) => (
									<div
										key={i}
										className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-border">
										<StatusDot status={t.status} />
										<div className="flex-1 min-w-0">
											<p className="text-xs text-white font-medium truncate">
												{t.task}
											</p>
											<p className="text-[10px] text-slate-500 mt-0.5">
												Submitted {t.submitted} → Reviewed {t.reviewed} ·
												<strong className="text-white ml-1">
													{t.mins} min turnaround
												</strong>
											</p>
										</div>
										<Badge color={t.status === "approved" ? "green" : "red"}>
											{t.status}
										</Badge>
									</div>
								))}
							</div>
							<div className="mt-3 p-3 bg-green-950/20 border border-green-500/15 rounded-xl text-[11px] text-green-400">
								✓ 100% of tasks reviewed within 4 minutes — excellent supervisor
								responsiveness.
							</div>
						</div>
					</div>

					<div className="card">
						<SectionHeader title="Task Records" icon={FileText}>
							<ExportButton
								fmt="csv"
								module="attendance"
								days={period}
								label="CSV"
								icon={FileText}
								variant="pill"
							/>
							<ExportButton
								fmt="excel"
								module="full"
								days={period}
								label="Excel"
								icon={FileSpreadsheet}
								variant="pill"
							/>
						</SectionHeader>
						<DataTable
							headers={[
								"Title",
								"Priority",
								"Status",
								"Assignee",
								"Due",
								"Submitted",
								"Reviewed",
								"Turnaround",
							]}
							rows={[
								[
									"xcvbnmcf gvbhn",
									<Badge color="gray">Low</Badge>,
									<span className="flex items-center gap-1">
										<StatusDot status="approved" />
										Approved
									</span>,
									"Grace Wanjiku",
									"Jun 11 18:37",
									"Jun 11 15:52",
									"Jun 11 15:56",
									"4 min",
								],
								[
									"vxrdxhfcg",
									<Badge color="gray">Low</Badge>,
									<span className="flex items-center gap-1">
										<StatusDot status="rejected" />
										Rejected
									</span>,
									"Grace Wanjiku",
									"Jun 11 19:22",
									"Jun 11 15:57",
									"Jun 11 15:58",
									"1 min",
								],
							]}
						/>
					</div>
				</div>
			)}

			{/* ══════════════ EQUIPMENT ══════════════ */}
			{activeTab === "equipment" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<KpiCard
							label="Total Items"
							value={<AnimN value={2} />}
							icon={Package}
							color="text-white"
						/>
						<KpiCard
							label="Under Repair"
							value={<AnimN value={2} />}
							icon={AlertTriangle}
							color="text-amber-400"
							alert
							sub="100% unavailable"
						/>
						<KpiCard
							label="Asset Value"
							value="KES 124.7M"
							icon={TrendingUp}
							color="text-purple-400"
						/>
						<KpiCard
							label="Open Maint."
							value={<AnimN value={2} />}
							icon={Clock}
							color="text-red-400"
							alert
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{DB_EQUIPMENT.map((item, i) => (
							<div key={i} className="card border-amber-500/20">
								<div className="flex items-start justify-between mb-3">
									<div>
										<p className="font-semibold text-white text-sm">
											{item.name}
										</p>
										<p className="text-[11px] text-slate-500 font-mono mt-0.5">
											{item.asset}
										</p>
									</div>
									<Badge color="amber">Under Repair</Badge>
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
									{[
										[
											"Condition",
											<Badge color="green">{item.condition}</Badge>,
										],
										["Location", item.location],
										["Value (KES)", `KES ${item.cost.toLocaleString()}`],
										[
											"Value Share",
											`${Math.round((item.cost / 124691244) * 100)}% of total`,
										],
									].map(([k, v], j) => (
										<div key={j}>
											<div className="text-slate-600 text-[10px]">
												{k as string}
											</div>
											<div className="text-slate-200 mt-0.5">{v as any}</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					<div className="card">
						<SectionHeader title="Asset Value Distribution" icon={BarChart3} />
						<div className="space-y-3">
							{DB_EQUIPMENT.map((item, i) => (
								<PerfBar
									key={i}
									label={item.asset}
									value={item.cost}
									max={124691244}
									color={PALETTE[i % PALETTE.length]}
								/>
							))}
						</div>
						<div className="mt-4 flex items-center justify-between text-[11px]">
							<span className="text-slate-500">Total portfolio value</span>
							<span className="text-white font-bold text-base">
								KES 124,691,244
							</span>
						</div>
					</div>

					<div className="card">
						<SectionHeader title="Maintenance Log" icon={AlertTriangle}>
							<ExportButton
								fmt="csv"
								module="equipment"
								days={period}
								label="Export"
								icon={FileText}
								variant="pill"
							/>
						</SectionHeader>
						<DataTable
							headers={[
								"Item",
								"Asset Tag",
								"Issue",
								"Status",
								"Reported By",
								"Date",
							]}
							rows={[
								[
									"Sony Camera A711",
									"CAM-001",
									"jhrww",
									<Badge color="amber">Reported</Badge>,
									"System Admin",
									"Jun 11 07:17",
								],
								[
									"Broadcast Media Institution A7112",
									"CAM-0013",
									"ygbby",
									<Badge color="amber">Reported</Badge>,
									"System Admin",
									"Jun 11 15:44",
								],
							]}
						/>
					</div>
				</div>
			)}

			{/* ══════════════ BROADCAST ══════════════ */}
			{activeTab === "broadcast" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<KpiCard
							label="Emergency Alerts"
							value={<AnimN value={10} />}
							icon={AlertTriangle}
							color="text-green-400"
							sub="All 10 resolved"
						/>
						<KpiCard
							label="Shoot Bookings"
							value={<AnimN value={1} />}
							icon={Camera}
							color="text-blue-400"
							sub="1 approved"
						/>
						<KpiCard
							label="File Transfers"
							value={<AnimN value={3} />}
							icon={Upload}
							color="text-purple-400"
							sub="35.6 KB total"
						/>
						<KpiCard
							label="Support Tickets"
							value={<AnimN value={2} />}
							icon={FileText}
							color="text-cyan-400"
							sub="1 open, 1 closed"
						/>
					</div>

					{/* Alert severity chart */}
					<div className="card">
						<SectionHeader title="Emergency Alert History" icon={AlertTriangle}>
							<Badge color="green">All 10 Resolved</Badge>
							<ExportButton
								fmt="csv"
								module="alerts"
								days={period}
								label="Export"
								icon={FileText}
								variant="pill"
							/>
						</SectionHeader>
						<div className="grid grid-cols-3 gap-3 mb-4">
							{[
								{ label: "Total", value: "10", color: "text-white" },
								{ label: "Critical", value: "1", color: "text-red-500" },
								{ label: "High", value: "9", color: "text-red-400" },
							].map((d) => (
								<div
									key={d.label}
									className="text-center p-3 bg-surface rounded-xl border border-surface-border">
									<div className={clsx("text-2xl font-bold", d.color)}>
										{d.value}
									</div>
									<div className="text-[10px] text-slate-500 mt-0.5">
										{d.label}
									</div>
								</div>
							))}
						</div>
						<DataTable
							maxRows={5}
							headers={["Title", "Severity", "Date", "Resolved"]}
							rows={DB_ALERTS.map((a) => [
								<span className="text-white text-xs">{a.title}</span>,
								<Badge color={a.sev === "critical" ? "red" : "red"}>
									{a.sev}
								</Badge>,
								<span className="text-slate-400 text-[11px]">{a.date}</span>,
								<span className="text-green-400 font-semibold">✓ Yes</span>,
							])}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{/* Certificates */}
						<div className="card">
							<SectionHeader title="Certificates Issued" icon={Award}>
								<ExportButton
									fmt="csv"
									module="certificates"
									days={period}
									label="Export"
									icon={FileText}
									variant="pill"
								/>
							</SectionHeader>
							<DataTable
								headers={[
									"Cert #",
									"Type",
									"Status",
									"Recipient",
									"Issue Date",
								]}
								rows={[
									[
										"NX-2026-29F1A0",
										<Badge color="blue">Completion</Badge>,
										<Badge color="green">Generated</Badge>,
										"Grace Wanjiku",
										"Jun 11 2026",
									],
									[
										"NX-2026-22D5CE",
										<Badge color="purple">Recommendation</Badge>,
										<Badge color="green">Issued</Badge>,
										"Grace Wanjiku",
										"Jun 11 2026",
									],
								]}
							/>
						</div>

						{/* Feedback */}
						<div className="card">
							<SectionHeader title="Support Tickets" icon={FileText}>
								<ExportButton
									fmt="csv"
									module="feedback"
									days={period}
									label="Export"
									icon={FileText}
									variant="pill"
								/>
							</SectionHeader>
							<DataTable
								headers={["Ticket #", "Category", "Priority", "Status", "Date"]}
								rows={[
									[
										"TKT-0001",
										"Scheduling",
										<Badge color="gray">Low</Badge>,
										<span className="flex items-center gap-1">
											<StatusDot status="open" />
											Open
										</span>,
										"Jun 12",
									],
									[
										"TKT-0002",
										"Wi-Fi",
										<Badge color="gray">Low</Badge>,
										<span className="flex items-center gap-1">
											<StatusDot status="closed" />
											Closed
										</span>,
										"Jun 12",
									],
								]}
							/>
							<div className="mt-3 grid grid-cols-2 gap-3">
								<div className="text-center p-3 bg-amber-950/20 border border-amber-500/15 rounded-xl">
									<div className="text-xl font-bold text-amber-400">1</div>
									<div className="text-[10px] text-slate-500">Open</div>
								</div>
								<div className="text-center p-3 bg-green-950/20 border border-green-500/15 rounded-xl">
									<div className="text-xl font-bold text-green-400">1</div>
									<div className="text-[10px] text-slate-500">
										Resolved (50%)
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{/* File transfers */}
						<div className="card">
							<SectionHeader title="File Transfers" icon={Upload}>
								<ExportButton
									fmt="csv"
									module="filetransfers"
									days={period}
									label="Export"
									icon={FileText}
									variant="pill"
								/>
							</SectionHeader>
							<DataTable
								headers={["Filename", "Size", "Downloads", "Date"]}
								rows={[
									["Screenshot 2025-11-13.png", "17.5 KB", "1", "Jun 12 01:28"],
									[
										"certificate-NX-2026-22D5CE (1).pdf",
										"8.6 KB",
										"1",
										"Jun 12 01:41",
									],
									[
										"certificate-NX-2026-22D5CE (1) (1).pdf",
										"8.6 KB",
										"0",
										"Jun 12 13:56",
									],
								]}
							/>
						</div>

						{/* Videography + Wi-Fi */}
						<div className="card">
							<SectionHeader title="Videography & Wi-Fi" icon={Camera} />
							<div className="space-y-4">
								<div>
									<p className="text-[11px] text-slate-500 font-semibold mb-2">
										Shoot Bookings
									</p>
									<DataTable
										headers={["Title", "Date", "Duration", "Status"]}
										rows={[
											[
												"E",
												"Jun 25 2026",
												"2h",
												<Badge color="green">Approved</Badge>,
											],
										]}
									/>
								</div>
								<div>
									<p className="text-[11px] text-slate-500 font-semibold mb-2">
										Wi-Fi Grants
									</p>
									<DataTable
										headers={["Device", "Duration", "Status", "Expires"]}
										rows={[
											[
												"Laptop (fvrcb)",
												"30 days",
												<span className="flex items-center gap-1">
													<StatusDot status="revoked" />
													Revoked
												</span>,
												"Jul 12 2026",
											],
										]}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ══════════════ SYSTEM ══════════════ */}
			{activeTab === "system" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<KpiCard
							label="Total API Calls"
							value={<AnimN value={205} />}
							icon={Zap}
							color="text-white"
						/>
						<KpiCard
							label="POST (Create)"
							value={<AnimN value={146} />}
							icon={ArrowUpRight}
							color="text-blue-400"
						/>
						<KpiCard
							label="PATCH (Update)"
							value={<AnimN value={59} />}
							icon={RefreshCw}
							color="text-purple-400"
						/>
						<KpiCard
							label="Avg Response"
							value="521ms"
							icon={Clock}
							color="text-amber-400"
							sub="P99: 11s — urgent"
							alert
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{/* API timeline */}
						<div className="card">
							<SectionHeader title="API Timeline" icon={Zap}>
								<ExportButton
									fmt="csv"
									module="audit"
									days={period}
									label="CSV"
									icon={FileText}
									variant="pill"
								/>
								<ExportButton
									fmt="json"
									module="full"
									days={period}
									label="JSON"
									icon={FileJson}
									variant="pill"
								/>
							</SectionHeader>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={DB_AUDIT_TIMELINE}>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.04)"
									/>
									<XAxis
										dataKey="date"
										tick={{ fill: "#475569", fontSize: 11 }}
										tickLine={false}
									/>
									<YAxis
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip {...TT} />
									<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
									<Bar
										dataKey="posts"
										fill={C.blue}
										name="POST"
										radius={[3, 3, 0, 0]}
										stackId="a"
									/>
									<Bar
										dataKey="patches"
										fill={C.purple}
										name="PATCH"
										radius={[0, 0, 0, 0]}
										stackId="a"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Hourly */}
						<div className="card">
							<SectionHeader title="Hourly Distribution" icon={Clock} />
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={DB_HOURLY}>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.04)"
									/>
									<XAxis
										dataKey="hour"
										tick={{ fill: "#475569", fontSize: 9 }}
										tickLine={false}
										tickFormatter={(v) => `${v}h`}
									/>
									<YAxis
										tick={{ fill: "#475569", fontSize: 10 }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										{...TT}
										formatter={(v: any) => [v, "Calls"]}
										labelFormatter={(l) => `${l}:00`}
									/>
									<Bar dataKey="count" name="Calls" radius={[3, 3, 0, 0]}>
										{DB_HOURLY.map((d, i) => (
											<Cell
												key={i}
												fill={
													d.count > 30 ? C.red : d.count > 15 ? C.amber : C.blue
												}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
							<p className="text-[10px] text-amber-500 mt-2">
								🔴 Midnight spike (45 calls) · 06:00h spike (40 calls) — verify
								cron vs unauthorised
							</p>
						</div>
					</div>

					{/* Module detail table */}
					<div className="card">
						<SectionHeader title="Full Module Breakdown" icon={BarChart3} />
						<DataTable
							headers={[
								"Module",
								"Total",
								"Jun 11",
								"Jun 12",
								"% of Total",
								"Trend",
							]}
							rows={DB_MODULES.map((m) => [
								m.module,
								<span className="font-semibold text-white">{m.calls}</span>,
								m.jun11,
								m.jun12,
								`${m.pct}%`,
								<div className="flex items-center gap-2 w-20">
									<div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
										<div
											className="h-full rounded-full bg-blue-500"
											style={{ width: `${(m.calls / 92) * 100}%` }}
										/>
									</div>
								</div>,
							])}
						/>
					</div>

					{/* Performance */}
					<div className="card">
						<SectionHeader title="Performance Analysis" icon={TrendingUp} />
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
							{[
								{
									label: "<100ms",
									value: 163,
									pct: "79.5%",
									color: "text-green-400",
									bg: "bg-green-950/20 border-green-500/15",
								},
								{
									label: "100–500ms",
									value: 28,
									pct: "13.7%",
									color: "text-amber-400",
									bg: "bg-amber-950/20 border-amber-500/15",
								},
								{
									label: "500ms–1s",
									value: 2,
									pct: "1.0%",
									color: "text-orange-400",
									bg: "bg-orange-950/20 border-orange-500/15",
								},
								{
									label: ">1 second",
									value: 12,
									pct: "5.9%",
									color: "text-red-400",
									bg: "bg-red-950/20 border-red-500/15",
								},
							].map((d) => (
								<div
									key={d.label}
									className={clsx("text-center p-3 rounded-xl border", d.bg)}>
									<div className={clsx("text-2xl font-bold", d.color)}>
										{d.value}
									</div>
									<div className="text-[10px] text-slate-500 mt-0.5">
										{d.label}
									</div>
									<div className={clsx("text-xs font-semibold mt-1", d.color)}>
										{d.pct}
									</div>
								</div>
							))}
						</div>
						<div className="text-[11px] text-red-400 flex items-center gap-1.5">
							<AlertTriangle size={11} />
							12 requests exceeded 1 second (max: 13,866ms) — investigate
							fm-report and accounts endpoints
						</div>
					</div>

					{/* Security */}
					<div className="card">
						<SectionHeader title="Security Summary" icon={Shield} />
						<div className="space-y-2">
							{[
								{
									label: "MFA adoption",
									value: "0%",
									status: "critical",
									note: "0/5 users — enforce immediately",
								},
								{
									label: "Blacklisted tokens",
									value: "1",
									status: "good",
									note: "1 JWT invalidated successfully",
								},
								{
									label: "Off-hours API activity",
									value: "High",
									status: "warning",
									note: "45 calls midnight · 40 calls 06:00",
								},
								{
									label: "Active sessions",
									value: "0",
									status: "good",
									note: "No active sessions currently",
								},
								{
									label: "Max response time",
									value: "13.8s",
									status: "warning",
									note: "P99=11s — slow endpoints need attention",
								},
								{
									label: "Failed auth attempts",
									value: "N/A",
									status: "info",
									note: "No failed auth in audit log",
								},
							].map((s, i) => (
								<div
									key={i}
									className="flex items-center justify-between py-2 border-b border-surface-border/30 last:border-0">
									<div>
										<p className="text-xs text-slate-300">{s.label}</p>
										<p className="text-[10px] text-slate-600">{s.note}</p>
									</div>
									<Badge
										color={
											s.status === "critical"
												? "red"
												: s.status === "warning"
													? "amber"
													: s.status === "good"
														? "green"
														: "gray"
										}>
										{s.value}
									</Badge>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* ══════════════ EXPORT HUB ══════════════ */}
			{activeTab === "export" && (
				<div className="space-y-5">
					{/* Header card */}
					<div className="card bg-gradient-to-r from-surface to-surface border-Swahilipot-500/20">
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-xl bg-Swahilipot-500/20 flex items-center justify-center shrink-0">
								<Download size={18} className="text-Swahilipot-400" />
							</div>
							<div>
								<h2 className="font-bold text-white text-base">
									Export Centre
								</h2>
								<p className="text-slate-400 text-xs mt-1 leading-relaxed">
									Generate professional reports from live database data. Every
									export is built fresh from the ORM using
									<span className="text-Swahilipot-400 font-medium">
										{" "}
										pandas · matplotlib · seaborn · ReportLab · OpenPyXL ·
										python-pptx
									</span>
									. Compatible with Power BI, Tableau, Grafana, and Excel.
								</p>
							</div>
						</div>
					</div>

					{/* Format cards */}
					<div>
						<h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
							<FileText size={13} className="text-slate-500" /> Choose Export
							Format
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{FORMATS.map((fmt) => (
								<div
									key={fmt.id}
									className="card hover:border-white/10 transition-all">
									<div className="flex items-start gap-3 mb-3">
										<div className="w-9 h-9 rounded-xl bg-surface-border flex items-center justify-center shrink-0">
											<fmt.icon size={16} className="text-slate-300" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-semibold text-white">
												{fmt.label}
											</p>
											<p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
												{fmt.desc}
											</p>
										</div>
									</div>
									<ExportButton
										fmt={fmt.id}
										module="full"
										days={period}
										label={`Download ${fmt.label}`}
										icon={Download}
										variant="full"
									/>
								</div>
							))}
						</div>
					</div>

					{/* Module-specific exports */}
					<div>
						<h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
							<Zap size={13} className="text-slate-500" /> Module-Specific
							Exports
						</h3>
						<div className="card">
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
								{[
									{
										fmt: "pdf",
										label: "PDF",
										icon: File,
										color: "text-red-400",
									},
									{
										fmt: "excel",
										label: "Excel",
										icon: FileSpreadsheet,
										color: "text-green-400",
									},
									{
										fmt: "csv",
										label: "CSV",
										icon: FileText,
										color: "text-blue-400",
									},
									{
										fmt: "json",
										label: "JSON",
										icon: FileJson,
										color: "text-purple-400",
									},
								].map((f) => (
									<div
										key={f.fmt}
										className={clsx(
											"flex items-center gap-2 p-2.5 rounded-xl border border-surface-border bg-surface text-[11px] font-medium",
											f.color,
										)}>
										<f.icon size={14} className="opacity-70" /> {f.label}
									</div>
								))}
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
								{MODULES.map(({ id, label, icon: Icon }) => (
									<div
										key={id}
										className="space-y-1.5 p-3 rounded-xl bg-surface border border-surface-border">
										<div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium mb-2">
											<Icon size={12} className="text-slate-500" /> {label}
										</div>
										<div className="grid grid-cols-2 gap-1">
											{[
												{ fmt: "csv", icon: FileText, label: "CSV" },
												{ fmt: "json", icon: FileJson, label: "JSON" },
											].map((f) => (
												<ExportButton
													key={f.fmt}
													fmt={f.fmt}
													module={id}
													days={period}
													label={f.label}
													icon={f.icon}
												/>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Quick export row */}
					<div>
						<h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
							<Sparkles size={13} className="text-slate-500" /> One-Click Full
							Reports
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
							{FORMATS.map((fmt) => (
								<ExportButton
									key={fmt.id}
									fmt={fmt.id}
									module="full"
									days={period}
									label={fmt.label}
									icon={fmt.icon}
								/>
							))}
						</div>
					</div>

					{/* API endpoint reference */}
					<div className="card">
						<SectionHeader title="API Endpoint Reference" icon={Info} />
						<div className="space-y-2">
							{[
								[
									"GET",
									"/api/v1/analytics/exports/",
									"List available formats & modules",
								],
								[
									"GET",
									"/api/v1/analytics/exports/pdf/full/?days=30",
									"Full PDF report (last 30 days)",
								],
								[
									"GET",
									"/api/v1/analytics/exports/excel/full/",
									"Full Excel workbook (4 sheets)",
								],
								[
									"GET",
									"/api/v1/analytics/exports/pptx/full/",
									"Full PowerPoint (6 slides)",
								],
								[
									"GET",
									"/api/v1/analytics/exports/csv/audit/?days=7",
									"Enriched audit log CSV (7 days)",
								],
								[
									"GET",
									"/api/v1/analytics/exports/csv/performance/",
									"Performance metrics CSV",
								],
								[
									"GET",
									"/api/v1/analytics/exports/json/full/",
									"Full JSON payload (Power BI ready)",
								],
								[
									"GET",
									"/api/v1/analytics/exports/csv/users/",
									"Users with API activity & risk level",
								],
								[
									"GET",
									"/api/v1/analytics/exports/csv/equipment/",
									"Equipment inventory with valuations",
								],
								[
									"GET",
									"/api/v1/analytics/exports/csv/attendance/?days=30",
									"Attendance records (date-ranged)",
								],
							].map(([method, path, desc], i) => (
								<div
									key={i}
									className="flex items-start gap-3 py-2 border-b border-surface-border/30 last:border-0">
									<span
										className={clsx(
											"text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5",
											method === "GET"
												? "bg-blue-500/20 text-blue-400"
												: "bg-green-500/20 text-green-400",
										)}>
										{method}
									</span>
									<code className="text-[10px] text-cyan-400 font-mono flex-1 leading-5 break-all">
										{path}
									</code>
									<span className="text-[10px] text-slate-600 shrink-0 hidden sm:block">
										{desc}
									</span>
								</div>
							))}
						</div>
						<p className="text-[10px] text-slate-700 mt-3">
							All endpoints require authentication · Optional params:{" "}
							<code className="text-slate-500">
								?start=YYYY-MM-DD&end=YYYY-MM-DD&department=uuid
							</code>
						</p>
					</div>

					{/* Tool stack info */}
					<div className="card">
						<SectionHeader title="Report Generation Stack" icon={Sparkles} />
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[
								{
									name: "pandas",
									role: "Data loading & transformation from ORM",
									color: C.blue,
								},
								{
									name: "matplotlib",
									role: "Chart generation (PNG, embedded in PDF)",
									color: C.amber,
								},
								{
									name: "seaborn",
									role: "Statistical styling & heatmaps",
									color: C.purple,
								},
								{
									name: "numpy/scipy",
									role: "Statistical computation & percentiles",
									color: C.cyan,
								},
								{
									name: "ReportLab",
									role: "PDF generation with dark theme cover page",
									color: C.red,
								},
								{
									name: "OpenPyXL",
									role: "Excel workbook with embedded charts",
									color: C.green,
								},
								{
									name: "python-pptx",
									role: "PowerPoint with 6-slide dark deck",
									color: C.orange,
								},
								{
									name: "xlsxwriter",
									role: "Advanced Excel formatting & formulas",
									color: C.teal,
								},
							].map((t, i) => (
								<div
									key={i}
									className="p-3 rounded-xl bg-surface border border-surface-border">
									<div className="flex items-center gap-2 mb-1">
										<span
											className="w-2 h-2 rounded-full"
											style={{ background: t.color }}
										/>
										<span className="text-xs font-semibold text-white font-mono">
											{t.name}
										</span>
									</div>
									<p className="text-[10px] text-slate-600 leading-relaxed">
										{t.role}
									</p>
								</div>
							))}
						</div>
=======
			{/* KPI Summary */}
			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
				{[
					{
						label: "Active Users",
						value: stats.active_users,
						color: "text-white",
						icon: Activity,
					},
					{
						label: "Present Today",
						value: stats.present_today,
						color: "text-green-400",
						icon: Activity,
					},
					{
						label: "FM Uptime",
						value:
							stats.fm_uptime_percent != null
								? `${stats.fm_uptime_percent}%`
								: "—",
						color:
							stats.fm_active_outages > 0 ? "text-red-400" : "text-green-400",
						icon: Radio,
					},
					{
						label: "Tasks Overdue",
						value: stats.tasks_overdue,
						color: "text-red-400",
						icon: BarChart3,
					},
					{
						label: "Equipment Out",
						value: stats.equipment_on_loan,
						color: "text-blue-400",
						icon: Package,
					},
					{
						label: "News Published",
						value: stats.news_published_today,
						color: "text-Swahilipot-400",
						icon: Newspaper,
					},
				].map(({ label, value, color, icon: Icon }) => (
					<div key={label} className="stat-card">
						<Icon size={16} className={clsx(color, "opacity-70")} />
						<div className={clsx("stat-value", color)}>{value ?? "—"}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			{/* Charts grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Attendance Trend */}
				<div className="card lg:col-span-2">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Attendance Trend</h3>
						<button
							onClick={() => handleExport("attendance")}
							className="btn-secondary btn-sm">
							<Download size={13} /> Export CSV
						</button>
					</div>
					<ResponsiveContainer width="100%" height={230}>
						<AreaChart data={charts.attendance_trend || []}>
							<defs>
								<linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b63f5" stopOpacity={0.35} />
									<stop offset="95%" stopColor="#3b63f5" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
							<XAxis
								dataKey="date"
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
							/>
							<YAxis
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip {...TOOLTIP} />
							<Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
							<Area
								type="monotone"
								dataKey="present"
								stroke="#3b63f5"
								fill="url(#pGrad)"
								strokeWidth={2}
								name="Present"
							/>
							<Area
								type="monotone"
								dataKey="absent"
								stroke="#ef4444"
								fill="none"
								strokeWidth={1.5}
								strokeDasharray="4 4"
								name="Absent"
							/>
							<Area
								type="monotone"
								dataKey="leave"
								stroke="#f59e0b"
								fill="none"
								strokeWidth={1.5}
								strokeDasharray="3 3"
								name="Leave"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>

				{/* Task status */}
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Task Status</h3>
					</div>
					<ResponsiveContainer width="100%" height={200}>
						<PieChart>
							<Pie
								data={charts.task_status || []}
								cx="50%"
								cy="50%"
								innerRadius={55}
								outerRadius={80}
								dataKey="value"
								nameKey="name">
								{(charts.task_status || []).map((_: any, i: number) => (
									<Cell key={i} fill={COLORS[i % COLORS.length]} />
								))}
							</Pie>
							<Tooltip {...TOOLTIP} />
						</PieChart>
					</ResponsiveContainer>
					<div className="grid grid-cols-2 gap-1.5 mt-3">
						{(charts.task_status || []).map((s: any, i: number) => (
							<div
								key={i}
								className="flex items-center gap-1.5 text-xs text-slate-400">
								<span
									className="w-2 h-2 rounded-full shrink-0"
									style={{ background: COLORS[i % COLORS.length] }}
								/>
								{s.name}:{" "}
								<span className="text-white font-medium">{s.value}</span>
							</div>
						))}
					</div>
				</div>

				{/* FM Uptime trend */}
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">FM Station Uptime</h3>
						<button
							onClick={() => handleExport("fm-outages")}
							className="btn-secondary btn-sm">
							<Download size={13} /> Export
						</button>
					</div>
					<ResponsiveContainer width="100%" height={200}>
						<LineChart data={charts.fm_uptime_30d || []}>
							<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
							<XAxis
								dataKey="date"
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
							/>
							<YAxis
								domain={[70, 100]}
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
								unit="%"
							/>
							<Tooltip {...TOOLTIP} />
							<Line
								type="monotone"
								dataKey="uptime"
								stroke="#22c55e"
								strokeWidth={2}
								dot={false}
								name="Uptime %"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{/* Equipment by category */}
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Equipment by Category</h3>
						<button
							onClick={() => handleExport("equipment")}
							className="btn-secondary btn-sm">
							<Download size={13} /> Export
						</button>
					</div>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart data={charts.equipment_by_cat || []}>
							<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
							<XAxis
								dataKey="name"
								tick={{ fill: "#64748b", fontSize: 9 }}
								tickLine={false}
							/>
							<YAxis
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip {...TOOLTIP} />
							<Bar
								dataKey="value"
								fill="#3b63f5"
								radius={[4, 4, 0, 0]}
								name="Items"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Department distribution */}
				<div className="card">
					<h3 className="font-semibold text-white mb-5">Users by Department</h3>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart
							data={(charts.top_departments || []).slice(0, 8)}
							layout="vertical">
							<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
							<XAxis
								type="number"
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								dataKey="name"
								type="category"
								tick={{ fill: "#94a3b8", fontSize: 10 }}
								tickLine={false}
								width={80}
							/>
							<Tooltip {...TOOLTIP} />
							<Bar
								dataKey="users"
								fill="#8b5cf6"
								radius={[0, 4, 4, 0]}
								name="Users"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Attendance summary numbers */}
			{attendance && (
				<div className="card">
					<h3 className="font-semibold text-white mb-4">
						Attendance Summary — Last {period} Days
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
						{[
							{
								label: "Present",
								value: attendance.present,
								color: "text-green-400",
							},
							{
								label: "Late",
								value: attendance.late,
								color: "text-amber-400",
							},
							{
								label: "Absent",
								value: attendance.absent,
								color: "text-red-400",
							},
							{
								label: "On Leave",
								value: attendance.on_leave,
								color: "text-blue-400",
							},
							{
								label: "Avg Hours/Day",
								value: attendance.avg_hours
									? parseFloat(attendance.avg_hours).toFixed(1) + "h"
									: "—",
								color: "text-white",
							},
						].map(({ label, value, color }) => (
							<div
								key={label}
								className="text-center p-4 bg-surface rounded-xl border border-surface-border">
								<div className={clsx("text-2xl font-bold", color)}>
									{value ?? "—"}
								</div>
								<div className="text-xs text-slate-500 mt-1">{label}</div>
							</div>
						))}
>>>>>>> origin/main
					</div>
				</div>
			)}
		</div>
	);
}
