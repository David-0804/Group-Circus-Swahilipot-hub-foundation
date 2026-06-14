<<<<<<< HEAD
// Nexus — Attachee Management (full-featured)
// Bulk import (CSV/XLSX), supervisor assign/deassign, activate/deactivate
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
=======
// Swahilipot — Attachee Management
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
>>>>>>> origin/main
import { format, parseISO } from "date-fns";
import {
	GraduationCap,
	Search,
<<<<<<< HEAD
=======
	Filter,
>>>>>>> origin/main
	Eye,
	UserPlus,
	Download,
	BarChart3,
<<<<<<< HEAD
	Upload,
	X,
	CheckCircle,
	AlertCircle,
	Info,
	UserCheck,
	UserX,
	ShieldCheck,
	ShieldOff,
	ChevronDown,
	FileSpreadsheet,
	Loader2,
	AlertTriangle,
	RefreshCw,
} from "lucide-react";
import { usersApi, hrApi, api } from "../../services/api";
import { useAuthStore } from "../../services/api";
import clsx from "clsx";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attachee {
	id: string;
	full_name: string;
	email: string;
	employee_id?: string;
	department?: string;
	department_name?: string;
	branch_name?: string;
	is_active: boolean;
	date_joined?: string;
	last_login?: string;
	phone?: string;
	supervisor_user?: string;
	supervisor_name?: string;
}

interface Supervisor {
	id: string;
	full_name: string;
	email: string;
	department_name?: string;
}

interface ImportResult {
	summary: {
		created: number;
		duplicates: number;
		skipped: number;
		errors: number;
	};
	created: {
		email: string;
		full_name: string;
		department?: string;
		branch?: string;
	}[];
	duplicates: {
		row: number;
		email: string;
		full_name?: string;
		department?: string;
		is_active?: boolean;
		date_joined?: string;
		message: string;
	}[];
	skipped: { row: number; email: string; reason: string }[];
	errors: { row: number; email: string; reason: string }[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

const attacheeApi = {
	bulkImport: async (file: File): Promise<ImportResult> => {
		const fd = new FormData();
		fd.append("file", file);
		const res = await api.post("/v1/attachees/bulk-import/", fd, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return res.data;
	},
	downloadTemplate: () => {
		window.open("/api/v1/attachees/bulk-import/template/", "_blank");
	},
	assignSupervisor: async (attacheeId: string, supervisorId: string) => {
		const res = await api.post(
			`/v1/attachees/${attacheeId}/assign-supervisor/`,
			{
				supervisor_id: supervisorId,
			},
		);
		return res.data;
	},
	deassignSupervisor: async (attacheeId: string) => {
		const res = await api.post(
			`/v1/attachees/${attacheeId}/deassign-supervisor/`,
		);
		return res.data;
	},
	toggleActive: async (attacheeId: string, isActive: boolean) => {
		const res = await api.post(`/attachees/${attacheeId}/toggle-active/`, {
			is_active: isActive,
		});
		return res.data;
	},
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ImportResultPanel({
	result,
	onClose,
}: {
	result: ImportResult;
	onClose: () => void;
}) {
	const [tab, setTab] = useState<
		"created" | "duplicates" | "skipped" | "errors"
	>("created");
	const tabs = [
		{
			key: "created" as const,
			label: "Created",
			count: result.summary.created,
			color: "text-green-400",
		},
		{
			key: "duplicates" as const,
			label: "Duplicates",
			count: result.summary.duplicates,
			color: "text-yellow-400",
		},
		{
			key: "skipped" as const,
			label: "Skipped",
			count: result.summary.skipped,
			color: "text-slate-400",
		},
		{
			key: "errors" as const,
			label: "Errors",
			count: result.summary.errors,
			color: "text-red-400",
		},
	] as const;

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal-box max-w-2xl w-full"
				onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<FileSpreadsheet size={16} className="text-blue-400" />
						Import Results
					</h3>
					<button onClick={onClose} className="btn-ghost p-1.5">
						<X size={14} />
					</button>
				</div>

				{/* Summary pills */}
				<div className="px-5 py-3 flex flex-wrap gap-3 border-b border-white/5">
					{tabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							className={clsx(
								"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
								tab === t.key
									? "bg-white/10 text-white"
									: "text-slate-500 hover:text-slate-300",
							)}>
							<span className={t.color}>{t.count}</span> {t.label}
						</button>
					))}
				</div>

				<div className="modal-body max-h-80 overflow-y-auto space-y-1">
					{tab === "created" &&
						(result.created.length === 0 ? (
							<p className="text-slate-500 text-sm text-center py-6">
								No records created.
							</p>
						) : (
							result.created.map((r, i) => (
								<div
									key={i}
									className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-500/5 border border-green-500/10">
									<CheckCircle size={13} className="text-green-400 shrink-0" />
									<div className="min-w-0">
										<div className="text-sm text-white font-medium truncate">
											{r.full_name}
										</div>
										<div className="text-xs text-slate-500 truncate">
											{r.email}
											{r.department ? ` · ${r.department}` : ""}
										</div>
									</div>
								</div>
							))
						))}

					{tab === "duplicates" &&
						(result.duplicates.length === 0 ? (
							<p className="text-slate-500 text-sm text-center py-6">
								No duplicates found.
							</p>
						) : (
							result.duplicates.map((r, i) => (
								<div
									key={i}
									className="py-2 px-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
									<div className="flex items-center gap-2 mb-0.5">
										<AlertCircle
											size={13}
											className="text-yellow-400 shrink-0"
										/>
										<span className="text-sm text-white font-medium">
											{r.email}
										</span>
										{r.is_active !== undefined && (
											<span
												className={clsx(
													"badge ml-auto",
													r.is_active ? "badge-green" : "badge-slate",
												)}>
												{r.is_active ? "Active" : "Inactive"}
											</span>
										)}
									</div>
									<p className="text-xs text-yellow-300/70 ml-5">{r.message}</p>
									{r.department && (
										<p className="text-xs text-slate-500 ml-5">
											Dept: {r.department}
										</p>
									)}
								</div>
							))
						))}

					{tab === "skipped" &&
						(result.skipped.length === 0 ? (
							<p className="text-slate-500 text-sm text-center py-6">
								No rows skipped.
							</p>
						) : (
							result.skipped.map((r, i) => (
								<div
									key={i}
									className="py-2 px-3 rounded-lg bg-slate-500/5 border border-white/5">
									<div className="flex items-center gap-2">
										<Info size={13} className="text-slate-400 shrink-0" />
										<span className="text-xs text-slate-400">
											Row {r.row} · {r.email}
										</span>
									</div>
									<p className="text-xs text-slate-500 ml-5">{r.reason}</p>
								</div>
							))
						))}

					{tab === "errors" &&
						(result.errors.length === 0 ? (
							<p className="text-slate-500 text-sm text-center py-6">
								No errors.
							</p>
						) : (
							result.errors.map((r, i) => (
								<div
									key={i}
									className="py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
									<div className="flex items-center gap-2">
										<AlertTriangle
											size={13}
											className="text-red-400 shrink-0"
										/>
										<span className="text-xs text-slate-300">
											Row {r.row} · {r.email}
										</span>
									</div>
									<p className="text-xs text-red-300/70 ml-5">{r.reason}</p>
								</div>
							))
						))}
				</div>

				<div className="modal-footer">
					<button onClick={onClose} className="btn-primary btn-sm">
						Done
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Supervisor assign modal ───────────────────────────────────────────────────

function AssignSupervisorModal({
	attachee,
	supervisors,
	onClose,
	onAssign,
	onDeassign,
	loading,
}: {
	attachee: Attachee;
	supervisors: Supervisor[];
	onClose: () => void;
	onAssign: (supervisorId: string) => void;
	onDeassign: () => void;
	loading: boolean;
}) {
	const [selected, setSelected] = useState(attachee.supervisor_user ?? "");

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-md" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<UserCheck size={15} className="text-blue-400" />
						Assign Supervisor
					</h3>
					<button onClick={onClose} className="btn-ghost p-1.5">
						<X size={14} />
					</button>
				</div>
				<div className="modal-body space-y-4">
					<div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
						<div className="w-9 h-9 rounded-full bg-gradient-Swahilipot flex items-center justify-center text-xs font-bold text-white shrink-0">
							{attachee.full_name
								?.split(" ")
								.map((n) => n[0])
								.join("")
								.slice(0, 2)}
						</div>
						<div>
							<div className="text-white text-sm font-medium">
								{attachee.full_name}
							</div>
							<div className="text-xs text-slate-500">{attachee.email}</div>
						</div>
						{attachee.supervisor_name && (
							<div className="ml-auto text-right">
								<div className="text-xs text-slate-500">Current</div>
								<div className="text-xs text-blue-400 font-medium">
									{attachee.supervisor_name}
								</div>
							</div>
						)}
					</div>

					<div>
						<label className="block text-xs text-slate-400 mb-1.5">
							Select supervisor
						</label>
						<select
							value={selected}
							onChange={(e) => setSelected(e.target.value)}
							className="select-input w-full">
							<option value="">— Choose a supervisor —</option>
							{supervisors.map((s) => (
								<option key={s.id} value={s.id}>
									{s.full_name}
									{s.department_name ? ` (${s.department_name})` : ""}
								</option>
							))}
						</select>
						{supervisors.length === 0 && (
							<p className="text-xs text-slate-500 mt-1.5">
								No supervisors found in your department.
							</p>
						)}
					</div>
				</div>
				<div className="modal-footer">
					{attachee.supervisor_user && (
						<button
							onClick={onDeassign}
							disabled={loading}
							className="btn-secondary btn-sm text-red-400 hover:text-red-300 mr-auto">
							{loading ? (
								<Loader2 size={13} className="animate-spin" />
							) : (
								<UserX size={13} />
							)}
							Remove
						</button>
					)}
					<button onClick={onClose} className="btn-secondary btn-sm">
						Cancel
					</button>
					<button
						onClick={() => selected && onAssign(selected)}
						disabled={!selected || loading}
						className="btn-primary btn-sm">
						{loading ? (
							<Loader2 size={13} className="animate-spin" />
						) : (
							<UserCheck size={13} />
						)}
						Assign
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AttacheeListPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const fileRef = useRef<HTMLInputElement>(null);

	const [search, setSearch] = useState("");
	const [deptFilter, setDeptFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
		"",
	);
	const [selectedAttachee, setSelectedAttachee] = useState<Attachee | null>(
		null,
	);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [assignTarget, setAssignTarget] = useState<Attachee | null>(null);

	// ── Role flags ────────────────────────────────────────────────────────────
	const isAdmin = ["hr_officer", "system_admin", "executive"].includes(
		user?.role ?? "",
	);
	const isDeptLeader = user?.role === "department_leader";
	const canImport = isAdmin || isDeptLeader;
	const canManage = isAdmin || isDeptLeader;

	// ── Queries ───────────────────────────────────────────────────────────────
	const {
		data: attachees = [],
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["users", "attachee", search, deptFilter, statusFilter],
=======
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
>>>>>>> origin/main
		queryFn: () =>
			usersApi
				.list({
					role: "attachee",
					search: search || undefined,
					department: deptFilter || undefined,
<<<<<<< HEAD
					is_active:
						statusFilter === "active"
							? true
							: statusFilter === "inactive"
								? false
								: undefined,
				})
				.then((r) => r.data.results ?? r.data),
		refetchInterval: 120_000,
=======
				})
				.then((r) => r.data.results || r.data),
		refetchInterval: 120000,
>>>>>>> origin/main
	});

	const { data: departments = [] } = useQuery({
		queryKey: ["departments"],
<<<<<<< HEAD
		queryFn: () => hrApi.departments().then((r) => r.data.results ?? r.data),
	});

	const { data: supervisors = [] } = useQuery<Supervisor[]>({
		queryKey: ["supervisors"],
		queryFn: () =>
			usersApi
				.list({ role: "supervisor" })
				.then((r) => r.data.results ?? r.data),
		enabled: canManage,
	});

	// ── Mutations ─────────────────────────────────────────────────────────────
	const importMutation = useMutation({
		mutationFn: attacheeApi.bulkImport,
		onSuccess: (data) => {
			setImportResult(data);
			qc.invalidateQueries({ queryKey: ["users", "attachee"] });
			if (data.summary.created > 0)
				toast.success(
					`${data.summary.created} attachee${data.summary.created > 1 ? "s" : ""} imported`,
				);
			if (data.summary.duplicates > 0)
				toast(
					`${data.summary.duplicates} duplicate${data.summary.duplicates > 1 ? "s" : ""} skipped`,
					{ icon: "⚠️" },
				);
		},
		onError: () => toast.error("Import failed. Check your file and try again."),
	});

	const assignMutation = useMutation({
		mutationFn: ({ id, sid }: { id: string; sid: string }) =>
			attacheeApi.assignSupervisor(id, sid),
		onSuccess: () => {
			toast.success("Supervisor assigned");
			qc.invalidateQueries({ queryKey: ["users", "attachee"] });
			setAssignTarget(null);
		},
		onError: () => toast.error("Could not assign supervisor"),
	});

	const deassignMutation = useMutation({
		mutationFn: (id: string) => attacheeApi.deassignSupervisor(id),
		onSuccess: () => {
			toast.success("Supervisor removed");
			qc.invalidateQueries({ queryKey: ["users", "attachee"] });
			setAssignTarget(null);
		},
		onError: () => toast.error("Could not remove supervisor"),
	});

	const toggleMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			attacheeApi.toggleActive(id, isActive),
		onSuccess: (_, vars) => {
			toast.success(`Account ${vars.isActive ? "activated" : "deactivated"}`);
			qc.invalidateQueries({ queryKey: ["users", "attachee"] });
			setSelectedAttachee(null);
		},
		onError: () => toast.error("Could not update account status"),
	});

	// ── File pick handler ─────────────────────────────────────────────────────
	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0];
			if (!f) return;
			if (!/\.(csv|xlsx|xls)$/i.test(f.name)) {
				toast.error("Please upload a .csv or .xlsx file");
				return;
			}
			importMutation.mutate(f);
			e.target.value = "";
		},
		[importMutation],
	);

	// ── Stats ─────────────────────────────────────────────────────────────────
	const now = new Date();
	const thisMonthCount = (attachees as Attachee[]).filter((a) => {
		if (!a.date_joined) return false;
		const d = parseISO(a.date_joined);
		return (
			d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
		);
	}).length;

	const stats = [
		{
			label: "Total",
			value: (attachees as Attachee[]).length,
			color: "text-white",
		},
		{
			label: "Active",
			value: (attachees as Attachee[]).filter((a) => a.is_active).length,
			color: "text-green-400",
		},
		{
			label: "Inactive",
			value: (attachees as Attachee[]).filter((a) => !a.is_active).length,
			color: "text-red-400",
		},
		{ label: "This Month", value: thisMonthCount, color: "text-blue-400" },
	];

	return (
		<div className="space-y-6 animate-fade-in">
			{/* ── Header ── */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<GraduationCap size={22} className="text-Swahilipot-400" />
						Attachee Management
					</h1>
					<p className="page-subtitle">
						Placements, progress, and department assignments
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{canImport && (
						<>
							<button
								onClick={attacheeApi.downloadTemplate}
								className="btn-secondary btn-sm"
								title="Download import template">
								<Download size={13} /> Template
							</button>

							<button
								onClick={() => fileRef.current?.click()}
								disabled={importMutation.isPending}
								className="btn-secondary btn-sm">
								{importMutation.isPending ? (
									<Loader2 size={13} className="animate-spin" />
								) : (
									<Upload size={13} />
								)}
								{importMutation.isPending ? "Importing…" : "Import CSV / XLSX"}
							</button>
							<input
								ref={fileRef}
								type="file"
								accept=".csv,.xlsx,.xls"
								className="hidden"
								onChange={handleFileChange}
							/>
						</>
					)}
					{isAdmin && (
						<button className="btn-primary btn-sm">
							<UserPlus size={13} /> Add Attachee
						</button>
					)}
				</div>
			</div>

			{/* ── Stats ── */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{stats.map(({ label, value, color }) => (
=======
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
>>>>>>> origin/main
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

<<<<<<< HEAD
			{/* ── Filters ── */}
=======
			{/* Filters */}
>>>>>>> origin/main
			<div className="flex flex-wrap gap-3">
				<div className="relative flex-1 min-w-48">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
						placeholder="Search by name or email…"
=======
						placeholder="Search by name or email..."
>>>>>>> origin/main
						className="input pl-9 py-2"
					/>
				</div>
				<select
					value={deptFilter}
					onChange={(e) => setDeptFilter(e.target.value)}
					className="select-input w-44">
					<option value="">All Departments</option>
<<<<<<< HEAD
					{(departments as any[]).map((d) => (
=======
					{departments.map((d: any) => (
>>>>>>> origin/main
						<option key={d.id} value={d.id}>
							{d.name}
						</option>
					))}
				</select>
<<<<<<< HEAD
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as any)}
					className="select-input w-36">
					<option value="">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
				<button
					onClick={() => refetch()}
					className="btn-secondary btn-sm px-2.5"
					title="Refresh">
					<RefreshCw size={13} />
				</button>
			</div>

			{/* ── Table ── */}
=======
			</div>

			{/* Table */}
>>>>>>> origin/main
			<div className="card">
				<div className="overflow-x-auto">
					<table className="data-table">
						<thead>
							<tr>
								<th>Attachee</th>
								<th>Employee ID</th>
								<th>Department</th>
								<th>Branch</th>
<<<<<<< HEAD
								<th>Supervisor</th>
								<th>Status</th>
								<th>Date Joined</th>
								{canManage && <th>Actions</th>}
=======
								<th>Status</th>
								<th>Date Joined</th>
								{isAdmin && <th>Actions</th>}
>>>>>>> origin/main
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								[...Array(8)].map((_, i) => (
									<tr key={i}>
<<<<<<< HEAD
										<td colSpan={8}>
=======
										<td colSpan={7}>
>>>>>>> origin/main
											<div className="skeleton h-8 w-full my-1" />
										</td>
									</tr>
								))
<<<<<<< HEAD
							) : (attachees as Attachee[]).length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center py-12 text-slate-500">
=======
							) : attachees.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-12 text-slate-500">
>>>>>>> origin/main
										<GraduationCap
											size={28}
											className="mx-auto mb-2 opacity-30"
										/>
										No attachees found
									</td>
								</tr>
							) : (
<<<<<<< HEAD
								(attachees as Attachee[]).map((a) => (
									<tr key={a.id} className={clsx(!a.is_active && "opacity-50")}>
=======
								attachees.map((a: any) => (
									<tr key={a.id}>
>>>>>>> origin/main
										<td>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-gradient-Swahilipot flex items-center justify-center text-xs font-bold text-white shrink-0">
													{a.full_name
														?.split(" ")
<<<<<<< HEAD
														.map((n) => n[0])
=======
														.map((n: string) => n[0])
>>>>>>> origin/main
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
<<<<<<< HEAD
										<td className="text-slate-400 text-sm">
											{a.supervisor_name ? (
												<span className="flex items-center gap-1.5">
													<UserCheck size={11} className="text-blue-400" />
													{a.supervisor_name}
												</span>
											) : (
												<span className="text-slate-600 text-xs">
													Unassigned
												</span>
											)}
										</td>
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
										{canManage && (
											<td>
												<div className="flex items-center gap-1">
													{/* View */}
													<button
														onClick={() => setSelectedAttachee(a)}
														className="btn-ghost btn-sm p-1.5"
														title="View profile">
														<Eye size={13} />
													</button>

													{/* Assign supervisor (dept leader + admin) */}
													<button
														onClick={() => setAssignTarget(a)}
														className="btn-ghost btn-sm p-1.5"
														title="Assign supervisor">
														<UserCheck
															size={13}
															className={
																a.supervisor_user ? "text-blue-400" : ""
															}
														/>
													</button>

													{/* Toggle active */}
													<button
														onClick={() =>
															toggleMutation.mutate({
																id: a.id,
																isActive: !a.is_active,
															})
														}
														disabled={toggleMutation.isPending}
														className="btn-ghost btn-sm p-1.5"
														title={
															a.is_active
																? "Deactivate account"
																: "Activate account"
														}>
														{a.is_active ? (
															<ShieldOff size={13} className="text-red-400" />
														) : (
															<ShieldCheck
																size={13}
																className="text-green-400"
															/>
														)}
													</button>
												</div>
=======
										{isAdmin && (
											<td>
												<button
													onClick={() => setSelectedAttachee(a)}
													className="btn-ghost btn-sm p-1.5">
													<Eye size={13} />
												</button>
>>>>>>> origin/main
											</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

<<<<<<< HEAD
			{/* ── Detail panel ── */}
=======
			{/* Detail panel */}
>>>>>>> origin/main
			{selectedAttachee && (
				<div
					className="modal-backdrop"
					onClick={() => setSelectedAttachee(null)}>
					<div
						className="modal-box max-w-md"
						onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="font-semibold text-white">Attachee Profile</h3>
<<<<<<< HEAD
							<button
								onClick={() => setSelectedAttachee(null)}
								className="btn-ghost p-1.5">
								<X size={14} />
							</button>
=======
>>>>>>> origin/main
						</div>
						<div className="modal-body space-y-4">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-2xl bg-gradient-Swahilipot flex items-center justify-center text-xl font-bold text-white">
									{selectedAttachee.full_name
										?.split(" ")
<<<<<<< HEAD
										.map((n) => n[0])
=======
										.map((n: string) => n[0])
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
										"Supervisor",
										selectedAttachee.supervisor_name || "Unassigned",
									],
									[
=======
>>>>>>> origin/main
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
<<<<<<< HEAD

						<div className="modal-footer flex-wrap gap-2">
							<button
								onClick={() => setSelectedAttachee(null)}
								className="btn-secondary btn-sm">
								Close
							</button>
							{canManage && (
								<>
									<button
										onClick={() => {
											setAssignTarget(selectedAttachee);
											setSelectedAttachee(null);
										}}
										className="btn-secondary btn-sm">
										<UserCheck size={13} /> Supervisor
									</button>
									<button
										onClick={() =>
											toggleMutation.mutate({
												id: selectedAttachee.id,
												isActive: !selectedAttachee.is_active,
											})
										}
										disabled={toggleMutation.isPending}
										className={clsx(
											"btn-sm",
											selectedAttachee.is_active
												? "btn-secondary text-red-400"
												: "btn-primary",
										)}>
										{selectedAttachee.is_active ? (
											<>
												<ShieldOff size={13} /> Deactivate
											</>
										) : (
											<>
												<ShieldCheck size={13} /> Activate
											</>
										)}
									</button>
								</>
							)}
							<button className="btn-primary btn-sm ml-auto">
								<BarChart3 size={13} /> Progress
=======
						<div className="modal-footer">
							<button
								onClick={() => setSelectedAttachee(null)}
								className="btn-secondary">
								Close
							</button>
							<button className="btn-primary btn-sm">
								<BarChart3 size={13} /> View Progress
>>>>>>> origin/main
							</button>
						</div>
					</div>
				</div>
			)}
<<<<<<< HEAD

			{/* ── Import result modal ── */}
			{importResult && (
				<ImportResultPanel
					result={importResult}
					onClose={() => setImportResult(null)}
				/>
			)}

			{/* ── Assign supervisor modal ── */}
			{assignTarget && (
				<AssignSupervisorModal
					attachee={assignTarget}
					supervisors={supervisors}
					loading={assignMutation.isPending || deassignMutation.isPending}
					onClose={() => setAssignTarget(null)}
					onAssign={(sid) =>
						assignMutation.mutate({ id: assignTarget.id, sid })
					}
					onDeassign={() => deassignMutation.mutate(assignTarget.id)}
				/>
			)}
=======
>>>>>>> origin/main
		</div>
	);
}
