// Nexus — Wi-Fi Access Management
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Wifi, Plus, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { wifiApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Wi-Fi Request Modal ────────────────────────────────────────────────────
function WifiRequestModal({
	onClose,
	user,
}: {
	onClose: () => void;
	user: any;
}) {
	const qc = useQueryClient();
	const [form, setForm] = useState({
		device_type: "laptop",
		mac_address: "",
		purpose: "",
		duration_days: 30,
	});

	const mutation = useMutation({
		mutationFn: (data: any) => wifiApi.request(data),
		onSuccess: (response) => {
			// Optimistically insert the new grant into the cache immediately
			// so the table updates before the background refetch completes.
			const newGrant = response.data;
			qc.setQueryData(["wifi-grants"], (old: any) => {
				const existing = Array.isArray(old)
					? old
					: Array.isArray(old?.results)
						? old.results
						: [];
				const merged = [newGrant, ...existing];
				// Preserve paginated shape if the API returns { results, count, ... }
				return Array.isArray(old) ? merged : { ...old, results: merged };
			});
			// Also kick off a background refetch to sync with server truth
			qc.invalidateQueries({ queryKey: ["wifi-grants"] });
			toast.success("Wi-Fi access request submitted!");
			onClose();
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Failed to submit request"),
	});

	const handleSubmit = () => {
		if (!form.purpose.trim()) return;
		mutation.mutate(form);
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-md" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<Wifi size={16} className="text-Nexus-400" />
						Request Wi-Fi Access
					</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="input-group">
						<label className="input-label">Device Type *</label>
						<select
							value={form.device_type}
							onChange={(e) =>
								setForm({ ...form, device_type: e.target.value })
							}
							className="select">
							<option value="laptop">Laptop</option>
							<option value="phone">Phone</option>
							<option value="tablet">Tablet</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div className="input-group">
						<label className="input-label">MAC Address</label>
						<input
							type="text"
							value={form.mac_address}
							onChange={(e) =>
								setForm({ ...form, mac_address: e.target.value })
							}
							className="input"
							placeholder="e.g. AA:BB:CC:DD:EE:FF"
						/>
					</div>
					<div className="input-group">
						<label className="input-label">Duration (days)</label>
						<input
							type="number"
							min={1}
							max={365}
							value={form.duration_days}
							onChange={(e) =>
								setForm({ ...form, duration_days: Number(e.target.value) })
							}
							className="input"
						/>
					</div>
					<div className="input-group">
						<label className="input-label">Purpose *</label>
						<textarea
							value={form.purpose}
							onChange={(e) => setForm({ ...form, purpose: e.target.value })}
							rows={3}
							className="textarea"
							placeholder="Explain why you need Wi-Fi access..."
						/>
					</div>
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						disabled={!form.purpose.trim() || mutation.isPending}
						onClick={handleSubmit}
						className="btn-primary">
						{mutation.isPending ? "Submitting..." : "Submit Request"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function WifiPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isAdmin = ["ict", "system_admin", "broadcast_admin"].includes(
		user?.role || "",
	);
	const [showRequestModal, setShowRequestModal] = useState(false);

	const { data: grantsData, isLoading } = useQuery({
		queryKey: ["wifi-grants"],
		queryFn: () => wifiApi.list().then((r) => r.data),
		refetchInterval: 60000,
	});

	const grants = Array.isArray(grantsData)
		? grantsData
		: Array.isArray(grantsData?.results)
			? grantsData.results
			: [];

	const approveMutation = useMutation({
		mutationFn: ({ id, action }: { id: string; action: string }) =>
			wifiApi.approve(id, { action }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wifi-grants"] });
			toast.success("Wi-Fi request updated");
		},
		onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
	});

	const revokeMutation = useMutation({
		mutationFn: (id: string) => wifiApi.revoke(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wifi-grants"] });
			toast.success("Access revoked");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Failed to revoke"),
	});

	const active = grants.filter((g: any) => g.status === "approved");
	const pending = grants.filter((g: any) => g.status === "pending");

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Wifi size={22} className="text-Nexus-400" />
						Wi-Fi Access Management
					</h1>
					<p className="page-subtitle">
						Formal access requests, time-limited grants, device registration
					</p>
				</div>
				<button
					onClick={() => setShowRequestModal(true)}
					className="btn-primary">
					<Plus size={15} />
					Request Access
				</button>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
				{[
					{
						label: "Active Grants",
						value: active.length,
						color: "text-green-400",
					},
					{ label: "Pending", value: pending.length, color: "text-amber-400" },
					{ label: "Total", value: grants.length, color: "text-white" },
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			<div className="card">
				<div className="overflow-x-auto">
					<table className="data-table">
						<thead>
							<tr>
								<th>Requester</th>
								<th>Device</th>
								<th>MAC Address</th>
								<th>Purpose</th>
								<th>Status</th>
								<th>Expires</th>
								{isAdmin && <th>Actions</th>}
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								[...Array(5)].map((_, i) => (
									<tr key={i}>
										<td colSpan={7}>
											<div className="skeleton h-8 w-full" />
										</td>
									</tr>
								))
							) : grants.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-10 text-slate-500">
										No Wi-Fi access requests
									</td>
								</tr>
							) : (
								grants.map((g: any) => (
									<tr key={g.id}>
										<td className="text-white font-medium text-sm">
											{g.requester_name || g.requested_by_name || "—"}
										</td>
										<td className="text-slate-300 text-sm capitalize">
											{g.device_type}
										</td>
										<td className="font-mono text-xs text-slate-400">
											{g.mac_address || "—"}
										</td>
										<td className="text-slate-400 text-sm max-w-xs truncate">
											{g.purpose}
										</td>
										<td>
											<span
												className={clsx("badge capitalize", {
													"badge-green": g.status === "approved",
													"badge-amber": g.status === "pending",
													"badge-red": g.status === "revoked",
													"badge-slate": g.status === "expired",
												})}>
												{g.status}
											</span>
										</td>
										<td className="text-slate-400 text-xs">
											{g.expires_at
												? format(parseISO(g.expires_at), "dd MMM yyyy")
												: "No expiry"}
										</td>
										{isAdmin && (
											<td>
												<div className="flex items-center gap-1.5">
													{g.status === "pending" && (
														<>
															<button
																onClick={() =>
																	approveMutation.mutate({
																		id: g.id,
																		action: "approve",
																	})
																}
																className="btn-success btn-sm p-1"
																title="Approve">
																<CheckCircle size={12} />
															</button>
															<button
																onClick={() =>
																	approveMutation.mutate({
																		id: g.id,
																		action: "reject",
																	})
																}
																className="btn-danger btn-sm p-1"
																title="Reject">
																<XCircle size={12} />
															</button>
														</>
													)}
													{g.status === "approved" && (
														<button
															onClick={() => revokeMutation.mutate(g.id)}
															className="btn-secondary btn-sm text-xs">
															<Trash2 size={11} />
															Revoke
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

			{showRequestModal && (
				<WifiRequestModal
					onClose={() => setShowRequestModal(false)}
					user={user}
				/>
			)}
		</div>
	);
}
