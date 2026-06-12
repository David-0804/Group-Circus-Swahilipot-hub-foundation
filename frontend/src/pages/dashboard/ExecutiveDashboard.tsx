// Swahilipot — Executive Dashboard
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
	BarChart3,
	TrendingUp,
	TrendingDown,
	Users,
	DollarSign,
	Activity,
	Radio,
	Award,
	Target,
	Globe,
} from "lucide-react";
import { analyticsApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { format } from "date-fns";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
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

export default function ExecutiveDashboard() {
	const { user } = useAuthStore();
	const navigate = useNavigate();

	const { data: analytics, isLoading } = useQuery({
		queryKey: ["analytics-dashboard"],
		queryFn: () => analyticsApi.dashboard().then((r) => r.data),
		refetchInterval: 120000,
	});

	const stats = analytics?.stats || {};
	const charts = analytics?.charts || {};

	const kpis = [
		{
			label: "Total Active Users",
			value: stats.active_users ?? "—",
			trend: "+12%",
			up: true,
			icon: Users,
			color: "blue",
		},
		{
			label: "Active Attachees",
			value: stats.active_attachees ?? "—",
			trend: "+5%",
			up: true,
			icon: Award,
			color: "purple",
		},
		{
			label: "FM Uptime (Today)",
			value:
				stats.fm_uptime_percent != null ? `${stats.fm_uptime_percent}%` : "—",
			trend: "99.2% avg",
			up: true,
			icon: Radio,
			color: stats.fm_active_outages > 0 ? "red" : "green",
		},
		{
			label: "Task Completion Rate",
			value: "87%",
			trend: "+3%",
			up: true,
			icon: Target,
			color: "green",
		},
		{
			label: "Equipment Utilisation",
			value: "74%",
			trend: "-2%",
			up: false,
			icon: Activity,
			color: "amber",
		},
		{
			label: "Org Departments",
			value: "12",
			trend: "Stable",
			up: true,
			icon: Globe,
			color: "cyan",
		},
	];

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="page-title">Executive Overview</h1>
					<p className="page-subtitle">
						{format(new Date(), "EEEE, MMMM d yyyy")} ·{" "}
						{user?.organisation_name}
					</p>
				</div>
				<button
					onClick={() => navigate("/analytics")}
					className="btn-primary btn-sm">
					<BarChart3 size={14} /> Full Analytics
				</button>
			</div>

			{/* KPI cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
				{kpis.map(({ label, value, trend, up, icon: Icon, color }) => {
					const colorMap: Record<string, string> = {
						blue: "text-blue-400 bg-blue-500/10",
						green: "text-green-400 bg-green-500/10",
						amber: "text-amber-400 bg-amber-500/10",
						red: "text-red-400 bg-red-500/10",
						purple: "text-purple-400 bg-purple-500/10",
						cyan: "text-cyan-400 bg-cyan-500/10",
					};
					return (
						<div key={label} className="stat-card">
							<div
								className={clsx(
									"w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
									colorMap[color] || colorMap.blue,
								)}>
								<Icon size={17} />
							</div>
							<div className="stat-value">{value}</div>
							<div className="stat-label">{label}</div>
							<div
								className={clsx(
									"flex items-center gap-1 text-[10px] font-medium mt-0.5",
									up ? "text-green-400" : "text-red-400",
								)}>
								{up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
								{trend}
							</div>
						</div>
					);
				})}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Attendance Trend — Last 14 Days
					</h3>
					<ResponsiveContainer width="100%" height={220}>
						<AreaChart data={charts.attendance_trend || mockTrend}>
							<defs>
								<linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b63f5" stopOpacity={0.3} />
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
							<Area
								type="monotone"
								dataKey="present"
								stroke="#3b63f5"
								fill="url(#aGrad)"
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
						</AreaChart>
					</ResponsiveContainer>
				</div>

				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Task Status Distribution
					</h3>
					<ResponsiveContainer width="100%" height={160}>
						<PieChart>
							<Pie
								data={charts.task_status || mockTaskStatus}
								cx="50%"
								cy="50%"
								innerRadius={50}
								outerRadius={70}
								dataKey="value"
								nameKey="name">
								{(charts.task_status || mockTaskStatus).map(
									(_: any, i: number) => (
										<Cell key={i} fill={COLORS[i % COLORS.length]} />
									),
								)}
							</Pie>
							<Tooltip {...TOOLTIP} />
						</PieChart>
					</ResponsiveContainer>
					<div className="flex flex-wrap gap-2 justify-center mt-2">
						{(charts.task_status || mockTaskStatus).map((s: any, i: number) => (
							<div
								key={i}
								className="flex items-center gap-1.5 text-xs text-slate-400">
								<span
									className="w-2 h-2 rounded-full"
									style={{ background: COLORS[i % COLORS.length] }}
								/>
								{s.name}:{" "}
								<span className="text-white font-medium">{s.value}</span>
							</div>
						))}
					</div>
				</div>

				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Department User Distribution
					</h3>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart data={(charts.top_departments || mockDepts).slice(0, 8)}>
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
								dataKey="users"
								fill="#3b63f5"
								radius={[4, 4, 0, 0]}
								name="Users"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						FM Station Uptime — 30 Days
					</h3>
					<ResponsiveContainer width="100%" height={200}>
						<LineChart data={charts.fm_uptime_30d || mockFmUptime}>
							<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
							<XAxis
								dataKey="date"
								tick={{ fill: "#64748b", fontSize: 10 }}
								tickLine={false}
							/>
							<YAxis
								domain={[80, 100]}
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
			</div>

			{/* Strategic quick actions */}
			<div className="card">
				<h3 className="font-semibold text-white mb-4">
					Board Reporting & Exports
				</h3>
				<div className="flex flex-wrap gap-3">
					{[
						{ label: "Attendance Report", path: "/analytics" },
						{ label: "FM Uptime Report", path: "/fm-report" },
						{ label: "Equipment Utilisation", path: "/equipment" },
						{ label: "Internship KPIs", path: "/attachees" },
						{ label: "Finance Overview", path: "/finance" },
						{ label: "Full Analytics", path: "/analytics" },
					].map(({ label, path }) => (
						<button
							key={label}
							onClick={() => navigate(path)}
							className="btn-secondary btn-sm">
							<BarChart3 size={12} /> {label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

// Mock data for charts when API isn't connected
const mockTrend = Array.from({ length: 14 }, (_, i) => ({
	date: format(new Date(Date.now() - (13 - i) * 86400000), "MM/dd"),
	present: Math.floor(Math.random() * 30) + 60,
	absent: Math.floor(Math.random() * 10) + 2,
}));
const mockTaskStatus = [
	{ name: "Approved", value: 45 },
	{ name: "In Progress", value: 28 },
	{ name: "Pending", value: 17 },
	{ name: "Overdue", value: 8 },
	{ name: "Rejected", value: 4 },
];
const mockDepts = [
	{ name: "HR", users: 12 },
	{ name: "Finance", users: 8 },
	{ name: "ICT", users: 15 },
	{ name: "Broadcast", users: 22 },
	{ name: "News", users: 9 },
	{ name: "Radio", users: 11 },
];
const mockFmUptime = Array.from({ length: 30 }, (_, i) => ({
	date: format(new Date(Date.now() - (29 - i) * 86400000), "MM/dd"),
	uptime: 95 + Math.random() * 5,
}));
