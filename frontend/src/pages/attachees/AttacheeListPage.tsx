// Swahilipot — Attachee Management
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	GraduationCap,
	Search,
	Filter,
	Eye,
	UserPlus,
	Download,
	BarChart3,
	Calendar,
} from "lucide-react";
import { usersApi, hrApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import clsx from "clsx";

export default function AttacheeListPage() {
	const { user } = useAuthStore();
	const [search, setSearch] = useState("");
	const [deptFilter, setDeptFilter] = useState("");
	const [selectedAttachee, setSelectedAttachee] = useState<any>(null);

	const { data: attachees = [], isLoading } = useQuery({
		queryKey: ["users", "attachee", search, deptFilter],
		queryFn: () =>
			usersApi
				.list({
					role: "attachee",
					search: search || undefined,
					department: deptFilter || undefined,
				})
				.then((r) => r.data.results || r.data),
		refetchInterval: 120000,
	});

	const { data: departments = [] } = useQuery({
		queryKey: ["departments"],
		queryFn: () => hrApi.departments().then((r) => r.data.results || r.data),
	});

	const isAdmin = [
		"hr_officer",
		"system_admin",
		"executive",
		"supervisor",
		"department_leader",
		"broadcast_admin",
	].includes(user?.role || "");

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<GraduationCap size={22} className="text-Swahilipot-400" /> Attachee
						Management
					</h1>
					<p className="page-subtitle">
						All industrial attachment placements, progress, and department
						assignments
					</p>
				</div>
				{isAdmin && (
					<div className="flex gap-2">
						<button className="btn-secondary btn-sm">
							<Download size={13} /> Export
						</button>
						<button className="btn-primary btn-sm">
							<UserPlus size={13} /> Add Attachee
						</button>
					</div>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[
					{
						label: "Total Attachees",
						value: attachees.length,
						color: "text-white",
					},
					{
						label: "Active",
						value: attachees.filter((a: any) => a.is_active).length,
						color: "text-green-400",
					},
					{
						label: "This Month",
						value: attachees.filter((a: any) => {
							if (!a.date_joined) return false;
							const joined = parseISO(a.date_joined);
							const now = new Date();
							return (
								joined.getMonth() === now.getMonth() &&
								joined.getFullYear() === now.getFullYear()
							);
						}).length,
						color: "text-blue-400",
					},
					{
						label: "Departments",
						value: departments.length,
						color: "text-purple-400",
					},
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3">
				<div className="relative flex-1 min-w-48">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name or email..."
						className="input pl-9 py-2"
					/>
				</div>
				<select
					value={deptFilter}
					onChange={(e) => setDeptFilter(e.target.value)}
					className="select-input w-44">
					<option value="">All Departments</option>
					{departments.map((d: any) => (
						<option key={d.id} value={d.id}>
							{d.name}
						</option>
					))}
				</select>
			</div>

			{/* Table */}
			<div className="card">
				<div className="overflow-x-auto">
					<table className="data-table">
						<thead>
							<tr>
								<th>Attachee</th>
								<th>Employee ID</th>
								<th>Department</th>
								<th>Branch</th>
								<th>Status</th>
								<th>Date Joined</th>
								{isAdmin && <th>Actions</th>}
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								[...Array(8)].map((_, i) => (
									<tr key={i}>
										<td colSpan={7}>
											<div className="skeleton h-8 w-full my-1" />
										</td>
									</tr>
								))
							) : attachees.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-12 text-slate-500">
										<GraduationCap
											size={28}
											className="mx-auto mb-2 opacity-30"
										/>
										No attachees found
									</td>
								</tr>
							) : (
								attachees.map((a: any) => (
									<tr key={a.id}>
										<td>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-gradient-Swahilipot flex items-center justify-center text-xs font-bold text-white shrink-0">
													{a.full_name
														?.split(" ")
														.map((n: string) => n[0])
														.join("")
														.slice(0, 2)}
												</div>
												<div>
													<div className="font-medium text-white text-sm">
														{a.full_name}
													</div>
													<div className="text-xs text-slate-500">
														{a.email}
													</div>
												</div>
											</div>
										</td>
										<td className="font-mono text-xs text-slate-400">
											{a.employee_id || "—"}
										</td>
										<td className="text-slate-300 text-sm">
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
										{isAdmin && (
											<td>
												<button
													onClick={() => setSelectedAttachee(a)}
													className="btn-ghost btn-sm p-1.5">
													<Eye size={13} />
												</button>
											</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Detail panel */}
			{selectedAttachee && (
				<div
					className="modal-backdrop"
					onClick={() => setSelectedAttachee(null)}>
					<div
						className="modal-box max-w-md"
						onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="font-semibold text-white">Attachee Profile</h3>
						</div>
						<div className="modal-body space-y-4">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-2xl bg-gradient-Swahilipot flex items-center justify-center text-xl font-bold text-white">
									{selectedAttachee.full_name
										?.split(" ")
										.map((n: string) => n[0])
										.join("")
										.slice(0, 2)}
								</div>
								<div>
									<div className="text-white font-semibold text-lg">
										{selectedAttachee.full_name}
									</div>
									<div className="text-slate-400 text-sm">
										{selectedAttachee.email}
									</div>
									<span
										className={clsx(
											"badge mt-1",
											selectedAttachee.is_active
												? "badge-green"
												: "badge-slate",
										)}>
										{selectedAttachee.is_active ? "Active" : "Inactive"}
									</span>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								{[
									["Department", selectedAttachee.department_name || "—"],
									["Branch", selectedAttachee.branch_name || "—"],
									["Employee ID", selectedAttachee.employee_id || "—"],
									[
										"Joined",
										selectedAttachee.date_joined
											? format(
													parseISO(selectedAttachee.date_joined),
													"dd MMM yyyy",
												)
											: "—",
									],
									["Phone", selectedAttachee.phone || "—"],
									[
										"Last Active",
										selectedAttachee.last_login
											? format(
													parseISO(selectedAttachee.last_login),
													"dd MMM HH:mm",
												)
											: "Never",
									],
								].map(([label, value]) => (
									<div key={label} className="bg-surface rounded-lg p-3">
										<div className="text-slate-500 text-xs mb-0.5">{label}</div>
										<div className="text-white font-medium truncate">
											{value}
										</div>
									</div>
								))}
							</div>
						</div>
						<div className="modal-footer">
							<button
								onClick={() => setSelectedAttachee(null)}
								className="btn-secondary">
								Close
							</button>
							<button className="btn-primary btn-sm">
								<BarChart3 size={13} /> View Progress
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
