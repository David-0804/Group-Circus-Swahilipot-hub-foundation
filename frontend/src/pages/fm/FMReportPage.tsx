// Nexus FM Report Page — Critical Broadcast Module
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	Radio,
	AlertTriangle,
	CheckCircle,
	Clock,
	Download,
	RefreshCw,
	XCircle,
	Zap,
	Activity,
	Calendar,
	FileText,
	TriangleAlert,
	Siren,
	Bell,
} from "lucide-react";
import { fmReportApi, emergencyApi } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function FMReportPage() {
	const qc = useQueryClient();
	const [reportDownModal, setReportDownModal] = useState(false);
	const [reportRestoredModal, setReportRestoredModal] = useState(false);
	const [emergencyModal, setEmergencyModal] = useState(false);
	const [selectedStation, setSelectedStation] = useState<any>(null);
	const [downDescription, setDownDescription] = useState("");
	const [downseverity, setDownSeverity] = useState("moderate");
	const [restorationNotes, setRestorationNotes] = useState("");
	const [dateRange, setDateRange] = useState({ start: "", end: "" });

	const { data: stationsData, isLoading } = useQuery({
		queryKey: ["fm-stations"],
		queryFn: () => fmReportApi.stations().then((r) => r.data),
		refetchInterval: 30000,
	});

	const stations = Array.isArray(stationsData)
		? stationsData
		: Array.isArray(stationsData?.results)
			? stationsData.results
			: [];

	const { data: outagesData, isLoading: outagesLoading } = useQuery({
		queryKey: ["fm-outages", dateRange],
		queryFn: () =>
			fmReportApi
				.allOutages({
					start: dateRange.start || undefined,
					end: dateRange.end || undefined,
				})
				.then((r) => r.data),
		refetchInterval: 60000,
	});

	const allOutages = Array.isArray(outagesData)
		? outagesData
		: Array.isArray(outagesData?.results)
			? outagesData.results
			: [];

	const reportDownMutation = useMutation({
		mutationFn: ({ stationId, data }: any) =>
			fmReportApi.reportDown(stationId, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["fm-stations"] });
			qc.invalidateQueries({ queryKey: ["fm-outages"] });
			setReportDownModal(false);
			setDownDescription("");
			toast.error("🚨 FM Station reported as OFF AIR — Alerts sent!");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Failed to report outage"),
	});

	const reportRestoredMutation = useMutation({
		mutationFn: ({ stationId, data }: any) =>
			fmReportApi.reportRestored(stationId, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["fm-stations"] });
			qc.invalidateQueries({ queryKey: ["fm-outages"] });
			setReportRestoredModal(false);
			setRestorationNotes("");
			toast.success("✅ FM Station restored to ON AIR!");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Failed to report restoration"),
	});

	const handleExport = async (format: "csv" | "pdf") => {
		try {
			const res = await fmReportApi.exportOutages({ ...dateRange, format });
			const url = URL.createObjectURL(new Blob([res.data]));
			const a = document.createElement("a");
			a.href = url;
			a.download = `fm-outage-report.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			toast.error("Export failed");
		}
	};

	const primaryStation = stations[0];

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Page header */}
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Radio size={24} className="text-Nexus-400" />
						FM Station Monitor
					</h1>
					<p className="page-subtitle">
						Real-time broadcast status, outage tracking & emergency alerts
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={() => qc.invalidateQueries({ queryKey: ["fm-stations"] })}
						className="btn-secondary btn-sm">
						<RefreshCw size={14} /> Refresh
					</button>
					{/* THE BIG EMERGENCY ALERT BUTTON */}
					<button
						onClick={() => setEmergencyModal(true)}
						className="emergency-btn btn-lg">
						<Siren size={18} />
						SEND EMERGENCY ALERT
					</button>
				</div>
			</div>

			{/* Station status cards */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{[...Array(2)].map((_, i) => (
						<div key={i} className="skeleton h-48 rounded-xl" />
					))}
				</div>
			) : stations.length === 0 ? (
				<div className="card text-center py-12">
					<Radio size={32} className="mx-auto text-slate-500 mb-3" />
					<p className="text-slate-400">
						No FM stations configured. Contact your administrator.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{stations.map((station: any) => (
						<StationCard
							key={station.id}
							station={station}
							onReportDown={() => {
								setSelectedStation(station);
								setReportDownModal(true);
							}}
							onReportRestored={() => {
								setSelectedStation(station);
								setReportRestoredModal(true);
							}}
						/>
					))}
				</div>
			)}

			{/* Outage history */}
			<div className="card">
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Activity size={18} className="text-Nexus-400" />
						Outage History
					</h2>
					<div className="flex items-center gap-3">
						<input
							type="date"
							value={dateRange.start}
							onChange={(e) =>
								setDateRange((p) => ({ ...p, start: e.target.value }))
							}
							className="input text-xs py-1.5 w-36"
						/>
						<span className="text-slate-500 text-sm">to</span>
						<input
							type="date"
							value={dateRange.end}
							onChange={(e) =>
								setDateRange((p) => ({ ...p, end: e.target.value }))
							}
							className="input text-xs py-1.5 w-36"
						/>
						<button
							onClick={() => handleExport("csv")}
							className="btn-secondary btn-sm">
							<Download size={13} /> CSV
						</button>
						<button
							onClick={() => handleExport("pdf")}
							className="btn-secondary btn-sm">
							<FileText size={13} /> PDF
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="data-table">
						<thead>
							<tr>
								<th>Station</th>
								<th>Reported By</th>
								<th>Down At</th>
								<th>Restored At</th>
								<th>Duration</th>
								<th>Severity</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							{outagesLoading ? (
								[...Array(5)].map((_, i) => (
									<tr key={i}>
										<td colSpan={7}>
											<div className="skeleton h-8 w-full" />
										</td>
									</tr>
								))
							) : allOutages.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-8 text-slate-500">
										No outages recorded in this period
									</td>
								</tr>
							) : (
								allOutages.map((outage: any) => (
									<tr key={outage.id}>
										<td className="font-medium text-white">
											{outage.station_name}
										</td>
										<td className="text-slate-400">
											{outage.reported_by_name || "Auto-detected"}
										</td>
										<td className="font-mono text-xs">
											{format(new Date(outage.down_at), "yyyy-MM-dd HH:mm")}
										</td>
										<td className="font-mono text-xs">
											{outage.restored_at ? (
												format(new Date(outage.restored_at), "yyyy-MM-dd HH:mm")
											) : (
												<span className="badge-red">Ongoing</span>
											)}
										</td>
										<td>
											{outage.duration_minutes != null ? (
												<span
													className={clsx(
														"font-mono text-sm",
														outage.duration_minutes > 60
															? "text-red-400"
															: "text-amber-400",
													)}>
													{outage.duration_minutes}m
												</span>
											) : (
												<span className="text-slate-500">—</span>
											)}
										</td>
										<td>
											<span
												className={clsx("badge", {
													"badge-red": outage.severity === "critical",
													"badge-amber": outage.severity === "moderate",
													"badge-blue": outage.severity === "minor",
												})}>
												{outage.severity}
											</span>
										</td>
										<td className="text-slate-400 max-w-xs truncate">
											{outage.description || "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Report Down Modal */}
			{reportDownModal && selectedStation && (
				<div
					className="modal-backdrop"
					onClick={() => setReportDownModal(false)}>
					<div
						className="modal-box max-w-md"
						onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
								<XCircle size={20} /> Report FM Station DOWN
							</h3>
						</div>
						<div className="modal-body space-y-4">
							<div className="alert alert-danger">
								<AlertTriangle size={16} />
								<span>
									This will immediately notify all relevant authorities and
									engineers.
								</span>
							</div>
							<div className="card bg-surface/50">
								<div className="text-sm text-slate-400">Station</div>
								<div className="text-white font-semibold">
									{selectedStation.name} ({selectedStation.frequency})
								</div>
							</div>
							<div className="input-group">
								<label className="input-label">Severity</label>
								<select
									value={downseverity}
									onChange={(e) => setDownSeverity(e.target.value)}
									className="select-input">
									<option value="minor">Minor</option>
									<option value="moderate">Moderate</option>
									<option value="critical">Critical</option>
								</select>
							</div>
							<div className="input-group">
								<label className="input-label">Description (optional)</label>
								<textarea
									value={downDescription}
									onChange={(e) => setDownDescription(e.target.value)}
									placeholder="What happened? Any details about the failure..."
									className="textarea h-24"
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button
								onClick={() => setReportDownModal(false)}
								className="btn-secondary">
								Cancel
							</button>
							<button
								onClick={() =>
									reportDownMutation.mutate({
										stationId: selectedStation.id,
										data: {
											description: downDescription,
											severity: downseverity,
										},
									})
								}
								disabled={reportDownMutation.isPending}
								className="btn-danger btn-lg">
								{reportDownMutation.isPending
									? "Reporting..."
									: "🚨 Confirm FM DOWN"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Report Restored Modal */}
			{reportRestoredModal && selectedStation && (
				<div
					className="modal-backdrop"
					onClick={() => setReportRestoredModal(false)}>
					<div
						className="modal-box max-w-md"
						onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
								<CheckCircle size={20} /> Report FM Station RESTORED
							</h3>
						</div>
						<div className="modal-body space-y-4">
							<div className="card bg-surface/50">
								<div className="text-sm text-slate-400">Station</div>
								<div className="text-white font-semibold">
									{selectedStation.name} ({selectedStation.frequency})
								</div>
							</div>
							<div className="input-group">
								<label className="input-label">
									Resolution Notes (optional)
								</label>
								<textarea
									value={restorationNotes}
									onChange={(e) => setRestorationNotes(e.target.value)}
									placeholder="What fixed the issue? What was the root cause?"
									className="textarea h-24"
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button
								onClick={() => setReportRestoredModal(false)}
								className="btn-secondary">
								Cancel
							</button>
							<button
								onClick={() =>
									reportRestoredMutation.mutate({
										stationId: selectedStation.id,
										data: { resolution_notes: restorationNotes },
									})
								}
								disabled={reportRestoredMutation.isPending}
								className="btn-success btn-lg">
								{reportRestoredMutation.isPending
									? "Saving..."
									: "✅ Confirm RESTORED"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Emergency Alert Modal */}
			{emergencyModal && (
				<EmergencyAlertModal onClose={() => setEmergencyModal(false)} />
			)}
		</div>
	);
}

// ── Station Card Component ─────────────────────────────────────────────────
function StationCard({ station, onReportDown, onReportRestored }: any) {
	const isOnAir = station.current_status === "on_air";
	const isOffAir = station.current_status === "off_air";

	return (
		<div
			className={clsx("card transition-all duration-300", {
				"border-green-500/30 shadow-glow-green": isOnAir,
				"border-red-500/40 shadow-glow-red": isOffAir,
				"border-surface-border": !isOnAir && !isOffAir,
			})}>
			{/* Status banner */}
			<div
				className={clsx(
					"rounded-xl py-5 mb-4 flex flex-col items-center gap-2",
					{
						"on-air-banner": isOnAir,
						"off-air-banner": isOffAir,
						"bg-surface-elevated border border-surface-border":
							!isOnAir && !isOffAir,
					},
				)}>
				<div className="flex items-center gap-3">
					<div
						className={clsx("w-3 h-3 rounded-full", {
							"bg-green-400 shadow-glow-green": isOnAir,
							"bg-red-400 shadow-glow-red": isOffAir,
							"bg-slate-500": !isOnAir && !isOffAir,
						})}
					/>
					<span className="text-3xl font-display font-bold tracking-wider">
						{isOnAir ? "ON AIR" : isOffAir ? "OFF AIR" : "UNKNOWN"}
					</span>
				</div>
				{station.time_since_change && (
					<span className="text-sm opacity-80">
						{isOnAir ? "On Air for" : "Off Air for"} {station.time_since_change}
					</span>
				)}
			</div>

			{/* Station info */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-lg font-semibold text-white">{station.name}</h3>
					<p className="text-sm text-slate-400">{station.frequency} MHz</p>
				</div>
				<div className="text-right">
					<div className="text-sm text-slate-400">Uptime Today</div>
					<div
						className={clsx("text-xl font-bold", {
							"text-green-400": station.uptime_percent_today >= 95,
							"text-amber-400":
								station.uptime_percent_today >= 80 &&
								station.uptime_percent_today < 95,
							"text-red-400": station.uptime_percent_today < 80,
						})}>
						{station.uptime_percent_today}%
					</div>
				</div>
			</div>

			{/* Active outage info */}
			{station.active_outage && (
				<div className="alert alert-danger mb-4">
					<AlertTriangle size={14} />
					<div className="text-xs">
						<div className="font-semibold">Active Outage</div>
						<div>
							Down since:{" "}
							{format(new Date(station.active_outage.down_at), "HH:mm:ss")}
						</div>
						{station.active_outage.description && (
							<div className="mt-0.5 text-red-300">
								{station.active_outage.description}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex gap-3 mt-auto">
				{!isOffAir ? (
					<button
						onClick={onReportDown}
						className="btn-danger flex-1 justify-center py-3 text-base font-bold">
						<XCircle size={18} />
						Report FM DOWN
					</button>
				) : (
					<button
						onClick={onReportRestored}
						className="btn-success flex-1 justify-center py-3 text-base font-bold">
						<CheckCircle size={18} />
						Report RESTORED
					</button>
				)}
			</div>
		</div>
	);
}

// ── Emergency Alert Modal ──────────────────────────────────────────────────
function EmergencyAlertModal({ onClose }: { onClose: () => void }) {
	const qc = useQueryClient();
	const [form, setForm] = useState({
		alert_type: "fm_outage",
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
		"All Systems",
	];

	const mutation = useMutation({
		mutationFn: (data: any) => emergencyApi.trigger(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["emergency-alerts"] });
			toast.success("🚨 Emergency alert sent to all relevant authorities!", {
				duration: 6000,
			});
			onClose();
		},
		onError: (e: any) =>
			toast.error(
				"Failed to send alert: " +
					(e.response?.data?.detail || "Unknown error"),
			),
	});

	const toggleSystem = (sys: string) => {
		setForm((p) => ({
			...p,
			affected_systems: p.affected_systems.includes(sys)
				? p.affected_systems.filter((s) => s !== sys)
				: [...p.affected_systems, sys],
		}));
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header bg-red-950/50 border-b border-red-500/30">
					<h3 className="text-xl font-display font-bold text-red-400 flex items-center gap-2">
						<Siren size={22} className="animate-bounce" />
						Send Emergency Alert
					</h3>
				</div>
				<div className="modal-body space-y-5">
					<div className="alert alert-danger">
						<AlertTriangle size={16} className="shrink-0" />
						<div>
							<div className="font-semibold">
								This will immediately notify all administrators, executives, and
								emergency contacts via email and SMS.
							</div>
							<div className="text-xs mt-1 text-red-300">
								Use only for genuine emergencies requiring immediate action.
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
								<option value="fm_outage">FM Station Outage</option>
								<option value="system_down">System Down</option>
								<option value="security_breach">Security Breach</option>
								<option value="infrastructure">Infrastructure Failure</option>
								<option value="data_breach">Data Breach</option>
								<option value="fire">Fire / Evacuation</option>
								<option value="emergency">General Emergency</option>
								<option value="other">Other</option>
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
									"border-red-500": form.severity === "critical",
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
							placeholder="e.g. FM Transmitter Complete Failure"
							className="input"
							required
						/>
					</div>

					<div className="input-group">
						<label className="input-label">Description *</label>
						<textarea
							value={form.description}
							onChange={(e) =>
								setForm((p) => ({ ...p, description: e.target.value }))
							}
							placeholder="Describe the emergency, what happened, current status, and what response is needed..."
							className="textarea h-28"
							required
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
									className={clsx("btn btn-sm border", {
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
						disabled={!form.title || !form.description || mutation.isPending}
						onClick={() => mutation.mutate(form)}
						className="emergency-btn btn-lg px-8">
						{mutation.isPending ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Sending alerts...
							</span>
						) : (
							<span className="flex items-center gap-2">
								<Bell size={18} />
								SEND ALERT NOW
							</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
