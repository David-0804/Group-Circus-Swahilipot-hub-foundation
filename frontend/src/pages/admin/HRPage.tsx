// NEXUS — HR Management Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	Users,
	Plus,
	Search,
	Eye,
	Download,
	UserPlus,
	GraduationCap,
	Building2,
	BarChart3,
	CheckCircle,
	Clock,
	XCircle,
	Calendar,
	Award,
} from "lucide-react";
import {
	hrApi,
	usersApi,
	attendanceApi,
	evaluationsApi,
	certificatesApi,
} from "../../services/api";
import { useAuthStore } from "../../services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import clsx from "clsx";

const TABS = [
	"overview",
	"attachees",
	"leave",
	"evaluations",
	"departments",
] as const;
type Tab = (typeof TABS)[number];

export default function HRPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const [search, setSearch] = useState("");

	const { data: attacheesRaw } = useQuery({
		queryKey: ["attachees"],
		queryFn: () => usersApi.list({ role: "attachee" }).then((r) => r.data),
		refetchInterval: 120000,
	});

	const { data: leaveRaw } = useQuery({
		queryKey: ["leave-requests"],
		queryFn: () => attendanceApi.leaveRequests().then((r) => r.data),
		refetchInterval: 60000,
		enabled: activeTab === "leave",
	});

	const { data: evalsRaw } = useQuery({
		queryKey: ["evaluations"],
		queryFn: () => evaluationsApi.list().then((r) => r.data),
		enabled: activeTab === "evaluations",
	});

	const { data: deptsRaw } = useQuery({
		queryKey: ["departments"],
		queryFn: () => hrApi.departments().then((r) => r.data),
		enabled: activeTab === "departments",
	});

	const { data: userStats } = useQuery({
		queryKey: ["user-stats"],
		queryFn: () => usersApi.stats().then((r) => r.data),
	});

	const attachees = Array.isArray(attacheesRaw)
		? attacheesRaw
		: (attacheesRaw?.results ?? []);
	const leave = Array.isArray(leaveRaw) ? leaveRaw : (leaveRaw?.results ?? []);
	const evals = Array.isArray(evalsRaw) ? evalsRaw : (evalsRaw?.results ?? []);
	const depts = Array.isArray(deptsRaw) ? deptsRaw : (deptsRaw?.results ?? []);

	const reviewLeaveMutation = useMutation({
		mutationFn: ({ id, data }: any) => attendanceApi.reviewLeave(id, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["leave-requests"] });
			toast.success("Leave request updated");
		},
		onError: () => toast.error("Update failed"),
	});

	const pendingLeave = leave.filter((l: any) => l.status === "pending");
	const approvedLeave = leave.filter((l: any) => l.status === "approved");
	const activeAttachees = attachees.filter((a: any) => a.is_active);

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Users size={22} className="text-nexus-400" /> HR Management
					</h1>
					<p className="page-subtitle">
						Attachee management · leave requests · evaluations · departments
					</p>
				</div>
				<button className="btn-primary btn-sm">
					<UserPlus size={13} /> Onboard Attachee
				</button>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit flex-wrap">
				{TABS.map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={clsx(
							"px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
							{
								"bg-nexus-600 text-white": activeTab === tab,
								"text-slate-400 hover:text-white": activeTab !== tab,
							},
						)}>
						{tab}
					</button>
				))}
			</div>

			{/* ── OVERVIEW ── */}
			{activeTab === "overview" && (
				<div className="space-y-5">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{[
							{
								label: "Total Staff",
								value: userStats?.total_users ?? "—",
								color: "text-white",
								icon: Users,
							},
							{
								label: "Active Attachees",
								value: activeAttachees.length,
								color: "text-green-400",
								icon: GraduationCap,
							},
							{
								label: "Pending Leave",
								value: pendingLeave.length,
								color: "text-amber-400",
								icon: Clock,
							},
							{
								label: "Departments",
								value: userStats?.by_department?.length ?? "—",
								color: "text-nexus-400",
								icon: Building2,
							},
						].map(({ label, value, color, icon: Icon }) => (
							<div key={label} className="stat-card">
								<Icon size={18} className={color} />
								<div className={clsx("stat-value", color)}>{value}</div>
								<div className="stat-label">{label}</div>
							</div>
						))}
					</div>

					{/* Role breakdown */}
					{userStats?.by_role && (
						<div className="card">
							<h3 className="font-semibold text-white mb-4">Staff by Role</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
								{Object.entries(userStats.by_role).map(([role, count]: any) => (
									<div
										key={role}
										className="p-3 bg-surface rounded-xl border border-surface-border">
										<div className="text-xl font-bold text-white">{count}</div>
										<div className="text-xs text-slate-500 mt-0.5">{role}</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Recent attachees */}
					<div className="card">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-white">Recent Attachees</h3>
							<button
								onClick={() => setActiveTab("attachees")}
								className="btn-ghost btn-sm text-xs">
								View all
							</button>
						</div>
						<table className="data-table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Department</th>
									<th>Status</th>
									<th>Joined</th>
								</tr>
							</thead>
							<tbody>
								{attachees.slice(0, 6).map((a: any) => (
									<tr key={a.id}>
										<td>
											<div className="flex items-center gap-2">
												<div className="w-7 h-7 rounded-full bg-nexus-600/20 flex items-center justify-center text-xs font-bold text-nexus-400">
													{a.full_name
														?.split(" ")
														.map((n: string) => n[0])
														.join("")
														.slice(0, 2)}
												</div>
												<div>
													<div className="text-sm font-medium text-white">
														{a.full_name}
													</div>
													<div className="text-xs text-slate-500">
														{a.email}
													</div>
												</div>
											</div>
										</td>
										<td className="text-slate-400 text-sm">
											{a.department_name || "—"}
										</td>
										<td>
											<span
												className={clsx(
													"badge",
													a.is_active ? "badge-green" : "badge-slate",
												)}>
												{a.is_active ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="text-slate-400 text-xs">
											{a.date_joined
												? format(parseISO(a.date_joined), "dd MMM yyyy")
												: "—"}
										</td>
									</tr>
								))}
								{attachees.length === 0 && (
									<tr>
										<td colSpan={4} className="text-center py-8 text-slate-500">
											No attachees yet
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ── ATTACHEES ── */}
			{activeTab === "attachees" && (
				<div className="card">
					<div className="flex items-center gap-3 mb-5">
						<div className="relative flex-1">
							<Search
								size={13}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
							/>
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search attachees..."
								className="input pl-8 py-2"
							/>
						</div>
						<button className="btn-secondary btn-sm">
							<Download size={13} /> Export
						</button>
					</div>
					<table className="data-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Department</th>
								<th>Branch</th>
								<th>Status</th>
								<th>Joined</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{attachees
								.filter(
									(a: any) =>
										!search ||
										a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
										a.email?.toLowerCase().includes(search.toLowerCase()),
								)
								.map((a: any) => (
									<tr key={a.id}>
										<td className="font-medium text-white text-sm">
											{a.full_name}
										</td>
										<td className="text-slate-400 text-xs">{a.email}</td>
										<td className="text-slate-400 text-sm">
											{a.department_name || "—"}
										</td>
										<td className="text-slate-400 text-sm">
											{a.branch_name || "—"}
										</td>
										<td>
											<span
												className={clsx(
													"badge",
													a.is_active ? "badge-green" : "badge-slate",
												)}>
												{a.is_active ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="text-slate-400 text-xs">
											{a.date_joined
												? format(parseISO(a.date_joined), "dd MMM yyyy")
												: "—"}
										</td>
										<td>
											<button className="btn-ghost btn-sm p-1.5">
												<Eye size={13} />
											</button>
										</td>
									</tr>
								))}
							{attachees.length === 0 && (
								<tr>
									<td colSpan={7} className="text-center py-10 text-slate-500">
										No attachees found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* ── LEAVE REQUESTS ── */}
			{activeTab === "leave" && (
				<div className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						{[
							{
								label: "Pending",
								value: pendingLeave.length,
								color: "text-amber-400",
							},
							{
								label: "Approved",
								value: approvedLeave.length,
								color: "text-green-400",
							},
							{ label: "Total", value: leave.length, color: "text-white" },
						].map(({ label, value, color }) => (
							<div key={label} className="stat-card text-center">
								<div className={clsx("stat-value", color)}>{value}</div>
								<div className="stat-label">{label}</div>
							</div>
						))}
					</div>
					<div className="card">
						<table className="data-table">
							<thead>
								<tr>
									<th>Employee</th>
									<th>Type</th>
									<th>Period</th>
									<th>Days</th>
									<th>Reason</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{leave.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className="text-center py-10 text-slate-500">
											No leave requests
										</td>
									</tr>
								) : (
									leave.map((req: any) => (
										<tr key={req.id}>
											<td className="font-medium text-white text-sm">
												{req.user_name || "—"}
											</td>
											<td>
												<span className="badge-slate text-[10px] capitalize">
													{req.leave_type?.replace("_", " ")}
												</span>
											</td>
											<td className="text-slate-400 text-xs">
												{req.start_date &&
													format(parseISO(req.start_date), "dd MMM")}{" "}
												→{" "}
												{req.end_date &&
													format(parseISO(req.end_date), "dd MMM yyyy")}
											</td>
											<td className="text-white font-medium">
												{req.days_requested}
											</td>
											<td className="text-slate-400 text-xs max-w-xs truncate">
												{req.reason}
											</td>
											<td>
												<span
													className={clsx("badge text-[10px]", {
														"badge-amber": req.status === "pending",
														"badge-green": req.status === "approved",
														"badge-red": req.status === "rejected",
														"badge-slate": req.status === "cancelled",
													})}>
													{req.status}
												</span>
											</td>
											<td>
												{req.status === "pending" && (
													<div className="flex gap-1.5">
														<button
															onClick={() =>
																reviewLeaveMutation.mutate({
																	id: req.id,
																	data: { status: "approved" },
																})
															}
															className="btn-success btn-sm p-1.5">
															<CheckCircle size={12} />
														</button>
														<button
															onClick={() =>
																reviewLeaveMutation.mutate({
																	id: req.id,
																	data: { status: "rejected" },
																})
															}
															className="btn-danger btn-sm p-1.5">
															<XCircle size={12} />
														</button>
													</div>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ── EVALUATIONS ── */}
			{activeTab === "evaluations" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">All Evaluations</h3>
						<button className="btn-primary btn-sm">
							<Plus size={13} /> New Evaluation
						</button>
					</div>
					<table className="data-table">
						<thead>
							<tr>
								<th>Attachee</th>
								<th>Type</th>
								<th>Period</th>
								<th>Score</th>
								<th>Evaluator</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{evals.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-10 text-slate-500">
										No evaluations yet
									</td>
								</tr>
							) : (
								evals.map((ev: any) => (
									<tr key={ev.id}>
										<td className="font-medium text-white text-sm">
											{ev.attachee_name || "—"}
										</td>
										<td>
											<span className="badge-blue text-[10px] capitalize">
												{ev.template?.evaluation_type || "evaluation"}
											</span>
										</td>
										<td className="text-slate-400 text-xs">
											{ev.period_start &&
												format(parseISO(ev.period_start), "dd MMM")}{" "}
											–{" "}
											{ev.period_end &&
												format(parseISO(ev.period_end), "dd MMM yyyy")}
										</td>
										<td>
											{ev.percentage ? (
												<span
													className={clsx("font-bold text-sm", {
														"text-green-400": parseFloat(ev.percentage) >= 75,
														"text-amber-400": parseFloat(ev.percentage) >= 50,
														"text-red-400": parseFloat(ev.percentage) < 50,
													})}>
													{ev.percentage}%
												</span>
											) : (
												"—"
											)}
										</td>
										<td className="text-slate-400 text-sm">
											{ev.evaluator_name || "—"}
										</td>
										<td>
											<span
												className={clsx("badge text-[10px]", {
													"badge-amber": ev.status === "pending",
													"badge-blue": ev.status === "in_progress",
													"badge-green": ev.status === "completed",
												})}>
												{ev.status}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* ── DEPARTMENTS ── */}
			{activeTab === "departments" && (
				<div className="space-y-4">
					<div className="flex justify-end">
						<button className="btn-primary btn-sm">
							<Plus size={13} /> Add Department
						</button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{depts.length === 0 ? (
							<div className="col-span-3 card text-center py-12 text-slate-500">
								No departments yet
							</div>
						) : (
							depts.map((d: any) => (
								<div
									key={d.id}
									className="card hover:border-nexus-500/30 transition-all">
									<div className="flex items-center justify-between mb-2">
										<h3 className="font-semibold text-white">{d.name}</h3>
										<span
											className={clsx(
												"badge text-[10px]",
												d.is_active ? "badge-green" : "badge-slate",
											)}>
											{d.is_active ? "Active" : "Inactive"}
										</span>
									</div>
									<p className="text-xs text-slate-500 mb-3">
										{d.description || "No description"}
									</p>
									<div className="flex items-center justify-between text-xs">
										<span className="text-slate-400">
											{d.user_count || 0} members
										</span>
										{d.branch_name && (
											<span className="text-slate-500">{d.branch_name}</span>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
