// NEXUS — Finance Department Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import {
	DollarSign,
	Plus,
	Download,
	TrendingUp,
	TrendingDown,
	CheckCircle,
	XCircle,
	Clock,
	BarChart3,
	RefreshCw,
	Filter,
} from "lucide-react";
import { financeApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
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
} from "recharts";
import toast from "react-hot-toast";
import clsx from "clsx";

const TABS = [
	"overview",
	"budgets",
	"expenses",
	"invoices",
	"stipends",
] as const;
type Tab = (typeof TABS)[number];

const TOOLTIP_STYLE = {
	contentStyle: {
		background: "#1e2538",
		border: "1px solid #252d42",
		borderRadius: 8,
		fontSize: 12,
	},
	labelStyle: { color: "#94a3b8" },
	itemStyle: { color: "#f1f5f9" },
};

export default function FinancePage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const [showCreateExpense, setShowCreateExpense] = useState(false);
	const [showCreateBudget, setShowCreateBudget] = useState(false);

	const { data: budgetsRaw } = useQuery({
		queryKey: ["budgets"],
		queryFn: () => financeApi.budgets().then((r) => r.data),
		refetchInterval: 120000,
	});
	const { data: expensesRaw } = useQuery({
		queryKey: ["expenses"],
		queryFn: () => financeApi.expenses().then((r) => r.data),
		refetchInterval: 60000,
	});
	const { data: invoicesRaw } = useQuery({
		queryKey: ["invoices"],
		queryFn: () => financeApi.invoices().then((r) => r.data),
		enabled: activeTab === "invoices",
	});
	const { data: stipendsRaw } = useQuery({
		queryKey: ["stipends"],
		queryFn: () => financeApi.stipends().then((r) => r.data),
		enabled: activeTab === "stipends",
	});
	const { data: cashFlowRaw } = useQuery({
		queryKey: ["cash-flow"],
		queryFn: () => financeApi.cashFlow().then((r) => r.data),
		enabled: activeTab === "overview",
	});

	const budgets = Array.isArray(budgetsRaw)
		? budgetsRaw
		: (budgetsRaw?.results ?? []);
	const expenses = Array.isArray(expensesRaw)
		? expensesRaw
		: (expensesRaw?.results ?? []);
	const invoices = Array.isArray(invoicesRaw)
		? invoicesRaw
		: (invoicesRaw?.results ?? []);
	const stipends = Array.isArray(stipendsRaw)
		? stipendsRaw
		: (stipendsRaw?.results ?? []);
	const cashFlow = Array.isArray(cashFlowRaw)
		? cashFlowRaw
		: (cashFlowRaw?.results ?? []);

	const approveExpenseMutation = useMutation({
		mutationFn: ({ id, action }: any) =>
			financeApi.approveExpense(id, { action }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["expenses"] });
			toast.success("Expense updated");
		},
		onError: () => toast.error("Action failed"),
	});

	const pendingExpenses = expenses.filter((e: any) => e.status === "pending");
	const approvedExpenses = expenses.filter((e: any) => e.status === "approved");
	const totalExpenses = expenses.reduce(
		(s: number, e: any) => s + parseFloat(e.amount || 0),
		0,
	);
	const totalBudget = budgets.reduce(
		(s: number, b: any) => s + parseFloat(b.total_amount || 0),
		0,
	);

	// Mock chart data if API returns nothing
	const chartData =
		cashFlow.length > 0
			? cashFlow
			: Array.from({ length: 12 }, (_, i) => ({
					month: [
						"Jan",
						"Feb",
						"Mar",
						"Apr",
						"May",
						"Jun",
						"Jul",
						"Aug",
						"Sep",
						"Oct",
						"Nov",
						"Dec",
					][i],
					income: Math.floor(Math.random() * 500000) + 200000,
					expenses: Math.floor(Math.random() * 300000) + 100000,
				}));

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<DollarSign size={22} className="text-nexus-400" /> Finance
						Department
					</h1>
					<p className="page-subtitle">
						Budgets · expenses · invoices · stipend management
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setShowCreateExpense(true)}
						className="btn-secondary btn-sm">
						<Plus size={13} /> Log Expense
					</button>
					<button
						onClick={() => setShowCreateBudget(true)}
						className="btn-primary btn-sm">
						<Plus size={13} /> New Budget
					</button>
				</div>
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
								label: "Total Budget",
								value: "KES " + totalBudget.toLocaleString(),
								color: "text-white",
								icon: DollarSign,
								up: true,
							},
							{
								label: "Total Expenses",
								value: "KES " + totalExpenses.toLocaleString(),
								color: "text-red-400",
								icon: TrendingDown,
								up: false,
							},
							{
								label: "Pending Approval",
								value: pendingExpenses.length + " expenses",
								color: "text-amber-400",
								icon: Clock,
								up: null,
							},
							{
								label: "Approved",
								value: approvedExpenses.length + " expenses",
								color: "text-green-400",
								icon: CheckCircle,
								up: true,
							},
						].map(({ label, value, color, icon: Icon }) => (
							<div key={label} className="stat-card">
								<Icon size={18} className={color} />
								<div className={clsx("text-xl font-bold", color)}>{value}</div>
								<div className="stat-label">{label}</div>
							</div>
						))}
					</div>

					{/* Cash flow chart */}
					<div className="card">
						<div className="flex items-center justify-between mb-5">
							<h3 className="font-semibold text-white">
								Cash Flow — 12 Months
							</h3>
							<button className="btn-secondary btn-sm">
								<Download size={13} /> Export
							</button>
						</div>
						<ResponsiveContainer width="100%" height={220}>
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
								<XAxis
									dataKey="month"
									tick={{ fill: "#64748b", fontSize: 10 }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fill: "#64748b", fontSize: 10 }}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip {...TOOLTIP_STYLE} />
								<Area
									type="monotone"
									dataKey="income"
									stroke="#22c55e"
									fill="url(#incGrad)"
									strokeWidth={2}
									name="Income"
								/>
								<Area
									type="monotone"
									dataKey="expenses"
									stroke="#ef4444"
									fill="url(#expGrad)"
									strokeWidth={2}
									name="Expenses"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					{/* Recent expenses */}
					<div className="card">
						<h3 className="font-semibold text-white mb-4">Recent Expenses</h3>
						<ExpensesTable
							expenses={expenses.slice(0, 8)}
							onAction={approveExpenseMutation.mutate}
							isAdmin={true}
						/>
					</div>
				</div>
			)}

			{/* ── BUDGETS ── */}
			{activeTab === "budgets" && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{budgets.length === 0 ? (
							<div className="col-span-3 card text-center py-12 text-slate-500">
								<DollarSign size={32} className="mx-auto mb-3 opacity-30" />
								No budgets created yet
							</div>
						) : (
							budgets.map((b: any) => {
								const used = parseFloat(b.used_amount || 0);
								const total = parseFloat(b.total_amount || 1);
								const pct = Math.min(100, Math.round((used / total) * 100));
								const isOver = used > total;
								return (
									<div
										key={b.id}
										className={clsx("card", isOver && "border-red-500/30")}>
										<div className="flex items-start justify-between mb-2">
											<div>
												<h3 className="font-semibold text-white text-sm">
													{b.name || b.title}
												</h3>
												<p className="text-xs text-slate-500">
													{b.department_name || b.period || "—"}
												</p>
											</div>
											{isOver && (
												<span className="badge-red text-[10px]">
													Over Budget
												</span>
											)}
										</div>
										<div className="flex items-center justify-between mb-2 text-sm">
											<span className="text-slate-400">
												KES {used.toLocaleString()}
											</span>
											<span className="text-white font-medium">
												KES {total.toLocaleString()}
											</span>
										</div>
										<div className="h-2 bg-surface-elevated rounded-full overflow-hidden mb-1">
											<div
												className={clsx("h-full rounded-full transition-all", {
													"bg-green-500": pct < 70,
													"bg-amber-500": pct >= 70 && pct < 90,
													"bg-red-500": pct >= 90,
												})}
												style={{ width: pct + "%" }}
											/>
										</div>
										<p className="text-xs text-slate-500">{pct}% utilised</p>
									</div>
								);
							})
						)}
					</div>
				</div>
			)}

			{/* ── EXPENSES ── */}
			{activeTab === "expenses" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">All Expenses</h3>
						<div className="flex gap-2">
							<button className="btn-secondary btn-sm">
								<Download size={13} /> Export CSV
							</button>
							<button
								onClick={() => setShowCreateExpense(true)}
								className="btn-primary btn-sm">
								<Plus size={13} /> Log Expense
							</button>
						</div>
					</div>
					<ExpensesTable
						expenses={expenses}
						onAction={approveExpenseMutation.mutate}
						isAdmin={true}
					/>
				</div>
			)}

			{/* ── INVOICES ── */}
			{activeTab === "invoices" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Invoices</h3>
						<button className="btn-primary btn-sm">
							<Plus size={13} /> New Invoice
						</button>
					</div>
					{invoices.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							No invoices yet
						</div>
					) : (
						<table className="data-table">
							<thead>
								<tr>
									<th>Invoice #</th>
									<th>Vendor</th>
									<th>Amount</th>
									<th>Due Date</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((inv: any) => (
									<tr key={inv.id}>
										<td className="font-mono text-xs text-nexus-400">
											{inv.invoice_number || inv.id?.slice(0, 8)}
										</td>
										<td className="text-white font-medium text-sm">
											{inv.vendor}
										</td>
										<td className="text-white font-medium">
											KES {parseFloat(inv.amount || 0).toLocaleString()}
										</td>
										<td className="text-slate-400 text-xs">
											{inv.due_date
												? format(parseISO(inv.due_date), "dd MMM yyyy")
												: "—"}
										</td>
										<td>
											<span
												className={clsx("badge text-[10px]", {
													"badge-amber": inv.status === "pending",
													"badge-green": inv.status === "paid",
													"badge-red": inv.status === "overdue",
												})}>
												{inv.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			)}

			{/* ── STIPENDS ── */}
			{activeTab === "stipends" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">
							Internship Stipend Management
						</h3>
						<button className="btn-primary btn-sm">
							<Plus size={13} /> Add Stipend
						</button>
					</div>
					{stipends.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							No stipend records yet
						</div>
					) : (
						<table className="data-table">
							<thead>
								<tr>
									<th>Attachee</th>
									<th>Amount</th>
									<th>Period</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{stipends.map((s: any) => (
									<tr key={s.id}>
										<td className="font-medium text-white text-sm">
											{s.attachee_name || "—"}
										</td>
										<td className="text-white font-medium">
											KES {parseFloat(s.amount || 0).toLocaleString()}
										</td>
										<td className="text-slate-400 text-xs">
											{s.period || "—"}
										</td>
										<td>
											<span
												className={clsx("badge text-[10px]", {
													"badge-amber": s.status === "pending",
													"badge-green": s.status === "paid",
													"badge-blue": s.status === "approved",
												})}>
												{s.status}
											</span>
										</td>
										<td>
											<button className="btn-secondary btn-sm text-xs">
												Process
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			)}

			{/* Create Expense Modal */}
			{showCreateExpense && (
				<ExpenseModal
					onClose={() => setShowCreateExpense(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["expenses"] });
						setShowCreateExpense(false);
					}}
				/>
			)}

			{/* Create Budget Modal */}
			{showCreateBudget && (
				<BudgetModal
					onClose={() => setShowCreateBudget(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["budgets"] });
						setShowCreateBudget(false);
					}}
				/>
			)}
		</div>
	);
}

function ExpensesTable({ expenses, onAction, isAdmin }: any) {
	if (expenses.length === 0) {
		return (
			<div className="text-center py-10 text-slate-500">No expenses found</div>
		);
	}
	return (
		<table className="data-table">
			<thead>
				<tr>
					<th>Title</th>
					<th>Amount</th>
					<th>Category</th>
					<th>Submitted By</th>
					<th>Date</th>
					<th>Status</th>
					{isAdmin && <th>Actions</th>}
				</tr>
			</thead>
			<tbody>
				{expenses.map((exp: any) => (
					<tr key={exp.id}>
						<td className="font-medium text-white text-sm">
							{exp.title || exp.description}
						</td>
						<td className="text-white font-medium">
							KES {parseFloat(exp.amount || 0).toLocaleString()}
						</td>
						<td className="text-slate-400 text-sm capitalize">
							{exp.category?.replace("_", " ") || "—"}
						</td>
						<td className="text-slate-400 text-sm">
							{exp.submitted_by_name || "—"}
						</td>
						<td className="text-slate-400 text-xs">
							{exp.created_at
								? format(parseISO(exp.created_at), "dd MMM yyyy")
								: "—"}
						</td>
						<td>
							<span
								className={clsx("badge text-[10px]", {
									"badge-amber": exp.status === "pending",
									"badge-green": exp.status === "approved",
									"badge-red": exp.status === "rejected",
									"badge-blue": exp.status === "paid",
								})}>
								{exp.status}
							</span>
						</td>
						{isAdmin && (
							<td>
								{exp.status === "pending" && (
									<div className="flex gap-1.5">
										<button
											onClick={() =>
												onAction({ id: exp.id, action: "approve" })
											}
											className="btn-success btn-sm p-1.5">
											<CheckCircle size={12} />
										</button>
										<button
											onClick={() => onAction({ id: exp.id, action: "reject" })}
											className="btn-danger btn-sm p-1.5">
											<XCircle size={12} />
										</button>
									</div>
								)}
							</td>
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function ExpenseModal({ onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm();
	const mutation = useMutation({
		mutationFn: (data: any) => financeApi.submitExpense(data),
		onSuccess: () => {
			toast.success("Expense submitted");
			onSuccess();
		},
		onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
	});
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Log Expense</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="input-group">
							<label className="input-label">Title *</label>
							<input
								{...register("title", { required: true })}
								className="input"
								placeholder="Expense description"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Amount (KES) *</label>
								<input
									type="number"
									{...register("amount", { required: true })}
									className="input"
								/>
							</div>
							<div className="input-group">
								<label className="input-label">Category</label>
								<select {...register("category")} className="select-input">
									<option value="transport">Transport</option>
									<option value="meals">Meals</option>
									<option value="accommodation">Accommodation</option>
									<option value="supplies">Supplies</option>
									<option value="equipment">Equipment</option>
									<option value="other">Other</option>
								</select>
							</div>
						</div>
						<div className="input-group">
							<label className="input-label">Description</label>
							<textarea
								{...register("description")}
								rows={3}
								className="textarea"
							/>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className="btn-primary">
							{mutation.isPending ? "Submitting..." : "Submit Expense"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function BudgetModal({ onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm();
	const mutation = useMutation({
		mutationFn: (data: any) => financeApi.createBudget(data),
		onSuccess: () => {
			toast.success("Budget created");
			onSuccess();
		},
		onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
	});
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Create Budget</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="input-group">
							<label className="input-label">Budget Name *</label>
							<input
								{...register("name", { required: true })}
								className="input"
								placeholder="e.g. Q3 2025 Broadcast Budget"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Total Amount (KES) *</label>
								<input
									type="number"
									{...register("total_amount", { required: true })}
									className="input"
								/>
							</div>
							<div className="input-group">
								<label className="input-label">Period</label>
								<input
									{...register("period")}
									className="input"
									placeholder="Q3 2025"
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Start Date</label>
								<input
									type="date"
									{...register("start_date")}
									className="input"
								/>
							</div>
							<div className="input-group">
								<label className="input-label">End Date</label>
								<input
									type="date"
									{...register("end_date")}
									className="input"
								/>
							</div>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className="btn-primary">
							{mutation.isPending ? "Creating..." : "Create Budget"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
