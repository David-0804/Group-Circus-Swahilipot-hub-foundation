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
	CheckCircle,
	Clock,
	XCircle,
	Calendar,
	X,
	Phone,
	MapPin,
	Briefcase,
} from "lucide-react";
import {
	hrApi,
	usersApi,
	attendanceApi,
	evaluationsApi,
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

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({
	open,
	onClose,
	title,
	children,
	size = "md",
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	size?: "sm" | "md" | "lg";
}) {
	if (!open) return null;
	const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" };
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className={clsx(
					"relative w-full bg-surface-card border border-surface-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto",
					widths[size],
				)}>
				<div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-surface-card z-10">
					<h2 className="text-base font-semibold text-white">{title}</h2>
					<button
						onClick={onClose}
						className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-white">
						<X size={16} />
					</button>
				</div>
				<div className="px-6 py-5">{children}</div>
			</div>
		</div>
	);
}

// ── Shared error parser ────────────────────────────────────────────────────────
function parseApiError(err: any, fallback: string): string {
	const data = err?.response?.data;
	if (!data) return fallback;
	if (data.detail) return String(data.detail);
	return Object.entries(data)
		.map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
		.join(" · ");
}

// ── Onboard Attachee Modal ─────────────────────────────────────────────────────
function OnboardModal({
	open,
	onClose,
	departments,
	organisationId,
}: {
	open: boolean;
	onClose: () => void;
	departments: any[];
	organisationId?: string | null;
}) {
	const qc = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<any>();

	const mutation = useMutation({
		mutationFn: (data: any) =>
			usersApi.create({
				first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				password: data.password,
				role: "attachee",
				...(organisationId && { organisation: organisationId }),
				...(data.phone && { phone: data.phone }),
				...(data.department && { department: data.department }),
				...(data.employee_id && { employee_id: data.employee_id }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["attachees"] });
			qc.invalidateQueries({ queryKey: ["user-stats"] });
			toast.success("Attachee onboarded successfully");
			reset();
			onClose();
		},
		onError: (err: any) =>
			toast.error(parseApiError(err, "Failed to onboard attachee")),
	});

	return (
		<Modal open={open} onClose={onClose} title="Onboard New Attachee" size="lg">
			<form
				onSubmit={handleSubmit((d) => mutation.mutate(d))}
				className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="form-label">First Name</label>
						<input
							{...register("first_name", { required: "Required" })}
							className="input"
							placeholder="Jane"
						/>
						{errors.first_name && (
							<p className="form-error">{String(errors.first_name.message)}</p>
						)}
					</div>
					<div>
						<label className="form-label">Last Name</label>
						<input
							{...register("last_name", { required: "Required" })}
							className="input"
							placeholder="Muthoni"
						/>
						{errors.last_name && (
							<p className="form-error">{String(errors.last_name.message)}</p>
						)}
					</div>
				</div>

				<div>
					<label className="form-label">Email Address</label>
					<input
						{...register("email", {
							required: "Required",
							pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
						})}
						className="input"
						placeholder="jane@example.com"
						type="email"
					/>
					{errors.email && (
						<p className="form-error">{String(errors.email.message)}</p>
					)}
				</div>

				<div>
					<label className="form-label">Password</label>
					<input
						{...register("password", {
							required: "Required",
							minLength: { value: 10, message: "Min 10 characters" },
						})}
						className="input"
						type="password"
						placeholder="Temporary password (min 10 chars)"
					/>
					{errors.password && (
						<p className="form-error">{String(errors.password.message)}</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="form-label">Phone (optional)</label>
						<input
							{...register("phone")}
							className="input"
							placeholder="+254 700 000 000"
						/>
					</div>
					<div>
						<label className="form-label">Employee ID (optional)</label>
						<input
							{...register("employee_id")}
							className="input"
							placeholder="EMP-001"
						/>
					</div>
				</div>

				<div>
					<label className="form-label">Department</label>
					<select {...register("department")} className="input">
						<option value="">— Select department —</option>
						{departments.map((d: any) => (
							<option key={d.id} value={d.id}>
								{d.name}
							</option>
						))}
					</select>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="btn-secondary btn-sm">
						Cancel
					</button>
					<button
						type="submit"
						disabled={mutation.isPending}
						className="btn-primary btn-sm">
						<UserPlus size={13} />
						{mutation.isPending ? "Onboarding…" : "Onboard Attachee"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

// ── View Attachee Modal ────────────────────────────────────────────────────────
function ViewAttacheeModal({
	attachee,
	onClose,
}: {
	attachee: any | null;
	onClose: () => void;
}) {
	if (!attachee) return null;
	const initials = attachee.full_name
		?.split(" ")
		.map((n: string) => n[0])
		.join("")
		.slice(0, 2);

	return (
		<Modal open={!!attachee} onClose={onClose} title="Attachee Profile">
			<div className="space-y-5">
				<div className="flex items-center gap-4">
					<div className="w-14 h-14 rounded-full bg-nexus-600/20 flex items-center justify-center text-xl font-bold text-nexus-400">
						{initials}
					</div>
					<div>
						<div className="text-lg font-semibold text-white">
							{attachee.full_name}
						</div>
						<div className="text-sm text-slate-400">{attachee.email}</div>
						<span
							className={clsx(
								"badge text-[10px] mt-1",
								attachee.is_active ? "badge-green" : "badge-slate",
							)}>
							{attachee.is_active ? "Active" : "Inactive"}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					{[
						{
							icon: Building2,
							label: "Department",
							value: attachee.department_name || "—",
						},
						{
							icon: MapPin,
							label: "Branch",
							value: attachee.branch_name || "—",
						},
						{ icon: Phone, label: "Phone", value: attachee.phone || "—" },
						{
							icon: Calendar,
							label: "Joined",
							value: attachee.date_joined
								? format(parseISO(attachee.date_joined), "dd MMM yyyy")
								: "—",
						},
						{
							icon: GraduationCap,
							label: "Institution",
							value: attachee.institution || "—",
						},
						{
							icon: Briefcase,
							label: "Role",
							value: attachee.role_display || "Attachee",
						},
					].map(({ icon: Icon, label, value }) => (
						<div
							key={label}
							className="p-3 bg-surface rounded-xl border border-surface-border">
							<div className="flex items-center gap-2 mb-1">
								<Icon size={12} className="text-slate-500" />
								<span className="text-[10px] text-slate-500 uppercase tracking-wide">
									{label}
								</span>
							</div>
							<div className="text-sm text-white font-medium">{value}</div>
						</div>
					))}
				</div>

				{attachee.notes && (
					<div className="p-3 bg-surface rounded-xl border border-surface-border">
						<div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">
							Notes
						</div>
						<p className="text-sm text-slate-300">{attachee.notes}</p>
					</div>
				)}

				<div className="flex justify-end">
					<button onClick={onClose} className="btn-secondary btn-sm">
						Close
					</button>
				</div>
			</div>
		</Modal>
	);
}

// ── New Evaluation Modal ───────────────────────────────────────────────────────
function NewEvaluationModal({
	open,
	onClose,
	attachees,
}: {
	open: boolean;
	onClose: () => void;
	attachees: any[];
}) {
	const qc = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<any>();

	const mutation = useMutation({
		mutationFn: (data: any) => evaluationsApi.create(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["evaluations"] });
			toast.success("Evaluation created");
			reset();
			onClose();
		},
		onError: (err: any) =>
			toast.error(parseApiError(err, "Failed to create evaluation")),
	});

	return (
		<Modal open={open} onClose={onClose} title="New Evaluation" size="md">
			<form
				onSubmit={handleSubmit((d) => mutation.mutate(d))}
				className="space-y-4">
				<div>
					<label className="form-label">Attachee</label>
					<select
						{...register("attachee", { required: "Required" })}
						className="input">
						<option value="">— Select attachee —</option>
						{attachees.map((a: any) => (
							<option key={a.id} value={a.id}>
								{a.full_name}
							</option>
						))}
					</select>
					{errors.attachee && (
						<p className="form-error">{String(errors.attachee.message)}</p>
					)}
				</div>

				<div>
					<label className="form-label">Evaluation Type</label>
					<select
						{...register("evaluation_type", { required: "Required" })}
						className="input">
						<option value="">— Select type —</option>
						<option value="mid_term">Mid-Term</option>
						<option value="final">Final</option>
						<option value="monthly">Monthly</option>
						<option value="probation">Probation</option>
					</select>
					{errors.evaluation_type && (
						<p className="form-error">
							{String(errors.evaluation_type.message)}
						</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="form-label">Period Start</label>
						<input
							{...register("period_start", { required: "Required" })}
							className="input"
							type="date"
						/>
						{errors.period_start && (
							<p className="form-error">
								{String(errors.period_start.message)}
							</p>
						)}
					</div>
					<div>
						<label className="form-label">Period End</label>
						<input
							{...register("period_end", { required: "Required" })}
							className="input"
							type="date"
						/>
						{errors.period_end && (
							<p className="form-error">{String(errors.period_end.message)}</p>
						)}
					</div>
				</div>

				<div>
					<label className="form-label">Notes (optional)</label>
					<textarea
						{...register("notes")}
						className="input resize-none"
						rows={2}
						placeholder="Any notes for this evaluation…"
					/>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="btn-secondary btn-sm">
						Cancel
					</button>
					<button
						type="submit"
						disabled={mutation.isPending}
						className="btn-primary btn-sm">
						<Plus size={13} />
						{mutation.isPending ? "Creating…" : "Create Evaluation"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

// ── Add Department Modal ───────────────────────────────────────────────────────
function AddDepartmentModal({
	open,
	onClose,
	organisationId,
}: {
	open: boolean;
	onClose: () => void;
	organisationId?: string | null;
}) {
	const qc = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<any>();

	const mutation = useMutation({
		mutationFn: (data: any) =>
			hrApi.createDept({
				...data,
				...(organisationId && { organisation: organisationId }),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["departments"] });
			qc.invalidateQueries({ queryKey: ["user-stats"] });
			toast.success("Department created");
			reset();
			onClose();
		},
		onError: (err: any) =>
			toast.error(parseApiError(err, "Failed to create department")),
	});

	return (
		<Modal open={open} onClose={onClose} title="Add Department" size="sm">
			<form
				onSubmit={handleSubmit((d) => mutation.mutate(d))}
				className="space-y-4">
				<div>
					<label className="form-label">Department Name</label>
					<input
						{...register("name", { required: "Required" })}
						className="input"
						placeholder="e.g. Engineering"
					/>
					{errors.name && (
						<p className="form-error">{String(errors.name.message)}</p>
					)}
				</div>

				<div>
					<label className="form-label">Code</label>
					<input
						{...register("code", { required: "Required" })}
						className="input"
						placeholder="e.g. ENG"
					/>
					{errors.code && (
						<p className="form-error">{String(errors.code.message)}</p>
					)}
				</div>

				<div>
					<label className="form-label">Description (optional)</label>
					<textarea
						{...register("description")}
						className="input resize-none"
						rows={2}
						placeholder="What does this department do?"
					/>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="btn-secondary btn-sm">
						Cancel
					</button>
					<button
						type="submit"
						disabled={mutation.isPending}
						className="btn-primary btn-sm">
						<Plus size={13} />
						{mutation.isPending ? "Creating…" : "Add Department"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

// ── Export helper ──────────────────────────────────────────────────────────────
function exportToCSV(data: any[], filename: string) {
	if (!data.length) {
		toast.error("No data to export");
		return;
	}
	const headers = Object.keys(data[0]);
	const rows = data.map((row) =>
		headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
	);
	const csv = [headers.join(","), ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
	toast.success(`Exported ${data.length} records`);
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HRPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const [search, setSearch] = useState("");

	// Modal states
	const [showOnboard, setShowOnboard] = useState(false);
	const [viewAttachee, setViewAttachee] = useState<any | null>(null);
	const [showNewEval, setShowNewEval] = useState(false);
	const [showAddDept, setShowAddDept] = useState(false);

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
		// fetch when on departments tab OR when onboard modal is open (for dropdown)
		enabled: activeTab === "departments" || showOnboard,
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

	const filteredAttachees = attachees.filter(
		(a: any) =>
			!search ||
			a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
			a.email?.toLowerCase().includes(search.toLowerCase()) ||
			a.department_name?.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="space-y-6 animate-fade-in">
			{/* ── Modals ── */}
			<OnboardModal
				open={showOnboard}
				onClose={() => setShowOnboard(false)}
				departments={depts}
				organisationId={user?.organisation}
			/>
			<ViewAttacheeModal
				attachee={viewAttachee}
				onClose={() => setViewAttachee(null)}
			/>
			<NewEvaluationModal
				open={showNewEval}
				onClose={() => setShowNewEval(false)}
				attachees={attachees}
			/>
			<AddDepartmentModal
				open={showAddDept}
				onClose={() => setShowAddDept(false)}
				organisationId={user?.organisation}
			/>

			{/* ── Header ── */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Users size={22} className="text-nexus-400" /> HR Management
					</h1>
					<p className="page-subtitle">
						Attachee management · leave requests · evaluations · departments
					</p>
				</div>
				<button
					className="btn-primary btn-sm"
					onClick={() => setShowOnboard(true)}>
					<UserPlus size={13} /> Onboard Attachee
				</button>
			</div>

			{/* ── Tabs ── */}
			<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit flex-wrap">
				{TABS.map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={clsx(
							"px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
							activeTab === tab
								? "bg-nexus-600 text-white"
								: "text-slate-400 hover:text-white",
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
								value: depts.length || userStats?.by_department?.length || "—",
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
									<tr
										key={a.id}
										className="cursor-pointer hover:bg-surface/50"
										onClick={() => setViewAttachee(a)}>
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
											No attachees yet —{" "}
											<button
												onClick={() => setShowOnboard(true)}
												className="text-nexus-400 hover:underline">
												onboard one
											</button>
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
								placeholder="Search by name, email or department…"
								className="input pl-8 py-2"
							/>
						</div>
						<button
							className="btn-secondary btn-sm"
							onClick={() =>
								exportToCSV(
									filteredAttachees.map((a: any) => ({
										name: a.full_name,
										email: a.email,
										department: a.department_name || "",
										branch: a.branch_name || "",
										status: a.is_active ? "Active" : "Inactive",
										joined: a.date_joined
											? format(parseISO(a.date_joined), "dd MMM yyyy")
											: "",
									})),
									"attachees.csv",
								)
							}>
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
							{filteredAttachees.map((a: any) => (
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
										<button
											className="btn-ghost btn-sm p-1.5"
											title="View profile"
											onClick={() => setViewAttachee(a)}>
											<Eye size={13} />
										</button>
									</td>
								</tr>
							))}
							{filteredAttachees.length === 0 && (
								<tr>
									<td colSpan={7} className="text-center py-10 text-slate-500">
										{search
											? `No results for "${search}"`
											: "No attachees found"}
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
															title="Approve"
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
															title="Reject"
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
						<button
							className="btn-primary btn-sm"
							onClick={() => setShowNewEval(true)}>
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
										No evaluations yet —{" "}
										<button
											onClick={() => setShowNewEval(true)}
											className="text-nexus-400 hover:underline">
											create one
										</button>
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
												{ev.template?.evaluation_type ||
													ev.evaluation_type ||
													"evaluation"}
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
						<button
							className="btn-primary btn-sm"
							onClick={() => setShowAddDept(true)}>
							<Plus size={13} /> Add Department
						</button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{depts.length === 0 ? (
							<div className="col-span-3 card text-center py-12 text-slate-500">
								No departments yet —{" "}
								<button
									onClick={() => setShowAddDept(true)}
									className="text-nexus-400 hover:underline">
									add one
								</button>
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
