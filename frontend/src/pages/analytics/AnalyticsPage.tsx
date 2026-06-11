// Swahilipot — Analytics Page
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
	BarChart3,
	Download,
	RefreshCw,
	TrendingUp,
	Activity,
	Radio,
	Package,
	Newspaper,
} from "lucide-react";
import { analyticsApi } from "../../services/api";
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

	const {
		data: analytics,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["analytics-dashboard", period],
		queryFn: () => analyticsApi.dashboard().then((r) => r.data),
		refetchInterval: 300000,
	});

	const { data: attendance } = useQuery({
		queryKey: ["analytics-attendance", period],
		queryFn: () =>
			analyticsApi.attendance({ days: period }).then((r) => r.data),
	});

	const stats = analytics?.stats || {};
	const charts = analytics?.charts || {};

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
					</p>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={period}
						onChange={(e) => setPeriod(Number(e.target.value))}
						className="select-input w-32 text-sm">
						<option value={7}>Last 7 days</option>
						<option value={30}>Last 30 days</option>
						<option value={90}>Last 90 days</option>
					</select>
					<button onClick={() => refetch()} className="btn-secondary btn-sm">
						<RefreshCw size={13} /> Refresh
					</button>
				</div>
			</div>

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
					</div>
				</div>
			)}
		</div>
	);
}
