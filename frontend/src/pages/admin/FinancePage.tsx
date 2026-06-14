// NEXUS — Finance Department Page (Comprehensive)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format, parseISO, isPast } from "date-fns";
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
  FileText,
  CreditCard,
  ShoppingCart,
  Users,
  Briefcase,
  AlertTriangle,
  Send,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  PiggyBank,
  Activity,
} from "lucide-react";
import { financeApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import clsx from "clsx";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  "overview",
  "budgets",
  "expenses",
  "invoices",
  "payroll",
  "petty-cash",
  "purchase-orders",
  "payments",
  "reports",
  "stipends",
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  budgets: "Budgets",
  expenses: "Expenses",
  invoices: "Invoices",
  payroll: "Payroll",
  "petty-cash": "Petty Cash",
  "purchase-orders": "Purchase Orders",
  payments: "Payments",
  reports: "Reports",
  stipends: "Stipends",
};

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

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: any) {
  return "KES " + parseFloat(amount || 0).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-amber",
    approved: "badge-green",
    rejected: "badge-red",
    paid: "badge-blue",
    overdue: "badge-red",
    draft: "badge-slate",
    sent: "badge-blue",
    active: "badge-green",
    processed: "badge-green",
    cancelled: "badge-red",
    partial: "badge-amber",
    open: "badge-amber",
    closed: "badge-slate",
    submitted: "badge-amber",
    disbursed: "badge-green",
  };
  return (
    <span className={clsx("badge text-[10px] capitalize", map[status] ?? "badge-slate")}>
      {status?.replace("_", " ")}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Modal state
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreatePettyCash, setShowCreatePettyCash] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showCreateStipend, setShowCreateStipend] = useState(false);
  const [showProcessPayroll, setShowProcessPayroll] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: budgetsRaw, isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => financeApi.budgets().then((r) => r.data),
    refetchInterval: 120000,
  });
  const { data: expensesRaw, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => financeApi.expenses().then((r) => r.data),
    refetchInterval: 60000,
  });
  const { data: invoicesRaw } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => financeApi.invoices().then((r) => r.data),
    enabled: activeTab === "invoices" || activeTab === "overview",
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
  const { data: payrollRaw } = useQuery({
    queryKey: ["payroll"],
    queryFn: () => financeApi.payroll().then((r) => r.data),
    enabled: activeTab === "payroll",
  });
  const { data: pettyCashRaw } = useQuery({
    queryKey: ["petty-cash"],
    queryFn: () => financeApi.pettyCash().then((r) => r.data),
    enabled: activeTab === "petty-cash",
  });
  const { data: purchaseOrdersRaw } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => financeApi.purchaseOrders().then((r) => r.data),
    enabled: activeTab === "purchase-orders",
  });
  const { data: paymentsRaw } = useQuery({
    queryKey: ["payments"],
    queryFn: () => financeApi.payments().then((r) => r.data),
    enabled: activeTab === "payments",
  });
  const { data: reportsRaw } = useQuery({
    queryKey: ["financial-reports"],
    queryFn: () => financeApi.reports().then((r) => r.data),
    enabled: activeTab === "reports",
  });
  const { data: expenseCategoriesRaw } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => financeApi.expenseCategories().then((r) => r.data),
    enabled: activeTab === "overview",
  });

  // Normalise all arrays
  const arr = (raw: any) =>
    Array.isArray(raw) ? raw : (raw?.results ?? []);
  const budgets = arr(budgetsRaw);
  const expenses = arr(expensesRaw);
  const invoices = arr(invoicesRaw);
  const stipends = arr(stipendsRaw);
  const cashFlow = arr(cashFlowRaw);
  const payroll = arr(payrollRaw);
  const pettyCash = arr(pettyCashRaw);
  const purchaseOrders = arr(purchaseOrdersRaw);
  const payments = arr(paymentsRaw);
  const reports = arr(reportsRaw);
  const expenseCategories = arr(expenseCategoriesRaw);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const approveExpenseMutation = useMutation({
    mutationFn: ({ id, action }: any) => financeApi.approveExpense(id, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense updated"); },
    onError: () => toast.error("Action failed"),
  });

  const approveInvoiceMutation = useMutation({
    mutationFn: ({ id, action }: any) => financeApi.approveInvoice(id, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice updated"); },
    onError: () => toast.error("Action failed"),
  });

  const approvePOMutation = useMutation({
    mutationFn: ({ id, action }: any) => financeApi.approvePurchaseOrder(id, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); toast.success("Purchase order updated"); },
    onError: () => toast.error("Action failed"),
  });

  const processStipendMutation = useMutation({
    mutationFn: (id: string) => financeApi.processStipend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stipends"] }); toast.success("Stipend processed"); },
    onError: () => toast.error("Failed to process stipend"),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => financeApi.deletePayment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment deleted"); },
    onError: () => toast.error("Failed to delete payment"),
  });

  // ── Derived Stats ────────────────────────────────────────────────────────────

  const pendingExpenses = expenses.filter((e: any) => e.status === "pending");
  const approvedExpenses = expenses.filter((e: any) => e.status === "approved");
  const totalExpenses = expenses.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0);
  const totalBudget = budgets.reduce((s: number, b: any) => s + parseFloat(b.total_amount || 0), 0);
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
  const totalPayroll = payroll.reduce((s: number, p: any) => s + parseFloat(p.net_pay || p.amount || 0), 0);
  const totalPayments = payments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
  const pendingPOs = purchaseOrders.filter((po: any) => po.status === "pending");

  // Fallback chart data
  const chartData =
    cashFlow.length > 0
      ? cashFlow
      : Array.from({ length: 12 }, (_, i) => ({
          month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
          income: Math.floor(Math.random() * 500000) + 200000,
          expenses: Math.floor(Math.random() * 300000) + 100000,
        }));

  // Category pie data
  const pieData =
    expenseCategories.length > 0
      ? expenseCategories
      : Object.entries(
          expenses.reduce((acc: Record<string, number>, e: any) => {
            const cat = e.category?.replace("_", " ") || "other";
            acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
            return acc;
          }, {})
        ).map(([name, value]) => ({ name, value }));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <DollarSign size={22} className="text-nexus-400" /> Finance Department
          </h1>
          <p className="page-subtitle">
            Budgets · Expenses · Invoices · Payroll · Petty Cash · Purchase Orders · Payments · Reports
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowCreateExpense(true)} className="btn-secondary btn-sm">
            <Plus size={13} /> Log Expense
          </button>
          <button onClick={() => setShowCreateBudget(true)} className="btn-primary btn-sm">
            <Plus size={13} /> New Budget
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-all",
              {
                "bg-nexus-600 text-white": activeTab === tab,
                "text-slate-400 hover:text-white": activeTab !== tab,
              }
            )}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Budget", value: fmt(totalBudget), color: "text-white", icon: DollarSign },
              { label: "Total Expenses", value: fmt(totalExpenses), color: "text-red-400", icon: TrendingDown },
              { label: "Pending Approval", value: pendingExpenses.length + " expenses", color: "text-amber-400", icon: Clock },
              { label: "Approved", value: approvedExpenses.length + " expenses", color: "text-green-400", icon: CheckCircle },
              { label: "Total Payroll", value: fmt(totalPayroll), color: "text-indigo-400", icon: Users },
              { label: "Overdue Invoices", value: overdueInvoices.length + " invoices", color: "text-red-400", icon: AlertTriangle },
              { label: "Pending POs", value: pendingPOs.length + " orders", color: "text-amber-400", icon: ShoppingCart },
              { label: "Payments Out", value: fmt(totalPayments), color: "text-blue-400", icon: CreditCard },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="stat-card">
                <Icon size={18} className={color} />
                <div className={clsx("text-xl font-bold", color)}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cash Flow */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white">Cash Flow — 12 Months</h3>
                <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
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
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incGrad)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Expense breakdown pie */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Expense Breakdown</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_: any, index: number) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => fmt(v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Budget utilisation bar chart */}
          {budgets.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Budget Utilisation</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={budgets.slice(0, 8).map((b: any) => ({
                  name: (b.name || b.title || "").slice(0, 16),
                  used: parseFloat(b.used_amount || 0),
                  remaining: Math.max(0, parseFloat(b.total_amount || 0) - parseFloat(b.used_amount || 0)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252d42" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="used" stackId="a" fill="#ef4444" name="Used" />
                  <Bar dataKey="remaining" stackId="a" fill="#22c55e" name="Remaining" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Expenses */}
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">All Budgets</h3>
            <button onClick={() => setShowCreateBudget(true)} className="btn-primary btn-sm">
              <Plus size={13} /> New Budget
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.length === 0 ? (
              <div className="col-span-3 card text-center py-12 text-slate-500">
                <DollarSign size={32} className="mx-auto mb-3 opacity-30" /> No budgets created yet
              </div>
            ) : (
              budgets.map((b: any) => {
                const used = parseFloat(b.used_amount || 0);
                const total = parseFloat(b.total_amount || 1);
                const pct = Math.min(100, Math.round((used / total) * 100));
                const isOver = used > total;
                return (
                  <div key={b.id} className={clsx("card", isOver && "border-red-500/30")}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{b.name || b.title}</h3>
                        <p className="text-xs text-slate-500">{b.department_name || b.period || "—"}</p>
                      </div>
                      {isOver && <span className="badge-red text-[10px]">Over Budget</span>}
                    </div>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-slate-400">{fmt(used)}</span>
                      <span className="text-white font-medium">{fmt(total)}</span>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">{pct}% utilised</p>
                      {b.start_date && b.end_date && (
                        <p className="text-xs text-slate-600">
                          {format(parseISO(b.start_date), "dd MMM")} – {format(parseISO(b.end_date), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
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
              <button className="btn-secondary btn-sm"><Download size={13} /> Export CSV</button>
              <button onClick={() => setShowCreateExpense(true)} className="btn-primary btn-sm">
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
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowCreateInvoice(true)} className="btn-primary btn-sm">
                <Plus size={13} /> New Invoice
              </button>
            </div>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText size={32} className="mx-auto mb-3 opacity-30" /> No invoices yet
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Vendor / Client</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const isOverdue = inv.due_date && isPast(parseISO(inv.due_date)) && inv.status !== "paid";
                  return (
                    <tr key={inv.id} className={clsx(isOverdue && "bg-red-500/5")}>
                      <td className="font-mono text-xs text-nexus-400">{inv.invoice_number || inv.id?.slice(0, 8)}</td>
                      <td className="text-white font-medium text-sm">{inv.vendor || inv.client || "—"}</td>
                      <td className="text-white font-medium">{fmt(inv.amount)}</td>
                      <td className="text-slate-400 text-xs">
                        {inv.issue_date ? format(parseISO(inv.issue_date), "dd MMM yyyy") : "—"}
                      </td>
                      <td className={clsx("text-xs", isOverdue ? "text-red-400 font-medium" : "text-slate-400")}>
                        {inv.due_date ? format(parseISO(inv.due_date), "dd MMM yyyy") : "—"}
                        {isOverdue && " ⚠"}
                      </td>
                      <td><StatusBadge status={isOverdue && inv.status !== "paid" ? "overdue" : inv.status} /></td>
                      <td>
                        <div className="flex gap-1.5">
                          {inv.status === "pending" && (
                            <>
                              <button onClick={() => approveInvoiceMutation.mutate({ id: inv.id, action: "approve" })} className="btn-success btn-sm p-1.5" title="Approve"><CheckCircle size={12} /></button>
                              <button onClick={() => approveInvoiceMutation.mutate({ id: inv.id, action: "reject" })} className="btn-danger btn-sm p-1.5" title="Reject"><XCircle size={12} /></button>
                            </>
                          )}
                          {inv.status === "approved" && (
                            <button onClick={() => approveInvoiceMutation.mutate({ id: inv.id, action: "mark_paid" })} className="btn-secondary btn-sm text-xs">Mark Paid</button>
                          )}
                          <button onClick={() => setSelectedItem({ type: "invoice", data: inv })} className="btn-secondary btn-sm p-1.5" title="View"><Eye size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PAYROLL ── */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Payroll Management</h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowProcessPayroll(true)} className="btn-primary btn-sm">
                <RefreshCw size={13} /> Process Payroll
              </button>
            </div>
          </div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Gross Pay", value: fmt(payroll.reduce((s: number, p: any) => s + parseFloat(p.gross_pay || p.amount || 0), 0)), color: "text-white" },
              { label: "Total Deductions", value: fmt(payroll.reduce((s: number, p: any) => s + parseFloat(p.deductions || 0), 0)), color: "text-red-400" },
              { label: "Total Net Pay", value: fmt(totalPayroll), color: "text-green-400" },
              { label: "Staff Count", value: payroll.length + " employees", color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className={clsx("text-xl font-bold", color)}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
          {payroll.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <Users size={32} className="mx-auto mb-3 opacity-30" /> No payroll records found
            </div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Period</th>
                    <th>Gross Pay</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-medium text-white text-sm">{p.employee_name || "—"}</td>
                      <td className="text-slate-400 text-sm">{p.department || "—"}</td>
                      <td className="text-slate-400 text-xs">{p.period || "—"}</td>
                      <td className="text-white">{fmt(p.gross_pay || p.amount)}</td>
                      <td className="text-red-400">{fmt(p.deductions)}</td>
                      <td className="text-green-400 font-medium">{fmt(p.net_pay)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <button className="btn-secondary btn-sm text-xs">
                          <Download size={11} /> Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PETTY CASH ── */}
      {activeTab === "petty-cash" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Petty Cash Management</h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowCreatePettyCash(true)} className="btn-primary btn-sm">
                <Plus size={13} /> New Request
              </button>
            </div>
          </div>
          {/* Fund summary */}
          {pettyCashRaw?.fund && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="stat-card">
                <PiggyBank size={18} className="text-nexus-400" />
                <div className="text-xl font-bold text-white">{fmt(pettyCashRaw.fund?.opening_balance)}</div>
                <div className="stat-label">Opening Balance</div>
              </div>
              <div className="stat-card">
                <TrendingDown size={18} className="text-red-400" />
                <div className="text-xl font-bold text-red-400">{fmt(pettyCashRaw.fund?.total_disbursed)}</div>
                <div className="stat-label">Total Disbursed</div>
              </div>
              <div className="stat-card">
                <DollarSign size={18} className="text-green-400" />
                <div className="text-xl font-bold text-green-400">{fmt(pettyCashRaw.fund?.closing_balance)}</div>
                <div className="stat-label">Closing Balance</div>
              </div>
            </div>
          )}
          {pettyCash.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <Receipt size={32} className="mx-auto mb-3 opacity-30" /> No petty cash records
            </div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Requested By</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Receipt #</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyCash.map((pc: any) => (
                    <tr key={pc.id}>
                      <td className="font-medium text-white text-sm">{pc.description || "—"}</td>
                      <td className="text-slate-400 text-sm">{pc.requested_by_name || "—"}</td>
                      <td className="text-white font-medium">{fmt(pc.amount)}</td>
                      <td className="text-slate-400 text-xs">
                        {pc.date ? format(parseISO(pc.date), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="text-slate-400 text-xs font-mono">{pc.receipt_number || "—"}</td>
                      <td><StatusBadge status={pc.status} /></td>
                      <td>
                        {pc.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button onClick={() => financeApi.approvePettyCash(pc.id, { action: "approve" }).then(() => { qc.invalidateQueries({ queryKey: ["petty-cash"] }); toast.success("Approved"); })} className="btn-success btn-sm p-1.5"><CheckCircle size={12} /></button>
                            <button onClick={() => financeApi.approvePettyCash(pc.id, { action: "reject" }).then(() => { qc.invalidateQueries({ queryKey: ["petty-cash"] }); toast.success("Rejected"); })} className="btn-danger btn-sm p-1.5"><XCircle size={12} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PURCHASE ORDERS ── */}
      {activeTab === "purchase-orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Purchase Orders</h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowCreatePO(true)} className="btn-primary btn-sm">
                <Plus size={13} /> New PO
              </button>
            </div>
          </div>
          {purchaseOrders.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" /> No purchase orders yet
            </div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Requested By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po: any) => (
                    <tr key={po.id}>
                      <td className="font-mono text-xs text-nexus-400">{po.po_number || po.id?.slice(0, 8)}</td>
                      <td className="text-white font-medium text-sm">{po.supplier || "—"}</td>
                      <td className="text-slate-400 text-sm">{po.description || "—"}</td>
                      <td className="text-white font-medium">{fmt(po.amount)}</td>
                      <td className="text-slate-400 text-sm">{po.requested_by_name || "—"}</td>
                      <td className="text-slate-400 text-xs">
                        {po.created_at ? format(parseISO(po.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td><StatusBadge status={po.status} /></td>
                      <td>
                        {po.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button onClick={() => approvePOMutation.mutate({ id: po.id, action: "approve" })} className="btn-success btn-sm p-1.5"><CheckCircle size={12} /></button>
                            <button onClick={() => approvePOMutation.mutate({ id: po.id, action: "reject" })} className="btn-danger btn-sm p-1.5"><XCircle size={12} /></button>
                          </div>
                        )}
                        <button onClick={() => setSelectedItem({ type: "po", data: po })} className="btn-secondary btn-sm p-1.5 ml-1"><Eye size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Payments</h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowCreatePayment(true)} className="btn-primary btn-sm">
                <Plus size={13} /> Record Payment
              </button>
            </div>
          </div>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Outgoing", value: fmt(payments.filter((p: any) => p.type === "outgoing" || !p.type).reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0)), color: "text-red-400" },
              { label: "Total Incoming", value: fmt(payments.filter((p: any) => p.type === "incoming").reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0)), color: "text-green-400" },
              { label: "M-Pesa Payments", value: payments.filter((p: any) => p.method === "mpesa").length, color: "text-green-400" },
              { label: "Bank Transfers", value: payments.filter((p: any) => p.method === "bank_transfer").length, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className={clsx("text-xl font-bold", color)}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
          {payments.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <CreditCard size={32} className="mx-auto mb-3 opacity-30" /> No payment records yet
            </div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Payee / Payer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-nexus-400">{p.reference || p.id?.slice(0, 8)}</td>
                      <td className="text-white font-medium text-sm">{p.payee || p.payer || "—"}</td>
                      <td className={clsx("font-medium", p.type === "incoming" ? "text-green-400" : "text-red-400")}>
                        {p.type === "incoming" ? "+" : "-"}{fmt(p.amount)}
                      </td>
                      <td className="text-slate-400 text-sm capitalize">{p.method?.replace("_", " ") || "—"}</td>
                      <td><StatusBadge status={p.type || "outgoing"} /></td>
                      <td className="text-slate-400 text-xs">
                        {p.payment_date ? format(parseISO(p.payment_date), "dd MMM yyyy") : "—"}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <button onClick={() => deletePaymentMutation.mutate(p.id)} className="btn-danger btn-sm p-1.5" title="Delete"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Financial Reports & Audit Logs</h3>
            <button className="btn-primary btn-sm"><Plus size={13} /> Generate Report</button>
          </div>
          {/* Quick generate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Income Statement", icon: TrendingUp, action: "income_statement" },
              { label: "Balance Sheet", icon: BarChart3, action: "balance_sheet" },
              { label: "Cash Flow Report", icon: Activity, action: "cash_flow" },
              { label: "Expense Report", icon: Receipt, action: "expense_report" },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={action}
                onClick={() => financeApi.generateReport({ type: action }).then(() => toast.success(label + " generated")).catch(() => toast.error("Generation failed"))}
                className="card hover:border-nexus-500/50 transition-all text-left cursor-pointer">
                <Icon size={22} className="text-nexus-400 mb-2" />
                <div className="font-medium text-white text-sm">{label}</div>
                <div className="text-xs text-slate-500 mt-1">Click to generate</div>
              </button>
            ))}
          </div>
          {reports.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <FileText size={32} className="mx-auto mb-3 opacity-30" /> No reports generated yet
            </div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Generated By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any) => (
                    <tr key={r.id}>
                      <td className="font-medium text-white text-sm">{r.name || r.title || "—"}</td>
                      <td className="text-slate-400 text-sm capitalize">{r.type?.replace("_", " ") || "—"}</td>
                      <td className="text-slate-400 text-xs">{r.period || "—"}</td>
                      <td className="text-slate-400 text-sm">{r.generated_by_name || "—"}</td>
                      <td className="text-slate-400 text-xs">
                        {r.created_at ? format(parseISO(r.created_at), "dd MMM yyyy HH:mm") : "—"}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <button onClick={() => window.open(r.file_url, "_blank")} className="btn-secondary btn-sm text-xs"><Download size={11} /> Download</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STIPENDS ── */}
      {activeTab === "stipends" && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Internship Stipend Management</h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={13} /> Export</button>
              <button onClick={() => setShowCreateStipend(true)} className="btn-primary btn-sm">
                <Plus size={13} /> Add Stipend
              </button>
            </div>
          </div>
          {stipends.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" /> No stipend records yet
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attachee</th>
                  <th>Department</th>
                  <th>Amount</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stipends.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium text-white text-sm">{s.attachee_name || "—"}</td>
                    <td className="text-slate-400 text-sm">{s.department || "—"}</td>
                    <td className="text-white font-medium">{fmt(s.amount)}</td>
                    <td className="text-slate-400 text-xs">{s.period || "—"}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        {(s.status === "pending" || s.status === "approved") && (
                          <button onClick={() => processStipendMutation.mutate(s.id)} className="btn-primary btn-sm text-xs">
                            <Send size={11} /> Process
                          </button>
                        )}
                        <button onClick={() => setSelectedItem({ type: "stipend", data: s })} className="btn-secondary btn-sm p-1.5"><Eye size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateExpense && (
        <ExpenseModal
          onClose={() => setShowCreateExpense(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["expenses"] }); setShowCreateExpense(false); }}
        />
      )}
      {showCreateBudget && (
        <BudgetModal
          onClose={() => setShowCreateBudget(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["budgets"] }); setShowCreateBudget(false); }}
        />
      )}
      {showCreateInvoice && (
        <InvoiceModal
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["invoices"] }); setShowCreateInvoice(false); }}
        />
      )}
      {showCreatePO && (
        <PurchaseOrderModal
          onClose={() => setShowCreatePO(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); setShowCreatePO(false); }}
        />
      )}
      {showCreatePettyCash && (
        <PettyCashModal
          onClose={() => setShowCreatePettyCash(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["petty-cash"] }); setShowCreatePettyCash(false); }}
        />
      )}
      {showCreatePayment && (
        <PaymentModal
          onClose={() => setShowCreatePayment(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["payments"] }); setShowCreatePayment(false); }}
        />
      )}
      {showCreateStipend && (
        <StipendModal
          onClose={() => setShowCreateStipend(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["stipends"] }); setShowCreateStipend(false); }}
        />
      )}
      {showProcessPayroll && (
        <PayrollModal
          onClose={() => setShowProcessPayroll(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["payroll"] }); setShowProcessPayroll(false); }}
        />
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function ExpensesTable({ expenses, onAction, isAdmin }: any) {
  if (expenses.length === 0) {
    return <div className="text-center py-10 text-slate-500">No expenses found</div>;
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
            <td className="font-medium text-white text-sm">{exp.title || exp.description}</td>
            <td className="text-white font-medium">{fmt(exp.amount)}</td>
            <td className="text-slate-400 text-sm capitalize">{exp.category?.replace("_", " ") || "—"}</td>
            <td className="text-slate-400 text-sm">{exp.submitted_by_name || "—"}</td>
            <td className="text-slate-400 text-xs">
              {exp.created_at ? format(parseISO(exp.created_at), "dd MMM yyyy") : "—"}
            </td>
            <td><StatusBadge status={exp.status} /></td>
            {isAdmin && (
              <td>
                {exp.status === "pending" && (
                  <div className="flex gap-1.5">
                    <button onClick={() => onAction({ id: exp.id, action: "approve" })} className="btn-success btn-sm p-1.5"><CheckCircle size={12} /></button>
                    <button onClick={() => onAction({ id: exp.id, action: "reject" })} className="btn-danger btn-sm p-1.5"><XCircle size={12} /></button>
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

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Expense Modal ────────────────────────────────────────────────────────────

function ExpenseModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.submitExpense(data),
    onSuccess: () => { toast.success("Expense submitted"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Log Expense" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input {...register("title", { required: true })} className="input" placeholder="Expense description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select {...register("category")} className="select-input">
                <option value="transport">Transport</option>
                <option value="meals">Meals</option>
                <option value="accommodation">Accommodation</option>
                <option value="supplies">Supplies</option>
                <option value="equipment">Equipment</option>
                <option value="utilities">Utilities</option>
                <option value="maintenance">Maintenance</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Budget (optional)</label>
            <input {...register("budget")} className="input" placeholder="Budget ID or name" />
          </div>
          <div className="input-group">
            <label className="input-label">Receipt Date</label>
            <input type="date" {...register("receipt_date")} className="input" />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea {...register("description")} rows={3} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Submitting..." : "Submit Expense"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────

function BudgetModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createBudget(data),
    onSuccess: () => { toast.success("Budget created"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Create Budget" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="input-group">
            <label className="input-label">Budget Name *</label>
            <input {...register("name", { required: true })} className="input" placeholder="e.g. Q3 2025 Broadcast Budget" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Total Amount (KES) *</label>
              <input type="number" step="0.01" {...register("total_amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Period</label>
              <input {...register("period")} className="input" placeholder="Q3 2025" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Department</label>
            <input {...register("department")} className="input" placeholder="Department name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input type="date" {...register("start_date")} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">End Date</label>
              <input type="date" {...register("end_date")} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea {...register("notes")} rows={2} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Creating..." : "Create Budget"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────

function InvoiceModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createInvoice(data),
    onSuccess: () => { toast.success("Invoice created"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="New Invoice" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Invoice Number</label>
              <input {...register("invoice_number")} className="input" placeholder="INV-001" />
            </div>
            <div className="input-group">
              <label className="input-label">Type</label>
              <select {...register("invoice_type")} className="select-input">
                <option value="incoming">Incoming (from vendor)</option>
                <option value="outgoing">Outgoing (to client)</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Vendor / Client *</label>
            <input {...register("vendor", { required: true })} className="input" placeholder="Company or person name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Tax Amount (KES)</label>
              <input type="number" step="0.01" {...register("tax_amount")} className="input" defaultValue={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Issue Date *</label>
              <input type="date" {...register("issue_date", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Due Date *</label>
              <input type="date" {...register("due_date", { required: true })} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea {...register("description")} rows={2} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Purchase Order Modal ─────────────────────────────────────────────────────

function PurchaseOrderModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createPurchaseOrder(data),
    onSuccess: () => { toast.success("Purchase order created"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="New Purchase Order" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="input-group">
            <label className="input-label">Supplier *</label>
            <input {...register("supplier", { required: true })} className="input" placeholder="Supplier name" />
          </div>
          <div className="input-group">
            <label className="input-label">Description *</label>
            <textarea {...register("description", { required: true })} rows={2} className="textarea" placeholder="What is being purchased?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Quantity</label>
              <input type="number" {...register("quantity")} className="input" defaultValue={1} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Budget Allocation</label>
            <input {...register("budget")} className="input" placeholder="Budget reference" />
          </div>
          <div className="input-group">
            <label className="input-label">Delivery Date</label>
            <input type="date" {...register("delivery_date")} className="input" />
          </div>
          <div className="input-group">
            <label className="input-label">Justification</label>
            <textarea {...register("justification")} rows={2} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Submitting..." : "Submit PO"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Petty Cash Modal ─────────────────────────────────────────────────────────

function PettyCashModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createPettyCash(data),
    onSuccess: () => { toast.success("Petty cash request submitted"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Petty Cash Request" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="input-group">
            <label className="input-label">Description *</label>
            <input {...register("description", { required: true })} className="input" placeholder="Purpose of petty cash" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input type="date" {...register("date")} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Receipt Number</label>
            <input {...register("receipt_number")} className="input" placeholder="Receipt / voucher number" />
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea {...register("notes")} rows={2} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createPayment(data),
    onSuccess: () => { toast.success("Payment recorded"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Record Payment" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Payment Type</label>
              <select {...register("type")} className="select-input">
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Payment Method</label>
              <select {...register("method")} className="select-input">
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Payee / Payer *</label>
            <input {...register("payee", { required: true })} className="input" placeholder="Name of payee or payer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Payment Date</label>
              <input type="date" {...register("payment_date")} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Reference / Transaction ID</label>
            <input {...register("reference")} className="input" placeholder="e.g. M-Pesa transaction code" />
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea {...register("notes")} rows={2} className="textarea" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Stipend Modal ────────────────────────────────────────────────────────────

function StipendModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.createStipend(data),
    onSuccess: () => { toast.success("Stipend created"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Add Stipend" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="input-group">
            <label className="input-label">Attachee Name *</label>
            <input {...register("attachee_name", { required: true })} className="input" placeholder="Full name of intern/attachee" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Amount (KES) *</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Period</label>
              <input {...register("period")} className="input" placeholder="e.g. June 2025" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Department</label>
            <input {...register("department")} className="input" placeholder="Hosting department" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input type="date" {...register("start_date")} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">End Date</label>
              <input type="date" {...register("end_date")} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Payment Method</label>
            <select {...register("payment_method")} className="select-input">
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Saving..." : "Add Stipend"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Payroll Modal ────────────────────────────────────────────────────────────

function PayrollModal({ onClose, onSuccess }: any) {
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.processPayroll(data),
    onSuccess: () => { toast.success("Payroll processing initiated"); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
  });
  return (
    <ModalShell title="Process Payroll" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Period *</label>
              <input {...register("period", { required: true })} className="input" placeholder="e.g. June 2025" />
            </div>
            <div className="input-group">
              <label className="input-label">Pay Date *</label>
              <input type="date" {...register("pay_date", { required: true })} className="input" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Department (leave blank for all)</label>
            <input {...register("department")} className="input" placeholder="All departments" />
          </div>
          <div className="input-group">
            <label className="input-label">Payment Method</label>
            <select {...register("payment_method")} className="select-input">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea {...register("notes")} rows={2} className="textarea" />
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs">
            ⚠ Processing payroll will initiate disbursements to all active employees for the selected period. Confirm details before proceeding.
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Processing..." : "Process Payroll"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}