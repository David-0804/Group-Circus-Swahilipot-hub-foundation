// NEXUS — User Management Page (fully implemented)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import {
	Shield,
	Plus,
	Search,
	Eye,
	Edit3,
	UserX,
	UserCheck,
	Upload,
	RefreshCw,
	Download,
	Key,
	Smartphone,
} from "lucide-react";
import { usersApi, hrApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const ROLES = [
	{ value: "system_admin", label: "System Administrator" },
	{ value: "hr_officer", label: "HR Officer" },
	{ value: "executive", label: "Executive" },
	{ value: "data_analyst", label: "Data Analyst" },
	{ value: "finance", label: "Finance Officer" },
	{ value: "broadcast_admin", label: "Broadcast Admin" },
	{ value: "broadcast_staff", label: "Broadcast Staff" },
	{ value: "broadcast_student", label: "Broadcast Student" },
	{ value: "journalist", label: "Journalist" },
	{ value: "presenter", label: "Presenter / DJ" },
	{ value: "editor", label: "Editor" },
	{ value: "videographer", label: "Videographer" },
	{ value: "station_engineer", label: "Station Engineer" },
	{ value: "supervisor", label: "Supervisor" },
	{ value: "department_leader", label: "Department Leader" },
	{ value: "attachee", label: "Attachee / Intern" },
	{ value: "university_coordinator", label: "University Coordinator" },
	{ value: "ict", label: "ICT / IT Staff" },
	{ value: "security_officer", label: "Security Officer" },
];

const ROLE_COLORS: Record<string, string> = {
	system_admin: "badge-purple",
	hr_officer: "badge-green",
	executive: "badge-blue",
	broadcast_admin: "badge-amber",
	broadcast_staff: "badge-amber",
	journalist: "badge-green",
	presenter: "badge-blue",
	editor: "badge-blue",
	attachee: "badge-slate",
	supervisor: "badge-blue",
};

export default function UserManagementPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [showBulkModal, setShowBulkModal] = useState(false);

	const { data: usersData, isLoading } = useQuery({
		queryKey: ["users", search, roleFilter, statusFilter],
		queryFn: () =>
			usersApi
				.list({
					search: search || undefined,
					role: roleFilter || undefined,
					is_active:
						statusFilter === "active"
							? true
							: statusFilter === "inactive"
								? false
								: undefined,
				})
				.then((r) => r.data),
		refetchInterval: 60000,
	});

	const { data: statsData } = useQuery({
		queryKey: ["user-stats"],
		queryFn: () => usersApi.stats().then((r) => r.data),
		refetchInterval: 120000,
	});

	const { data: depts = [] } = useQuery({
		queryKey: ["departments"],
		queryFn: () => hrApi.departments().then((r) => r.data.results || r.data),
	});

	const users = Array.isArray(usersData)
		? usersData
		: (usersData?.results ?? []);

	const toggleActiveMutation = useMutation({
		mutationFn: ({ id, is_active }: any) => usersApi.update(id, { is_active }),
		onSuccess: (_, { is_active }) => {
			qc.invalidateQueries({ queryKey: ["users"] });
			qc.invalidateQueries({ queryKey: ["user-stats"] });
			toast.success(is_active ? "User activated" : "User deactivated");
		},
		onError: () => toast.error("Action failed"),
	});

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Shield size={22} className="text-nexus-400" /> User Management
					</h1>
					<p className="page-subtitle">
						Create · edit · deactivate users · manage roles and permissions
					</p>
				</div>
				<div className="flex gap-3">
					<button
						onClick={() => setShowBulkModal(true)}
						className="btn-secondary btn-sm">
						<Upload size={13} /> Bulk Import
					</button>
					<button
						onClick={() => {
							setSelectedUser(null);
							setShowCreateModal(true);
						}}
						className="btn-primary">
						<Plus size={15} /> Add User
					</button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
				{[
					{
						label: "Total Users",
						value: statsData?.total_users ?? users.length,
						color: "text-white",
					},
					{
						label: "Active",
						value: statsData?.active_users ?? "—",
						color: "text-green-400",
					},
					{
						label: "Inactive",
						value: statsData?.inactive_users ?? "—",
						color: "text-slate-400",
					},
					{
						label: "MFA Enabled",
						value: statsData?.mfa_enabled ?? "—",
						color: "text-nexus-400",
					},
					{ label: "Roles", value: ROLES.length, color: "text-purple-400" },
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
					value={roleFilter}
					onChange={(e) => setRoleFilter(e.target.value)}
					className="select-input w-44">
					<option value="">All Roles</option>
					{ROLES.map((r) => (
						<option key={r.value} value={r.value}>
							{r.label}
						</option>
					))}
				</select>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="select-input w-36">
					<option value="">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
				<button
					onClick={() => {
						setSearch("");
						setRoleFilter("");
						setStatusFilter("");
					}}
					className="btn-secondary btn-sm">
					<RefreshCw size={13} /> Clear
				</button>
			</div>

			{/* Table */}
			<div className="card overflow-x-auto">
				<table className="data-table">
					<thead>
						<tr>
							<th>User</th>
							<th>Role</th>
							<th>Department</th>
							<th>Status</th>
							<th>MFA</th>
							<th>Last Login</th>
							<th>Actions</th>
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
						) : users.length === 0 ? (
							<tr>
								<td colSpan={7} className="text-center py-12 text-slate-500">
									<Shield size={28} className="mx-auto mb-2 opacity-30" />
									No users found
								</td>
							</tr>
						) : (
							users.map((u: any) => (
								<tr key={u.id}>
									<td>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-gradient-nexus flex items-center justify-center text-xs font-bold text-white shrink-0">
												{u.full_name
													?.split(" ")
													.map((n: string) => n[0])
													.join("")
													.slice(0, 2) ?? "??"}
											</div>
											<div>
												<div className="font-medium text-white text-sm">
													{u.full_name}
												</div>
												<div className="text-xs text-slate-500">{u.email}</div>
											</div>
										</div>
									</td>
									<td>
										<span
											className={clsx(
												"badge text-[10px]",
												ROLE_COLORS[u.role] || "badge-slate",
											)}>
											{u.role_display || u.role}
										</span>
									</td>
									<td className="text-slate-400 text-sm">
										{u.department_name || "—"}
									</td>
									<td>
										<span
											className={clsx(
												"badge",
												u.is_active ? "badge-green" : "badge-slate",
											)}>
											{u.is_active ? "Active" : "Inactive"}
										</span>
									</td>
									<td>
										{u.mfa_enabled ? (
											<span className="flex items-center gap-1 text-xs text-nexus-400">
												<Smartphone size={11} />
												On
											</span>
										) : (
											<span className="text-xs text-slate-500">Off</span>
										)}
									</td>
									<td className="text-slate-400 text-xs">
										{u.last_login
											? format(parseISO(u.last_login), "dd MMM, HH:mm")
											: "Never"}
									</td>
									<td>
										<div className="flex items-center gap-1.5">
											<button
												onClick={() => {
													setSelectedUser(u);
													setShowEditModal(true);
												}}
												className="btn-ghost btn-sm p-1.5"
												title="Edit">
												<Edit3 size={13} />
											</button>
											<button
												onClick={() =>
													toggleActiveMutation.mutate({
														id: u.id,
														is_active: !u.is_active,
													})
												}
												className={clsx(
													"btn-sm",
													u.is_active ? "btn-danger" : "btn-success",
												)}
												title={u.is_active ? "Deactivate" : "Activate"}>
												{u.is_active ? (
													<UserX size={12} />
												) : (
													<UserCheck size={12} />
												)}
												{u.is_active ? "Deactivate" : "Activate"}
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Modals */}
			{showCreateModal && (
				<UserFormModal
					user={null}
					depts={depts}
					onClose={() => setShowCreateModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["users"] });
						qc.invalidateQueries({ queryKey: ["user-stats"] });
						setShowCreateModal(false);
					}}
				/>
			)}

			{showEditModal && selectedUser && (
				<UserFormModal
					user={selectedUser}
					depts={depts}
					onClose={() => {
						setShowEditModal(false);
						setSelectedUser(null);
					}}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["users"] });
						setShowEditModal(false);
					}}
				/>
			)}

			{showBulkModal && (
				<BulkImportModal
					onClose={() => setShowBulkModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["users"] });
						setShowBulkModal(false);
					}}
				/>
			)}
		</div>
	);
}

// ── User Form Modal ───────────────────────────────────────────────────────
function UserFormModal({ user, depts, onClose, onSuccess }: any) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: user || { role: "broadcast_staff", is_active: true },
	});
	const isEdit = !!user;

	const mutation = useMutation({
		mutationFn: (data: any) =>
			isEdit ? usersApi.update(user.id, data) : usersApi.create(data),
		onSuccess: () => {
			toast.success(isEdit ? "User updated!" : "User created!");
			onSuccess();
		},
		onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">
						{isEdit ? "Edit User — " + user.full_name : "Create New User"}
					</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body grid grid-cols-2 gap-4">
						<div className="input-group">
							<label className="input-label">First Name *</label>
							<input
								{...register("first_name", { required: true })}
								className="input"
							/>
							{errors.first_name && (
								<p className="text-red-400 text-xs">Required</p>
							)}
						</div>
						<div className="input-group">
							<label className="input-label">Last Name *</label>
							<input
								{...register("last_name", { required: true })}
								className="input"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Email Address *</label>
							<input
								type="email"
								{...register("email", { required: true })}
								className="input"
								disabled={isEdit}
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Phone</label>
							<input
								{...register("phone")}
								className="input"
								placeholder="+254 700 000 000"
							/>
						</div>
						{!isEdit && (
							<div className="input-group">
								<label className="input-label">Password *</label>
								<input
									type="password"
									{...register("password", {
										required: !isEdit,
										minLength: 10,
									})}
									className="input"
									placeholder="Min. 10 characters"
								/>
							</div>
						)}
						<div className="input-group">
							<label className="input-label">Employee ID</label>
							<input
								{...register("employee_id")}
								className="input"
								placeholder="EMP-001"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Role *</label>
							<select
								{...register("role", { required: true })}
								className="select-input">
								{ROLES.map((r) => (
									<option key={r.value} value={r.value}>
										{r.label}
									</option>
								))}
							</select>
						</div>
						<div className="input-group">
							<label className="input-label">Department</label>
							<select {...register("department")} className="select-input">
								<option value="">None</option>
								{depts.map((d: any) => (
									<option key={d.id} value={d.id}>
										{d.name}
									</option>
								))}
							</select>
						</div>
						{isEdit && (
							<div className="input-group col-span-2">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										{...register("is_active")}
										className="rounded"
									/>
									<span className="text-sm text-slate-300">
										Account is active
									</span>
								</label>
							</div>
						)}
					</div>
					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className="btn-primary">
							{mutation.isPending
								? "Saving..."
								: isEdit
									? "Update User"
									: "Create User"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ── Bulk Import Modal ─────────────────────────────────────────────────────
function BulkImportModal({ onClose, onSuccess }: any) {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<any>(null);

	const mutation = useMutation({
		mutationFn: (f: File) => usersApi.bulkImport(f),
		onSuccess: (res) => {
			setResult(res.data);
			toast.success("Import complete");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Import failed"),
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<Upload size={16} /> Bulk Import Users
					</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="alert alert-info">
						<span>
							CSV format:{" "}
							<code className="text-nexus-400">
								email, password, first_name, last_name, role, phone, employee_id
							</code>
						</span>
					</div>

					<div className="input-group">
						<label className="input-label">CSV File</label>
						<input
							type="file"
							accept=".csv"
							onChange={(e) => setFile(e.target.files?.[0] || null)}
							className="input py-2 cursor-pointer"
						/>
					</div>

					{result && (
						<div
							className={clsx(
								"alert",
								result.errors > 0 ? "alert-warning" : "alert-success",
							)}>
							<div>
								<div className="font-semibold">
									✅ {result.created} users created · ❌ {result.errors} errors
								</div>
								{result.error_details?.length > 0 && (
									<div className="text-xs mt-1 space-y-0.5">
										{result.error_details
											.slice(0, 5)
											.map((e: any, i: number) => (
												<div key={i}>
													Row {e.row}: {e.email} — {e.error}
												</div>
											))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						{result ? "Done" : "Cancel"}
					</button>
					{!result && (
						<button
							disabled={!file || mutation.isPending}
							onClick={() => file && mutation.mutate(file)}
							className="btn-primary">
							{mutation.isPending ? "Importing..." : "Import Users"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
