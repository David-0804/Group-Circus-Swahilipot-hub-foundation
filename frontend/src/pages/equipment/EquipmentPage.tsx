// Nexus Equipment Management Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
	Package,
	Plus,
	Search,
	Filter,
	CheckCircle,
	XCircle,
	Wrench,
	RotateCcw,
	Eye,
	Download,
	AlertTriangle,
	Camera,
	Mic,
	Lightbulb,
	Monitor,
	BarChart3,
} from "lucide-react";
import { equipmentApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { format } from "date-fns";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
	available: "badge-green",
	checked_out: "badge-blue",
	under_repair: "badge-amber",
	retired: "badge-slate",
	lost: "badge-red",
	reserved: "badge-purple",
};

const CONDITION_STYLES: Record<string, string> = {
	excellent: "text-green-400",
	good: "text-green-300",
	fair: "text-amber-400",
	poor: "text-red-400",
	damaged: "text-red-500",
};

export default function EquipmentPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isAdmin = [
		"broadcast_admin",
		"broadcast_staff",
		"system_admin",
		"ict",
	].includes(user?.role || "");

	const [activeTab, setActiveTab] = useState<
		"inventory" | "checkouts" | "maintenance"
	>("inventory");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);
	const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState<any>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const { data: stats } = useQuery({
		queryKey: ["equipment-stats"],
		queryFn: () => equipmentApi.stats().then((r) => r.data),
		refetchInterval: 60000,
	});

	const { data: categoriesData } = useQuery({
		queryKey: ["equipment-categories"],
		queryFn: () => equipmentApi.categories().then((r) => r.data),
	});

	const categories = Array.isArray(categoriesData)
		? categoriesData
		: Array.isArray(categoriesData?.results)
			? categoriesData.results
			: [];

	const { data: inventoryData, isLoading } = useQuery({
		queryKey: ["equipment", search, statusFilter, categoryFilter],
		queryFn: () =>
			equipmentApi
				.list({
					search: search || undefined,
					status: statusFilter || undefined,
					category: categoryFilter || undefined,
				})
				.then((r) => r.data),
		refetchInterval: 60000,
	});

	const inventory = Array.isArray(inventoryData)
		? inventoryData
		: Array.isArray(inventoryData?.results)
			? inventoryData.results
			: [];

	const { data: checkouts = [], isLoading: checkoutsLoading } = useQuery({
		queryKey: ["equipment-checkouts"],
		queryFn: () =>
			equipmentApi.checkoutRequests().then((r) => r.data.results || r.data),
		refetchInterval: 60000,
		enabled: activeTab === "checkouts",
	});

	const { data: maintenance = [] } = useQuery({
		queryKey: ["equipment-maintenance"],
		queryFn: () =>
			equipmentApi.maintenance().then((r) => r.data.results || r.data),
		enabled: activeTab === "maintenance",
	});

	const approveMutation = useMutation({
		mutationFn: ({ id, action, reason }: any) =>
			equipmentApi.approveCheckout(id, { action, reason }),
		onSuccess: (_, { action }) => {
			qc.invalidateQueries({ queryKey: ["equipment-checkouts"] });
			qc.invalidateQueries({ queryKey: ["equipment"] });
			qc.invalidateQueries({ queryKey: ["equipment-stats"] });
			toast.success(
				`Checkout ${action === "approve" ? "approved" : "rejected"}`,
			);
		},
		onError: (e: any) => {
			console.log(e.response?.data);

			const detail = e.response?.data?.detail;

			const message =
				typeof detail === "string"
					? detail
					: detail?.organisation?.[0] ||
						e.response?.data?.organisation?.[0] ||
						"Action failed";

			toast.error(message);
		},
	});

	const returnMutation = useMutation({
		mutationFn: ({ id, data }: any) => equipmentApi.returnEquipment(id, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["equipment-checkouts"] });
			qc.invalidateQueries({ queryKey: ["equipment"] });
			qc.invalidateQueries({ queryKey: ["equipment-stats"] });
			toast.success("Equipment returned successfully");
		},
	});

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Package size={24} className="text-Nexus-400" />
						Equipment Management
					</h1>
					<p className="page-subtitle">
						Inventory, checkout requests, and maintenance tracking
					</p>
				</div>
				{isAdmin && (
					<button onClick={() => setShowAddModal(true)} className="btn-primary">
						<Plus size={16} /> Add Equipment
					</button>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
				{[
					{
						label: "Total Items",
						value: stats?.total ?? "—",
						color: "text-white",
					},
					{
						label: "Available",
						value: stats?.available ?? "—",
						color: "text-green-400",
					},
					{
						label: "Checked Out",
						value: stats?.checked_out ?? "—",
						color: "text-blue-400",
					},
					{
						label: "Under Repair",
						value: stats?.under_repair ?? "—",
						color: "text-amber-400",
					},
					{
						label: "Overdue Returns",
						value: stats?.overdue_checkouts ?? "—",
						color: "text-red-400",
					},
					{
						label: "Pending Requests",
						value: stats?.pending_requests ?? "—",
						color: "text-purple-400",
					},
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-1 p-1 bg-surface-card rounded-xl border border-surface-border w-fit">
				{(["inventory", "checkouts", "maintenance"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={clsx(
							"px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all",
							{
								"bg-Nexus-600 text-white shadow": activeTab === tab,
								"text-slate-400 hover:text-white": activeTab !== tab,
							},
						)}>
						{tab}
					</button>
				))}
			</div>

			{/* ── INVENTORY TAB ── */}
			{activeTab === "inventory" && (
				<div className="card">
					{/* Filters */}
					<div className="flex flex-wrap gap-3 mb-5">
						<div className="relative flex-1 min-w-48">
							<Search
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
							/>
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by name, asset tag, serial..."
								className="input pl-9 py-2"
							/>
						</div>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="select-input w-40">
							<option value="">All Statuses</option>
							<option value="available">Available</option>
							<option value="checked_out">Checked Out</option>
							<option value="under_repair">Under Repair</option>
							<option value="retired">Retired</option>
							<option value="lost">Lost</option>
						</select>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="select-input w-40">
							<option value="">All Categories</option>
							{categories.map((cat: any) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>

					<div className="overflow-x-auto">
						<table className="data-table">
							<thead>
								<tr>
									<th>Asset Tag</th>
									<th>Item</th>
									<th>Category</th>
									<th>Condition</th>
									<th>Status</th>
									<th>Current Borrower</th>
									<th>Due Return</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{isLoading ? (
									[...Array(8)].map((_, i) => (
										<tr key={i}>
											<td colSpan={8}>
												<div className="skeleton h-8 w-full my-1" />
											</td>
										</tr>
									))
								) : inventory.length === 0 ? (
									<tr>
										<td
											colSpan={8}
											className="text-center py-12 text-slate-500">
											<Package size={32} className="mx-auto mb-3 opacity-30" />
											No equipment found
										</td>
									</tr>
								) : (
									inventory.map((item: any) => (
										<tr key={item.id}>
											<td className="font-mono text-xs text-Nexus-400">
												{item.asset_tag}
											</td>
											<td>
												<div className="font-medium text-white">
													{item.name}
												</div>
												{item.make && (
													<div className="text-xs text-slate-500">
														{item.make} {item.model}
													</div>
												)}
											</td>
											<td className="text-slate-400">{item.category_name}</td>
											<td>
												<span
													className={clsx(
														"text-sm font-medium capitalize",
														CONDITION_STYLES[item.condition] ||
															"text-slate-400",
													)}>
													{item.condition}
												</span>
											</td>
											<td>
												<span
													className={clsx(
														"badge capitalize",
														STATUS_STYLES[item.status] || "badge-slate",
													)}>
													{item.status?.replace("_", " ")}
												</span>
											</td>
											<td className="text-slate-400 text-sm">
												{item.current_borrower?.name || "—"}
											</td>
											<td className="text-sm">
												{item.due_return_date ? (
													<span
														className={clsx({
															"text-red-400":
																new Date(item.due_return_date) < new Date(),
															"text-amber-400":
																new Date(item.due_return_date) <=
																new Date(Date.now() + 2 * 86400000),
															"text-slate-400": true,
														})}>
														{format(new Date(item.due_return_date), "dd MMM")}
													</span>
												) : (
													"—"
												)}
											</td>
											<td>
												<div className="flex items-center gap-2">
													<button
														onClick={() => {
															setSelectedItem(item);
															setShowDetailModal(true);
														}}
														className="btn-ghost btn-sm p-1">
														<Eye size={13} />
													</button>
													{item.status === "available" && (
														<button
															onClick={() => {
																setSelectedItem(item);
																setShowCheckoutModal(true);
															}}
															className="btn-primary btn-sm">
															Request
														</button>
													)}
													{isAdmin && item.status !== "under_repair" && (
														<button
															onClick={() => {
																setSelectedItem(item);
																setShowMaintenanceModal(true);
															}}
															className="btn-secondary btn-sm">
															<Wrench size={12} />
														</button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ── CHECKOUTS TAB ── */}
			{activeTab === "checkouts" && (
				<div className="card">
					<div className="overflow-x-auto">
						<table className="data-table">
							<thead>
								<tr>
									<th>Item</th>
									<th>Requested By</th>
									<th>Period</th>
									<th>Purpose</th>
									<th>Status</th>
									<th>Overdue</th>
									{isAdmin && <th>Actions</th>}
								</tr>
							</thead>
							<tbody>
								{checkoutsLoading ? (
									[...Array(5)].map((_, i) => (
										<tr key={i}>
											<td colSpan={7}>
												<div className="skeleton h-8 w-full" />
											</td>
										</tr>
									))
								) : checkouts.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className="text-center py-10 text-slate-500">
											No checkout requests found
										</td>
									</tr>
								) : (
									checkouts.map((checkout: any) => (
										<tr key={checkout.id}>
											<td className="font-medium text-white">
												{checkout.item_name}
											</td>
											<td className="text-slate-400">
												{checkout.requested_by_name}
											</td>
											<td className="text-xs font-mono">
												{format(new Date(checkout.start_date), "dd MMM")} –{" "}
												{format(new Date(checkout.end_date), "dd MMM yyyy")}
											</td>
											<td className="text-slate-400 text-sm max-w-xs truncate">
												{checkout.purpose}
											</td>
											<td>
												<span
													className={clsx(
														"badge capitalize",
														STATUS_STYLES[checkout.status] || "badge-slate",
													)}>
													{checkout.status?.replace("_", " ")}
												</span>
											</td>
											<td>
												{checkout.is_overdue && (
													<span className="badge-red flex items-center gap-1">
														<AlertTriangle size={10} /> Overdue
													</span>
												)}
											</td>
											{isAdmin && (
												<td>
													<div className="flex items-center gap-2">
														{checkout.status === "pending" && (
															<>
																<button
																	onClick={() =>
																		approveMutation.mutate({
																			id: checkout.id,
																			action: "approve",
																		})
																	}
																	className="btn-success btn-sm">
																	<CheckCircle size={12} /> Approve
																</button>
																<button
																	onClick={() =>
																		approveMutation.mutate({
																			id: checkout.id,
																			action: "reject",
																		})
																	}
																	className="btn-danger btn-sm">
																	<XCircle size={12} /> Reject
																</button>
															</>
														)}
														{checkout.status === "active" && (
															<button
																onClick={() =>
																	returnMutation.mutate({
																		id: checkout.id,
																		data: { condition: "good" },
																	})
																}
																className="btn-secondary btn-sm">
																<RotateCcw size={12} /> Mark Returned
															</button>
														)}
													</div>
												</td>
											)}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ── MAINTENANCE TAB ── */}
			{activeTab === "maintenance" && (
				<div className="card">
					<div className="flex justify-between items-center mb-5">
						<h3 className="font-semibold text-white">Maintenance Logs</h3>
						<button
							onClick={() => setShowMaintenanceModal(true)}
							className="btn-secondary btn-sm">
							<Plus size={13} /> Report Issue
						</button>
					</div>
					<div className="overflow-x-auto">
						<table className="data-table">
							<thead>
								<tr>
									<th>Item</th>
									<th>Reported By</th>
									<th>Issue</th>
									<th>Status</th>
									<th>Date</th>
									<th>Repair Cost</th>
								</tr>
							</thead>
							<tbody>
								{maintenance.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="text-center py-10 text-slate-500">
											No maintenance records
										</td>
									</tr>
								) : (
									maintenance.map((log: any) => (
										<tr key={log.id}>
											<td className="font-medium text-white">
												{log.item_name}
											</td>
											<td className="text-slate-400">{log.reported_by_name}</td>
											<td className="text-slate-300 max-w-xs truncate">
												{log.issue_description}
											</td>
											<td>
												<span
													className={clsx("badge", {
														"badge-red": log.status === "reported",
														"badge-amber": log.status === "in_progress",
														"badge-green": log.status === "repaired",
														"badge-slate": log.status === "unrepairable",
													})}>
													{log.status?.replace("_", " ")}
												</span>
											</td>
											<td className="text-slate-400 text-xs">
												{format(new Date(log.created_at), "dd MMM yyyy")}
											</td>
											<td className="text-slate-400">
												{log.repair_cost ? `KES ${log.repair_cost}` : "—"}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Checkout Request Modal */}
			{showCheckoutModal && selectedItem && (
				<CheckoutModal
					item={selectedItem}
					onClose={() => {
						setShowCheckoutModal(false);
						setSelectedItem(null);
					}}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["equipment"] });
						qc.invalidateQueries({ queryKey: ["equipment-checkouts"] });
						setShowCheckoutModal(false);
					}}
				/>
			)}

			{/* Add Equipment Modal */}
			{showAddModal && (
				<AddEquipmentModal
					categories={categories}
					onClose={() => setShowAddModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["equipment"] });
						qc.invalidateQueries({ queryKey: ["equipment-stats"] });
						setShowAddModal(false);
					}}
				/>
			)}

			{/* Maintenance Modal */}
			{showMaintenanceModal && (
				<MaintenanceModal
					item={selectedItem}
					inventory={inventory}
					onClose={() => {
						setShowMaintenanceModal(false);
						setSelectedItem(null);
					}}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["equipment-maintenance"] });
						qc.invalidateQueries({ queryKey: ["equipment"] });
						setShowMaintenanceModal(false);
					}}
				/>
			)}
		</div>
	);
}

// ── Modal Components ──────────────────────────────────────────────────────

function CheckoutModal({ item, onClose, onSuccess }: any) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();
	const mutation = useMutation({
		mutationFn: (data: any) =>
			equipmentApi.requestCheckout({ ...data, item: item.id }),
		onSuccess: () => {
			toast.success("Checkout request submitted!");
			onSuccess();
		},
		onError: (e: any) => {
			console.log(e.response?.data);

			const detail = e.response?.data?.detail;

			const message =
				typeof detail === "string"
					? detail
					: detail?.organisation?.[0] ||
						e.response?.data?.organisation?.[0] ||
						"Request failed";

			toast.error(message);
		},
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">
						Request Checkout — {item.name}
					</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="card bg-surface/60 flex items-center gap-3">
							<Package size={20} className="text-Nexus-400" />
							<div>
								<div className="text-white font-medium">{item.name}</div>
								<div className="text-xs text-slate-500">
									{item.asset_tag} · {item.category_name} · Condition:{" "}
									{item.condition}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Start Date *</label>
								<input
									type="date"
									{...register("start_date", { required: true })}
									className="input"
									min={format(new Date(), "yyyy-MM-dd")}
								/>
							</div>
							<div className="input-group">
								<label className="input-label">End Date *</label>
								<input
									type="date"
									{...register("end_date", { required: true })}
									className="input"
								/>
							</div>
						</div>
						<div className="input-group">
							<label className="input-label">Purpose / Project *</label>
							<textarea
								{...register("purpose", { required: true })}
								className="textarea h-20"
								placeholder="What will you use this equipment for?"
							/>
							{errors.purpose && (
								<p className="text-red-400 text-xs">Purpose is required</p>
							)}
						</div>
						<div className="input-group">
							<label className="input-label">
								Project Reference (optional)
							</label>
							<input
								{...register("project_reference")}
								className="input"
								placeholder="e.g. Radio Show #12, News Package"
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
							{mutation.isPending ? "Submitting..." : "Submit Request"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function AddEquipmentModal({ categories, onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm();
	const mutation = useMutation({
		mutationFn: (data: any) => equipmentApi.create(data),
		onSuccess: () => {
			toast.success("Equipment added!");
			onSuccess();
		},
		onError: (e: any) => {
			console.log(e.response?.data);

			const detail = e.response?.data?.detail;

			const message =
				typeof detail === "string"
					? detail
					: detail?.organisation?.[0] ||
						e.response?.data?.organisation?.[0] ||
						"Failed to add equipment";

			toast.error(message);
		},
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Add New Equipment</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body grid grid-cols-2 gap-4">
						<div className="input-group col-span-2">
							<label className="input-label">Item Name *</label>
							<input
								{...register("name", { required: true })}
								className="input"
								placeholder="e.g. Sony A7III Camera"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Asset Tag *</label>
							<input
								{...register("asset_tag", { required: true })}
								className="input"
								placeholder="e.g. CAM-001"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Category</label>
							<select {...register("category")} className="select-input">
								<option value="">Select category</option>
								{categories.map((c: any) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="input-group">
							<label className="input-label">Make / Brand</label>
							<input
								{...register("make")}
								className="input"
								placeholder="Sony"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Model</label>
							<input
								{...register("model")}
								className="input"
								placeholder="A7III"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Serial Number</label>
							<input {...register("serial_number")} className="input" />
						</div>
						<div className="input-group">
							<label className="input-label">Condition</label>
							<select {...register("condition")} className="select-input">
								<option value="excellent">Excellent</option>
								<option value="good">Good</option>
								<option value="fair">Fair</option>
								<option value="poor">Poor</option>
							</select>
						</div>
						<div className="input-group">
							<label className="input-label">Purchase Date</label>
							<input
								type="date"
								{...register("purchase_date")}
								className="input"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Purchase Cost (KES)</label>
							<input
								type="number"
								{...register("purchase_cost")}
								className="input"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Storage Location</label>
							<input
								{...register("location")}
								className="input"
								placeholder="e.g. Studio A Cabinet 2"
							/>
						</div>
						<div className="input-group col-span-2">
							<label className="input-label">Description / Notes</label>
							<textarea
								{...register("description")}
								className="textarea h-20"
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
							{mutation.isPending ? "Adding..." : "Add Equipment"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function MaintenanceModal({ item, inventory, onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm({
		defaultValues: { item: item?.id },
	});
	const mutation = useMutation({
		mutationFn: (data: any) => equipmentApi.reportMaintenance(data),
		onSuccess: () => {
			toast.success("Maintenance issue reported");
			onSuccess();
		},
		onError: (e: any) => {
			const errorData = e.response?.data;

			const message =
				errorData?.detail?.organisation?.[0] ||
				errorData?.organisation?.[0] ||
				errorData?.detail ||
				"Failed";

			toast.error(String(message));
		},
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<Wrench size={18} className="text-amber-400" /> Report Maintenance
						Issue
					</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						{!item && (
							<div className="input-group">
								<label className="input-label">Equipment Item *</label>
								<select
									{...register("item", { required: true })}
									className="select-input">
									<option value="">Select item</option>
									{inventory.map((inv: any) => (
										<option key={inv.id} value={inv.id}>
											{inv.asset_tag} — {inv.name}
										</option>
									))}
								</select>
							</div>
						)}
						<div className="input-group">
							<label className="input-label">Issue Description *</label>
							<textarea
								{...register("issue_description", { required: true })}
								className="textarea h-28"
								placeholder="Describe the fault or damage in detail..."
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
							className="btn-danger">
							{mutation.isPending ? "Reporting..." : "Report Issue"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
