// Swahilipot — Emergency Alerts Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	Siren,
	AlertTriangle,
	CheckCircle,
	Clock,
	Bell,
	Shield,
	Radio,
	Zap,
	Server,
	Flame,
	Database,
	Info,
} from "lucide-react";
import { emergencyApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const ALERT_TYPE_CONFIG: Record<string, { icon: any; label: string }> = {
	fm_outage: { icon: Radio, label: "FM Station Outage" },
	system_down: { icon: Server, label: "System Down" },
	security_breach: { icon: Shield, label: "Security Breach" },
	infrastructure: { icon: Zap, label: "Infrastructure Failure" },
	data_breach: { icon: Database, label: "Data Breach" },
	fire: { icon: Flame, label: "Fire / Evacuation" },
	emergency: { icon: AlertTriangle, label: "General Emergency" },
	other: { icon: Info, label: "Other" },
};

const SEVERITY_STYLES: Record<string, string> = {
	low: "badge-blue",
	medium: "badge-amber",
	high: "badge-red",
	critical: "badge-red",
};

export default function EmergencyPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [showTriggerModal, setShowTriggerModal] = useState(false);
	const [activeFilter, setActiveFilter] = useState<"active" | "all">("active");

	const { data: alerts = [], isLoading } = useQuery({
		queryKey: ["emergency-alerts"],
		queryFn: () => emergencyApi.list().then((r) => r.data),
		refetchInterval: 30000,
	});

	const acknowledgeMutation = useMutation({
		mutationFn: (id: string) => emergencyApi.acknowledge(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["emergency-alerts"] });
			toast.success("Alert acknowledged");
		},
	});

	const activeAlerts = alerts.filter((a: any) => !a.resolved);
	const resolvedAlerts = alerts.filter((a: any) => a.resolved);
	const displayed = activeFilter === "active" ? activeAlerts : alerts;

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Siren size={22} className="text-red-400" />
						Emergency Alerts
						{activeAlerts.length > 0 && (
							<span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
								{activeAlerts.length} ACTIVE
							</span>
						)}
					</h1>
					<p className="page-subtitle">
						System-wide emergency alerts, acknowledgements, and resolution
						tracking
					</p>
				</div>
				<button
					onClick={() => setShowTriggerModal(true)}
					className="emergency-btn btn-lg">
					<Siren size={18} />
					SEND EMERGENCY ALERT
				</button>
			</div>

			{/* Active alert banner */}
			{activeAlerts.length > 0 && (
				<div className="p-4 rounded-xl border border-red-500/50 bg-red-900/20 animate-glow-pulse">
					<div className="flex items-center gap-3 mb-3">
						<Siren size={20} className="text-red-400 animate-bounce" />
						<span className="font-bold text-red-400 text-lg">
							{activeAlerts.length} Active Emergency Alert
							{activeAlerts.length > 1 ? "s" : ""}
						</span>
					</div>
					<div className="space-y-2">
						{activeAlerts.map((a: any) => (
							<div
								key={a.id}
								className="flex items-center justify-between p-3 bg-red-900/30 rounded-lg">
								<div>
									<span className="font-semibold text-white text-sm">
										{a.title}
									</span>
									<span
										className={clsx(
											"ml-2 badge uppercase text-[10px]",
											SEVERITY_STYLES[a.severity] || "badge-red",
										)}>
										{a.severity}
									</span>
								</div>
								<button
									onClick={() => acknowledgeMutation.mutate(a.id)}
									disabled={acknowledgeMutation.isPending}
									className="btn-secondary btn-sm text-xs">
									<CheckCircle size={12} /> Acknowledge
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Filter tabs */}
			<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit">
				<button
					onClick={() => setActiveFilter("active")}
					className={clsx(
						"px-5 py-2 rounded-lg text-sm font-medium transition-all",
						{
							"bg-Swahilipot-600 text-white": activeFilter === "active",
							"text-slate-400 hover:text-white": activeFilter !== "active",
						},
					)}>
					Active ({activeAlerts.length})
				</button>
				<button
					onClick={() => setActiveFilter("all")}
					className={clsx(
						"px-5 py-2 rounded-lg text-sm font-medium transition-all",
						{
							"bg-Swahilipot-600 text-white": activeFilter === "all",
							"text-slate-400 hover:text-white": activeFilter !== "all",
						},
					)}>
					All History ({alerts.length})
				</button>
			</div>

			{/* Alert cards */}
			<div className="space-y-4">
				{isLoading ? (
					[...Array(3)].map((_, i) => (
						<div key={i} className="skeleton h-40 rounded-xl" />
					))
				) : displayed.length === 0 ? (
					<div className="card text-center py-14">
						<CheckCircle
							size={36}
							className="mx-auto text-green-400 mb-3 opacity-50"
						/>
						<p className="text-slate-400">
							{activeFilter === "active"
								? "No active emergencies — all systems operational"
								: "No alerts found"}
						</p>
					</div>
				) : (
					displayed.map((alert: any) => {
						const cfg =
							ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.other;
						const Icon = cfg.icon;
						const ackCount = alert.acknowledged_count || 0;
						return (
							<div
								key={alert.id}
								className={clsx("card border-l-4", {
									"border-l-red-500":
										!alert.resolved &&
										(alert.severity === "critical" ||
											alert.severity === "high"),
									"border-l-amber-500":
										!alert.resolved && alert.severity === "medium",
									"border-l-green-500": alert.resolved,
									"border-l-blue-500":
										!alert.resolved && alert.severity === "low",
								})}>
								<div className="flex items-start gap-4">
									<div
										className={clsx(
											"w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
											{
												"bg-red-500/15": !alert.resolved,
												"bg-green-500/15": alert.resolved,
											},
										)}>
										<Icon
											size={20}
											className={
												alert.resolved ? "text-green-400" : "text-red-400"
											}
										/>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-3 flex-wrap">
											<div>
												<h3 className="font-semibold text-white">
													{alert.title}
												</h3>
												<div className="flex items-center gap-2 mt-1 flex-wrap">
													<span className="text-xs text-slate-400">
														{cfg.label}
													</span>
													<span
														className={clsx(
															"badge uppercase text-[10px]",
															SEVERITY_STYLES[alert.severity] || "badge-amber",
														)}>
														{alert.severity}
													</span>
													{alert.resolved ? (
														<span className="badge-green text-[10px]">
															Resolved
														</span>
													) : (
														<span className="badge-red text-[10px] animate-pulse">
															Active
														</span>
													)}
												</div>
											</div>
											<div className="text-right text-xs text-slate-500 shrink-0">
												<div>
													{format(
														parseISO(alert.created_at),
														"dd MMM yyyy, HH:mm",
													)}
												</div>
												<div className="mt-0.5">
													by {alert.triggered_by_name || "System"}
												</div>
											</div>
										</div>

										<p className="text-sm text-slate-300 mt-2 leading-relaxed">
											{alert.description}
										</p>

										{alert.affected_systems?.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mt-2">
												{alert.affected_systems.map((sys: string) => (
													<span key={sys} className="badge-slate text-[10px]">
														{sys}
													</span>
												))}
											</div>
										)}

										<div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-border/50 flex-wrap">
											<div className="flex items-center gap-1.5 text-xs text-slate-500">
												<Bell size={11} />
												Notified: {alert.notified_emails?.length || 0} email
												{alert.notified_emails?.length !== 1 ? "s" : ""},{" "}
												{alert.notified_phones?.length || 0} SMS
											</div>
											<div className="flex items-center gap-1.5 text-xs text-slate-500">
												<CheckCircle size={11} />
												{ackCount} acknowledgement{ackCount !== 1 ? "s" : ""}
											</div>
											{!alert.resolved && (
												<button
													onClick={() => acknowledgeMutation.mutate(alert.id)}
													disabled={acknowledgeMutation.isPending}
													className="ml-auto btn-secondary btn-sm text-xs">
													<CheckCircle size={12} /> Acknowledge
												</button>
											)}
										</div>

										{alert.resolution_notes && (
											<div className="mt-3 p-3 bg-green-900/20 rounded-lg border border-green-500/20">
												<div className="text-xs text-green-400 font-semibold mb-1">
													Resolution Notes
												</div>
												<p className="text-xs text-slate-300">
													{alert.resolution_notes}
												</p>
												{alert.resolved_at && (
													<div className="text-[10px] text-slate-500 mt-1">
														Resolved at{" "}
														{format(
															parseISO(alert.resolved_at),
															"dd MMM yyyy, HH:mm",
														)}
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			{showTriggerModal && (
				<TriggerAlertModal
					onClose={() => setShowTriggerModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["emergency-alerts"] });
						setShowTriggerModal(false);
					}}
				/>
			)}
		</div>
	);
}

function TriggerAlertModal({ onClose, onSuccess }: any) {
	const [form, setForm] = useState({
		alert_type: "emergency",
		title: "",
		description: "",
		severity: "high",
		affected_systems: [] as string[],
	});
	const SYSTEMS = [
		"FM Station",
		"Website",
		"Broadcast Network",
		"Internal Systems",
		"Power",
		"Internet",
		"Studio Equipment",
		"Security Systems",
		"All Systems",
	];

	const mutation = useMutation({
		mutationFn: (data: any) => emergencyApi.trigger(data),
		onSuccess: () => {
			toast.success("🚨 Emergency alert dispatched!", { duration: 6000 });
			onSuccess();
		},
		onError: (e: any) =>
			toast.error("Failed: " + (e.response?.data?.detail || "Unknown error")),
	});

	const toggleSystem = (sys: string) =>
		setForm((p) => ({
			...p,
			affected_systems: p.affected_systems.includes(sys)
				? p.affected_systems.filter((s) => s !== sys)
				: [...p.affected_systems, sys],
		}));

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header bg-red-950/40 border-b border-red-500/30">
					<h3 className="text-xl font-display font-bold text-red-400 flex items-center gap-2">
						<Siren size={22} className="animate-bounce" /> Send Emergency Alert
					</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="alert alert-danger">
						<AlertTriangle size={15} className="shrink-0" />
						<div>
							<div className="font-semibold text-sm">
								This immediately notifies all admins and emergency contacts via
								email and SMS.
							</div>
							<div className="text-xs mt-0.5 text-red-300">
								Use only for genuine emergencies.
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="input-group">
							<label className="input-label">Alert Type</label>
							<select
								value={form.alert_type}
								onChange={(e) =>
									setForm((p) => ({ ...p, alert_type: e.target.value }))
								}
								className="select-input">
								{Object.entries(ALERT_TYPE_CONFIG).map(([v, { label }]) => (
									<option key={v} value={v}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div className="input-group">
							<label className="input-label">Severity</label>
							<select
								value={form.severity}
								onChange={(e) =>
									setForm((p) => ({ ...p, severity: e.target.value }))
								}
								className={clsx("select-input", {
									"border-red-500 text-red-400": form.severity === "critical",
									"border-amber-500": form.severity === "high",
								})}>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="critical">🔴 CRITICAL</option>
							</select>
						</div>
					</div>

					<div className="input-group">
						<label className="input-label">Alert Title *</label>
						<input
							value={form.title}
							onChange={(e) =>
								setForm((p) => ({ ...p, title: e.target.value }))
							}
							placeholder="Brief, clear description of the emergency"
							className="input"
						/>
					</div>

					<div className="input-group">
						<label className="input-label">Full Description *</label>
						<textarea
							value={form.description}
							onChange={(e) =>
								setForm((p) => ({ ...p, description: e.target.value }))
							}
							rows={4}
							className="textarea"
							placeholder="Describe the situation, current status, and what immediate action is needed..."
						/>
					</div>

					<div className="input-group">
						<label className="input-label">Affected Systems</label>
						<div className="flex flex-wrap gap-2 mt-1">
							{SYSTEMS.map((sys) => (
								<button
									key={sys}
									type="button"
									onClick={() => toggleSystem(sys)}
									className={clsx("btn btn-sm border text-xs", {
										"bg-red-900/40 border-red-500/40 text-red-300":
											form.affected_systems.includes(sys),
										"border-surface-border text-slate-400 hover:border-slate-500":
											!form.affected_systems.includes(sys),
									})}>
									{sys}
								</button>
							))}
						</div>
					</div>
				</div>
				<div className="modal-footer bg-red-950/20">
					<button onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						disabled={
							!form.title.trim() ||
							!form.description.trim() ||
							mutation.isPending
						}
						onClick={() => mutation.mutate(form)}
						className="emergency-btn btn-lg px-8">
						{mutation.isPending ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Dispatching...
							</span>
						) : (
							<span className="flex items-center gap-2">
								<Bell size={16} /> DISPATCH ALERT
							</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
