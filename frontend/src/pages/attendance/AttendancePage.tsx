// Swahilipot — Attendance Page
import { useState, useEffect, useRef } from "react";
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
	Navigation,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	User,
} from "lucide-react";
import { attendanceApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── All roles that may request leave ─────────────────────────────────────────
const LEAVE_ELIGIBLE_ROLES = new Set([
	"system_admin",
	"broadcast_admin",
	"hr_officer",
	"supervisor",
	"department_leader",
	"executive",
	"data_analyst",
	"finance",
	"broadcast_staff",
	"journalist",
	"presenter",
	"editor",
	"videographer",
	"station_engineer",
	"attachee",
	"university_coordinator",
]);

// ── Roles that can approve / reject leave ────────────────────────────────────
const LEAVE_REVIEW_ROLES = new Set([
	"system_admin",
	"hr_officer",
	"supervisor",
	"department_leader",
	"executive",
]);

// ── Workplace coordinates (update to match your actual office location) ───────
const WORKPLACE_LAT = -4.0435; // Swahilipot Hub, Mombasa
const WORKPLACE_LNG = 39.6682;
const CHECKIN_RADIUS_M = 100; // metres

// ── Haversine distance helper ─────────────────────────────────────────────────
function haversineMetres(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371000;
	const toRad = (v: number) => (v * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STATUS_STYLES: Record<string, string> = {
	present: "badge-green",
	late: "badge-amber",
	absent: "badge-red",
	half_day: "badge-amber",
	leave: "badge-blue",
	holiday: "badge-purple",
};

// ── Distance badge component ──────────────────────────────────────────────────
function DistanceBadge({
	distance,
	radius,
}: {
	distance: number | null;
	radius: number;
}) {
	if (distance === null) return null;
	const withinRange = distance <= radius;
	return (
		<div
			className={clsx(
				"flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium",
				withinRange
					? "bg-green-900/30 text-green-400 border border-green-500/30"
					: "bg-red-900/30 text-red-400 border border-red-500/30",
			)}>
			<Navigation size={11} />
			{Math.round(distance)}m from workplace
			{withinRange ? (
				<CheckCircle size={11} className="ml-0.5" />
			) : (
				<XCircle size={11} className="ml-0.5" />
			)}
		</div>
	);
}

export default function AttendancePage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<"today" | "history" | "leave">(
		"today",
	);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [gpsLoading, setGpsLoading] = useState(false);

	// ── Live GPS distance tracking ────────────────────────────────────────────
	const [liveDistance, setLiveDistance] = useState<number | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const watchIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			setLocationError("Geolocation is not supported by your browser.");
			return;
		}

		// Start watching position so the distance updates in real time
		watchIdRef.current = navigator.geolocation.watchPosition(
			(pos) => {
				const d = haversineMetres(
					pos.coords.latitude,
					pos.coords.longitude,
					WORKPLACE_LAT,
					WORKPLACE_LNG,
				);
				setLiveDistance(d);
				setLocationError(null);
			},
			(err) => {
				setLocationError("Enable location access to see your distance.");
				setLiveDistance(null);
			},
			{ enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
		);

		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, []);

	const canRequestLeave = user?.role && LEAVE_ELIGIBLE_ROLES.has(user.role);
	const canReviewLeave = user?.role && LEAVE_REVIEW_ROLES.has(user.role);

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
		onError: (e: any) => {
			const msg =
				e.response?.data?.detail ||
				e.response?.data?.message ||
				(typeof e.response?.data === "string" ? e.response.data : null) ||
				"Check-in failed";
			toast.error(msg);
		},
	});

	const checkOutMutation = useMutation({
		mutationFn: (data: any) => attendanceApi.checkOut(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["attendance-today"] });
			toast.success("👋 Checked out successfully!");
		},
		onError: (e: any) => {
			const msg =
				e.response?.data?.detail ||
				e.response?.data?.message ||
				(typeof e.response?.data === "string" ? e.response.data : null) ||
				"Check-out failed";
			toast.error(msg);
		},
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
	const withinRange = liveDistance !== null && liveDistance <= CHECKIN_RADIUS_M;

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
				{canRequestLeave && (
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
								{/* ── Live distance indicator ── */}
								<div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border">
									<div className="flex items-center gap-2 text-sm text-slate-400">
										<MapPin size={14} className="text-Swahilipot-400" />
										Your distance to workstation
									</div>
									{locationError ? (
										<span className="text-xs text-amber-400 flex items-center gap-1">
											<AlertTriangle size={11} />
											{locationError}
										</span>
									) : liveDistance === null ? (
										<span className="text-xs text-slate-500 animate-pulse">
											Detecting…
										</span>
									) : (
										<DistanceBadge
											distance={liveDistance}
											radius={CHECKIN_RADIUS_M}
										/>
									)}
								</div>

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
											disabled={
												gpsLoading ||
												checkInMutation.isPending ||
												(liveDistance !== null && !withinRange)
											}
											title={
												liveDistance !== null && !withinRange
													? `You are ${Math.round(liveDistance)}m away — must be within ${CHECKIN_RADIUS_M}m`
													: undefined
											}
											className={clsx(
												"btn-success flex-1 justify-center py-3 text-base font-semibold",
												liveDistance !== null &&
													!withinRange &&
													"opacity-50 cursor-not-allowed",
											)}>
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
									<MapPin size={10} /> You must be within {CHECKIN_RADIUS_M}m of
									your workplace to check in via GPS
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
						{canRequestLeave && (
							<button
								onClick={() => setShowLeaveModal(true)}
								className="btn-primary btn-sm">
								<Plus size={13} /> New Request
							</button>
						)}
					</div>
					{leaveRequests.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							<Calendar size={32} className="mx-auto mb-3 opacity-30" />
							<p>No leave requests yet</p>
						</div>
					) : (
						<div className="space-y-3">
							{leaveRequests.map((req: any) => (
								<LeaveRequestCard
									key={req.id}
									req={req}
									canReview={!!canReviewLeave}
									onReviewed={() =>
										qc.invalidateQueries({ queryKey: ["leave-requests"] })
									}
								/>
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

// ── Leave Request Card (with inline approve / reject for reviewers) ───────────
function LeaveRequestCard({
	req,
	canReview,
	onReviewed,
}: {
	req: any;
	canReview: boolean;
	onReviewed: () => void;
}) {
	const qc = useQueryClient();
	const [showNotes, setShowNotes] = useState(false);
	const [notes, setNotes] = useState("");
	const [pendingAction, setPendingAction] = useState<
		"approved" | "rejected" | null
	>(null);

	const reviewMutation = useMutation({
		mutationFn: ({
			action,
			review_notes,
		}: {
			action: string;
			review_notes: string;
		}) => attendanceApi.reviewLeave(req.id, { status: action, review_notes }),
		onSuccess: (_, vars) => {
			toast.success(
				vars.action === "approved" ? "✅ Leave approved" : "❌ Leave rejected",
			);
			setShowNotes(false);
			setNotes("");
			setPendingAction(null);
			onReviewed();
		},
		onError: (e: any) => {
			const msg =
				e.response?.data?.detail ||
				e.response?.data?.message ||
				"Review failed";
			toast.error(msg);
		},
	});

	const handleAction = (action: "approved" | "rejected") => {
		// If rejecting always ask for notes; approving can go direct
		if (action === "rejected") {
			setPendingAction(action);
			setShowNotes(true);
		} else {
			reviewMutation.mutate({ action, review_notes: "" });
		}
	};

	const handleConfirmWithNotes = () => {
		if (!pendingAction) return;
		reviewMutation.mutate({
			action: pendingAction,
			review_notes: notes.trim(),
		});
	};

	const isPending = req.status === "pending";

	return (
		<div
			className={clsx("p-4 bg-surface rounded-xl border flex flex-col gap-3", {
				"border-amber-500/30": req.status === "pending",
				"border-green-500/30": req.status === "approved",
				"border-red-500/30": req.status === "rejected",
				"border-surface-border": req.status === "cancelled",
			})}>
			{/* ── Header row ── */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<div className="flex items-center gap-2 flex-wrap mb-1">
						{/* Show requester name for reviewers */}
						{canReview && req.user_name && (
							<span className="flex items-center gap-1 text-xs text-slate-400">
								<User size={11} />
								{req.user_name}
							</span>
						)}
						<span className="text-sm font-medium text-white capitalize">
							{req.leave_type?.replace(/_/g, " ")} Leave
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
							Note: {req.review_notes}
						</p>
					)}
				</div>

				{/* ── Review buttons (only for pending + authorised reviewer) ── */}
				{canReview && isPending && !showNotes && (
					<div className="flex gap-2 shrink-0">
						<button
							onClick={() => handleAction("approved")}
							disabled={reviewMutation.isPending}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50 transition-colors disabled:opacity-50">
							<ThumbsUp size={12} />
							Approve
						</button>
						<button
							onClick={() => handleAction("rejected")}
							disabled={reviewMutation.isPending}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 transition-colors disabled:opacity-50">
							<ThumbsDown size={12} />
							Reject
						</button>
					</div>
				)}
			</div>

			{/* ── Notes panel (slides in when rejecting) ── */}
			{showNotes && canReview && isPending && (
				<div className="border-t border-surface-border pt-3 space-y-2">
					<label className="text-xs text-slate-400 flex items-center gap-1">
						<MessageSquare size={11} />
						{pendingAction === "rejected"
							? "Reason for rejection *"
							: "Review notes (optional)"}
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						autoFocus
						placeholder="Add a note for the requester…"
						className="textarea h-20 text-xs w-full"
					/>
					<div className="flex gap-2 justify-end">
						<button
							onClick={() => {
								setShowNotes(false);
								setPendingAction(null);
								setNotes("");
							}}
							className="btn-secondary btn-sm">
							Cancel
						</button>
						<button
							onClick={handleConfirmWithNotes}
							disabled={
								reviewMutation.isPending ||
								(pendingAction === "rejected" && !notes.trim())
							}
							className={clsx(
								"btn-sm font-medium",
								pendingAction === "approved" ? "btn-success" : "btn-danger",
							)}>
							{reviewMutation.isPending
								? "Saving…"
								: pendingAction === "approved"
									? "Confirm Approve"
									: "Confirm Reject"}
						</button>
					</div>
				</div>
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
	const { user } = useAuthStore();
	const isAttachee = user?.role === "attachee";

	const [form, setForm] = useState({
		leave_type: isAttachee ? "sick" : "annual",
		start_date: "",
		end_date: "",
		reason: "",
	});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: (data: any) => attendanceApi.submitLeave(data),
		onSuccess: () => {
			toast.success("Leave request submitted");
			onSuccess();
		},
		onError: (e: any) => {
			// Robustly extract the error message from various API response shapes
			let msg = "Submission failed";
			if (e.response?.data) {
				const d = e.response.data;
				if (typeof d === "string") {
					msg = d;
				} else if (d.detail) {
					msg =
						typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
				} else if (d.message) {
					msg = d.message;
				} else if (d.non_field_errors) {
					msg = Array.isArray(d.non_field_errors)
						? d.non_field_errors.join(", ")
						: d.non_field_errors;
				} else {
					// Collect field-level errors (e.g. { start_date: ["This field is required."] })
					const fieldErrors = Object.entries(d)
						.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
						.join(" | ");
					if (fieldErrors) msg = fieldErrors;
				}
			} else if (e.message) {
				msg = e.message;
			}
			setSubmitError(msg);
			toast.error(msg);
		},
	});

	// Calculate the number of days correctly:
	// Both dates are inclusive, so end - start + 1 (but clamp to >= 1 only if both set)
	const days =
		form.start_date && form.end_date
			? Math.max(
					1,
					Math.ceil(
						(new Date(form.end_date).getTime() -
							new Date(form.start_date).getTime()) /
							86400000,
					) + 1,
				)
			: 0;

	// Validate end_date >= start_date
	const dateError =
		form.start_date &&
		form.end_date &&
		new Date(form.end_date) < new Date(form.start_date)
			? "End date cannot be before start date."
			: null;

	const canSubmit =
		!mutation.isPending &&
		!!form.reason.trim() &&
		!!form.start_date &&
		!!form.end_date &&
		!dateError;

	const handleSubmit = () => {
		setSubmitError(null);
		mutation.mutate({
			leave_type: form.leave_type,
			start_date: form.start_date,
			end_date: form.end_date,
			reason: form.reason.trim(),
			days_requested: days,
		});
	};

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
								...(!isAttachee
									? [["annual", "Annual Leave"] as [string, string]]
									: []),
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
								min={form.start_date || undefined}
								onChange={(e) =>
									setForm((p) => ({ ...p, end_date: e.target.value }))
								}
								className="input"
							/>
						</div>
					</div>

					{dateError && (
						<div className="alert alert-error text-xs">
							<AlertTriangle size={13} /> {dateError}
						</div>
					)}

					{days > 0 && !dateError && (
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

					{/* Surface API error inline so the user knows exactly what went wrong */}
					{submitError && (
						<div className="alert alert-error text-xs flex items-start gap-2">
							<AlertTriangle size={13} className="mt-0.5 shrink-0" />
							<span>{submitError}</span>
						</div>
					)}
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={!canSubmit}
						className="btn-primary">
						{mutation.isPending ? "Submitting..." : "Submit Request"}
					</button>
				</div>
			</div>
		</div>
	);
}
