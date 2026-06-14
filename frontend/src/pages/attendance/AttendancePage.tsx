// Swahilipot — Attendance Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	Activity,
	MapPin,
	Clock,
	CheckCircle,
	XCircle,
	Calendar,
	AlertTriangle,
	Download,
	Filter,
	Plus,
	LogIn,
	LogOut,
} from "lucide-react";
import { attendanceApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
	present: "badge-green",
	late: "badge-amber",
	absent: "badge-red",
	half_day: "badge-amber",
	leave: "badge-blue",
	holiday: "badge-purple",
};

export default function AttendancePage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<"today" | "history" | "leave">(
		"today",
	);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [gpsLoading, setGpsLoading] = useState(false);

	const { data: todayRecord, isLoading: todayLoading } = useQuery({
		queryKey: ["attendance-today"],
		queryFn: () => attendanceApi.today().then((r) => r.data),
		refetchInterval: 30000,
	});

	const { data: history = [], isLoading: historyLoading } = useQuery({
		queryKey: ["attendance-history"],
		queryFn: () =>
			attendanceApi.history().then((r) => r.data.results || r.data),
		enabled: activeTab === "history",
	});

	const { data: leaveRequests = [] } = useQuery({
		queryKey: ["leave-requests"],
		queryFn: () =>
			attendanceApi.leaveRequests().then((r) => r.data.results || r.data),
		enabled: activeTab === "leave",
	});

	const checkInMutation = useMutation({
		mutationFn: (data: any) => attendanceApi.checkIn(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["attendance-today"] });
			toast.success("✅ Checked in successfully!");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Check-in failed"),
	});

	const checkOutMutation = useMutation({
		mutationFn: (data: any) => attendanceApi.checkOut(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["attendance-today"] });
			toast.success("Checked out successfully!");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Check-out failed"),
	});

	const handleGpsCheckIn = () => {
		setGpsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				checkInMutation.mutate({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					method: "gps",
				});
				setGpsLoading(false);
			},
			(err) => {
				toast.error("Location access denied. Please enable GPS.");
				setGpsLoading(false);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const handleGpsCheckOut = () => {
		setGpsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				checkOutMutation.mutate({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				});
				setGpsLoading(false);
			},
			() => {
				toast.error("Location access denied.");
				setGpsLoading(false);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const isCheckedIn = !!todayRecord?.check_in_time;
	const isCheckedOut = !!todayRecord?.check_out_time;

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Activity size={22} className="text-Swahilipot-400" />
						Attendance
					</h1>
					<p className="page-subtitle">
						GPS-verified check-in, attendance history, and leave management
					</p>
				</div>
				{user?.role === "attachee" && (
					<button
						onClick={() => setShowLeaveModal(true)}
						className="btn-secondary btn-sm">
						<Plus size={14} /> Request Leave
					</button>
				)}
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit">
				{(["today", "history", "leave"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setActiveTab(t)}
						className={clsx(
							"px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all",
							{
								"bg-Swahilipot-600 text-white": activeTab === t,
								"text-slate-400 hover:text-white": activeTab !== t,
							},
						)}>
						{t === "leave"
							? "Leave Requests"
							: t === "history"
								? "History"
								: "Today"}
					</button>
				))}
			</div>

			{/* ── TODAY TAB ── */}
			{activeTab === "today" && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Check-in card */}
					<div className="card">
						<h3 className="font-semibold text-white mb-5 flex items-center gap-2">
							<Clock size={16} className="text-Swahilipot-400" />
							Today — {format(new Date(), "EEEE, MMM d")}
						</h3>

						{todayLoading ? (
							<div className="skeleton h-32 rounded-xl" />
						) : (
							<div className="space-y-4">
								{/* Status */}
								<div
									className={clsx("p-4 rounded-xl border text-center", {
										"bg-green-900/20 border-green-500/30":
											isCheckedIn && !isCheckedOut,
										"bg-surface-elevated border-surface-border":
											!isCheckedIn || isCheckedOut,
									})}>
									{!isCheckedIn ? (
										<p className="text-slate-400 text-sm">
											You haven't checked in yet today.
										</p>
									) : isCheckedOut ? (
										<div>
											<p className="text-green-400 font-semibold">
												✅ Attendance Complete
											</p>
											<p className="text-slate-400 text-sm mt-1">
												{format(parseISO(todayRecord.check_in_time), "HH:mm")} →{" "}
												{format(parseISO(todayRecord.check_out_time), "HH:mm")}
												{todayRecord.total_hours && (
													<span className="text-white ml-2 font-medium">
														({todayRecord.total_hours}h)
													</span>
												)}
											</p>
										</div>
									) : (
										<div>
											<p className="text-green-400 font-semibold animate-pulse">
												🟢 Currently Checked In
											</p>
											<p className="text-slate-400 text-sm mt-1">
												Since{" "}
												{format(parseISO(todayRecord.check_in_time), "HH:mm")}
											</p>
										</div>
									)}
								</div>

								{/* Check-in details */}
								{todayRecord && (
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div className="bg-surface rounded-lg p-3">
											<div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
												Check In
											</div>
											<div className="text-white font-medium">
												{todayRecord.check_in_time
													? format(
															parseISO(todayRecord.check_in_time),
															"HH:mm:ss",
														)
													: "—"}
											</div>
											{todayRecord.check_in_distance_metres != null && (
												<div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
													<MapPin size={9} />{" "}
													{Math.round(todayRecord.check_in_distance_metres)}m
													from workplace
												</div>
											)}
										</div>
										<div className="bg-surface rounded-lg p-3">
											<div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
												Check Out
											</div>
											<div className="text-white font-medium">
												{todayRecord.check_out_time
													? format(
															parseISO(todayRecord.check_out_time),
															"HH:mm:ss",
														)
													: "—"}
											</div>
										</div>
										<div className="bg-surface rounded-lg p-3">
											<div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
												Status
											</div>
											<span
												className={clsx(
													"badge capitalize",
													STATUS_STYLES[todayRecord.status] || "badge-slate",
												)}>
												{todayRecord.status}
											</span>
										</div>
										<div className="bg-surface rounded-lg p-3">
											<div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
												Method
											</div>
											<div className="text-white text-sm capitalize">
												{todayRecord.method?.replace("_", " ")}
											</div>
										</div>
									</div>
								)}

								{/* Action buttons */}
								<div className="flex gap-3">
									{!isCheckedIn && (
										<button
											onClick={handleGpsCheckIn}
											disabled={gpsLoading || checkInMutation.isPending}
											className="btn-success flex-1 justify-center py-3 text-base font-semibold">
											<LogIn size={18} />
											{gpsLoading || checkInMutation.isPending
												? "Getting Location..."
												: "GPS Check In"}
										</button>
									)}
									{isCheckedIn && !isCheckedOut && (
										<button
											onClick={handleGpsCheckOut}
											disabled={gpsLoading || checkOutMutation.isPending}
											className="btn-danger flex-1 justify-center py-3 text-base font-semibold">
											<LogOut size={18} />
											{gpsLoading || checkOutMutation.isPending
												? "Getting Location..."
												: "GPS Check Out"}
										</button>
									)}
								</div>

								<p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
									<MapPin size={10} /> You must be within{" "}
									{user?.branch ? "100m" : "range"} of your workplace to check
									in via GPS
								</p>
							</div>
						)}
					</div>

					{/* This week summary */}
					<div className="card">
						<h3 className="font-semibold text-white mb-4">This Week</h3>
						<div className="space-y-2">
							{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => {
								const statuses = [
									"present",
									"present",
									"late",
									"present",
									null,
								];
								const s = statuses[i];
								return (
									<div
										key={day}
										className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
										<div className="w-10 text-xs text-slate-500 font-medium">
											{day}
										</div>
										<div className="flex-1 bg-surface-elevated rounded-lg h-2 overflow-hidden">
											{s && (
												<div
													className={clsx("h-full rounded-lg", {
														"bg-green-500": s === "present",
														"bg-amber-500": s === "late",
													})}
													style={{ width: s === "late" ? "60%" : "100%" }}
												/>
											)}
										</div>
										<div className="w-16 text-right">
											{s ? (
												<span
													className={clsx(
														"badge text-[10px]",
														STATUS_STYLES[s],
													)}>
													{s}
												</span>
											) : (
												<span className="text-xs text-slate-600">—</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
						<div className="mt-4 pt-4 border-t border-surface-border grid grid-cols-3 gap-3 text-center">
							<div>
								<div className="text-green-400 font-bold text-lg">4</div>
								<div className="text-xs text-slate-500">Present</div>
							</div>
							<div>
								<div className="text-amber-400 font-bold text-lg">1</div>
								<div className="text-xs text-slate-500">Late</div>
							</div>
							<div>
								<div className="text-white font-bold text-lg">32.5h</div>
								<div className="text-xs text-slate-500">Total Hours</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── HISTORY TAB ── */}
			{activeTab === "history" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Attendance History</h3>
						<button className="btn-secondary btn-sm">
							<Download size={13} /> Export CSV
						</button>
					</div>
					<div className="overflow-x-auto">
						<table className="data-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Check In</th>
									<th>Check Out</th>
									<th>Hours</th>
									<th>Status</th>
									<th>Method</th>
								</tr>
							</thead>
							<tbody>
								{historyLoading ? (
									[...Array(6)].map((_, i) => (
										<tr key={i}>
											<td colSpan={6}>
												<div className="skeleton h-8 w-full" />
											</td>
										</tr>
									))
								) : history.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="text-center py-10 text-slate-500">
											No attendance records yet
										</td>
									</tr>
								) : (
									history.map((r: any) => (
										<tr key={r.id}>
											<td className="font-medium text-white">
												{format(parseISO(r.date), "EEE, dd MMM yyyy")}
											</td>
											<td className="font-mono text-xs">
												{r.check_in_time
													? format(parseISO(r.check_in_time), "HH:mm")
													: "—"}
											</td>
											<td className="font-mono text-xs">
												{r.check_out_time
													? format(parseISO(r.check_out_time), "HH:mm")
													: "—"}
											</td>
											<td className="text-slate-300">
												{r.total_hours ? `${r.total_hours}h` : "—"}
											</td>
											<td>
												<span
													className={clsx(
														"badge capitalize",
														STATUS_STYLES[r.status] || "badge-slate",
													)}>
													{r.status}
												</span>
											</td>
											<td className="text-slate-400 text-xs capitalize">
												{r.method?.replace("_", " ")}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* ── LEAVE TAB ── */}
			{activeTab === "leave" && (
				<div className="card">
					<div className="flex items-center justify-between mb-5">
						<h3 className="font-semibold text-white">Leave Requests</h3>
						<button
							onClick={() => setShowLeaveModal(true)}
							className="btn-primary btn-sm">
							<Plus size={13} /> New Request
						</button>
					</div>
					{leaveRequests.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							<Calendar size={32} className="mx-auto mb-3 opacity-30" />
							<p>No leave requests yet</p>
						</div>
					) : (
						<div className="space-y-3">
							{leaveRequests.map((req: any) => (
								<div
									key={req.id}
									className="p-4 bg-surface rounded-xl border border-surface-border flex items-start gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-sm font-medium text-white capitalize">
												{req.leave_type?.replace("_", " ")} Leave
											</span>
											<span
												className={clsx("badge text-[10px]", {
													"badge-amber": req.status === "pending",
													"badge-green": req.status === "approved",
													"badge-red": req.status === "rejected",
													"badge-slate": req.status === "cancelled",
												})}>
												{req.status}
											</span>
										</div>
										<p className="text-xs text-slate-400">
											{format(parseISO(req.start_date), "dd MMM")} →{" "}
											{format(parseISO(req.end_date), "dd MMM yyyy")} ·{" "}
											{req.days_requested} day(s)
										</p>
										<p className="text-xs text-slate-500 mt-1">{req.reason}</p>
										{req.review_notes && (
											<p className="text-xs text-amber-400 mt-1 italic">
												"{req.review_notes}"
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{showLeaveModal && (
				<LeaveModal
					onClose={() => setShowLeaveModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["leave-requests"] });
						setShowLeaveModal(false);
					}}
				/>
			)}
		</div>
	);
}

function LeaveModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [form, setForm] = useState({
		leave_type: "annual",
		start_date: "",
		end_date: "",
		reason: "",
	});
	const mutation = useMutation({
		mutationFn: (data: any) => attendanceApi.submitLeave(data),
		onSuccess: () => {
			toast.success("Leave request submitted");
			onSuccess();
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Submission failed"),
	});
	const qc = useQueryClient();
	const days =
		form.start_date && form.end_date
			? Math.ceil(
					(new Date(form.end_date).getTime() -
						new Date(form.start_date).getTime()) /
						86400000,
				) + 1
			: 0;

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Request Leave</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="input-group">
						<label className="input-label">Leave Type</label>
						<select
							value={form.leave_type}
							onChange={(e) =>
								setForm((p) => ({ ...p, leave_type: e.target.value }))
							}
							className="select-input">
							{[
								["annual", "Annual Leave"],
								["sick", "Sick Leave"],
								["emergency", "Emergency Leave"],
								["study", "Study Leave"],
								["other", "Other"],
							].map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="input-group">
							<label className="input-label">Start Date</label>
							<input
								type="date"
								value={form.start_date}
								onChange={(e) =>
									setForm((p) => ({ ...p, start_date: e.target.value }))
								}
								className="input"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">End Date</label>
							<input
								type="date"
								value={form.end_date}
								onChange={(e) =>
									setForm((p) => ({ ...p, end_date: e.target.value }))
								}
								className="input"
							/>
						</div>
					</div>
					{days > 0 && (
						<div className="alert alert-info">
							<span>{days} working day(s) requested</span>
						</div>
					)}
					<div className="input-group">
						<label className="input-label">Reason *</label>
						<textarea
							value={form.reason}
							onChange={(e) =>
								setForm((p) => ({ ...p, reason: e.target.value }))
							}
							className="textarea h-24"
							placeholder="Briefly explain your reason..."
						/>
					</div>
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						onClick={() => mutation.mutate({ ...form, days_requested: days })}
						disabled={mutation.isPending || !form.reason || !form.start_date}
						className="btn-primary">
						{mutation.isPending ? "Submitting..." : "Submit Request"}
					</button>
				</div>
			</div>
		</div>
	);
}
