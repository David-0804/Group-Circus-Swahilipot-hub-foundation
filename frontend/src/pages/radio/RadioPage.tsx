// Swahilipot — Radio Schedule Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import {
	Radio,
	Plus,
	Calendar,
	Clock,
	ChevronLeft,
	ChevronRight,
	Mic2,
	AlertCircle,
} from "lucide-react";
import { radioApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import clsx from "clsx";

const SHOW_TYPE_COLORS: Record<string, string> = {
	news: "bg-red-500/20 text-red-300 border-red-500/30",
	music: "bg-blue-500/20 text-blue-300 border-blue-500/30",
	talk: "bg-purple-500/20 text-purple-300 border-purple-500/30",
	sport: "bg-green-500/20 text-green-300 border-green-500/30",
	drama: "bg-amber-500/20 text-amber-300 border-amber-500/30",
	education: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
	other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function RadioPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isAdmin = [
		"broadcast_admin",
		"broadcast_staff",
		"system_admin",
	].includes(user?.role || "");
	const isPresenter = user?.role === "presenter";
	const [weekStart, setWeekStart] = useState(() =>
		startOfWeek(new Date(), { weekStartsOn: 1 }),
	);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showPlanModal, setShowPlanModal] = useState<any>(null);
	const [selectedSlot, setSelectedSlot] = useState<any>(null);

	const weekEnd = addDays(weekStart, 6);
	const { data: slots = [], isLoading } = useQuery({
		queryKey: ["radio-schedule", weekStart],
		queryFn: () =>
			radioApi
				.schedule({
					start: format(weekStart, "yyyy-MM-dd"),
					end: format(weekEnd, "yyyy-MM-dd"),
				})
				.then((r) => r.data.results || r.data),
		refetchInterval: 60000,
	});

	const { data: mySlots = [] } = useQuery({
		queryKey: ["my-radio-schedule"],
		queryFn: () => radioApi.mySchedule().then((r) => r.data),
		enabled: isPresenter,
	});

	const submitPlanMutation = useMutation({
		mutationFn: ({ id, show_plan }: any) =>
			radioApi.submitShowPlan(id, { show_plan }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["radio-schedule"] });
			setShowPlanModal(null);
			toast.success("Show plan submitted!");
		},
	});

	const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
	const HOURS = Array.from({ length: 24 }, (_, i) => i);

	const getSlotsForDay = (day: Date) =>
		slots.filter(
			(s: any) =>
				format(parseISO(s.start_datetime), "yyyy-MM-dd") ===
				format(day, "yyyy-MM-dd"),
		);

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Radio size={22} className="text-Swahilipot-400" />
						Radio Schedule
					</h1>
					<p className="page-subtitle">
						Conflict-free broadcast scheduling and presenter portal
					</p>
				</div>
				{isAdmin && (
					<button
						onClick={() => setShowCreateModal(true)}
						className="btn-primary">
						<Plus size={15} />
						Create Slot
					</button>
				)}
			</div>

			{/* My upcoming slots (presenter view) */}
			{isPresenter && mySlots.length > 0 && (
				<div className="card border-Swahilipot-500/20">
					<h3 className="font-semibold text-white mb-3 flex items-center gap-2">
						<Mic2 size={15} className="text-Swahilipot-400" /> My Upcoming Slots
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{mySlots.slice(0, 3).map((slot: any) => (
							<div
								key={slot.id}
								className="p-3 bg-surface rounded-xl border border-surface-border">
								<div className="font-medium text-white text-sm">
									{slot.show_name}
								</div>
								<div className="text-xs text-slate-400 mt-0.5">
									{format(parseISO(slot.start_datetime), "EEE dd MMM, HH:mm")} —{" "}
									{format(parseISO(slot.end_datetime), "HH:mm")}
								</div>
								<div className="text-xs text-slate-500">
									{slot.frequency_name}
								</div>
								<div className="flex items-center justify-between mt-2">
									{!slot.show_plan ? (
										<span className="badge-amber text-[10px] flex items-center gap-1">
											<AlertCircle size={9} />
											Plan needed
										</span>
									) : (
										<span className="badge-green text-[10px]">
											Plan submitted
										</span>
									)}
									{!slot.show_plan && (
										<button
											onClick={() => setShowPlanModal(slot)}
											className="btn-primary btn-sm text-xs">
											Submit Plan
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Week navigation */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => setWeekStart((d) => addDays(d, -7))}
					className="btn-secondary btn-sm">
					<ChevronLeft size={14} />
				</button>
				<span className="text-sm font-semibold text-white">
					{format(weekStart, "dd MMM")} — {format(weekEnd, "dd MMM yyyy")}
				</span>
				<button
					onClick={() => setWeekStart((d) => addDays(d, 7))}
					className="btn-secondary btn-sm">
					<ChevronRight size={14} />
				</button>
			</div>

			{/* Weekly grid */}
			<div className="card overflow-x-auto">
				<div
					className="grid min-w-[700px]"
					style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
					{/* Header */}
					<div className="py-2" />
					{days.map((day) => (
						<div
							key={day.toISOString()}
							className={clsx(
								"py-2 px-2 text-center border-l border-surface-border",
								{
									"bg-Swahilipot-600/10":
										format(day, "yyyy-MM-dd") ===
										format(new Date(), "yyyy-MM-dd"),
								},
							)}>
							<div className="text-xs text-slate-400 uppercase tracking-wide">
								{format(day, "EEE")}
							</div>
							<div
								className={clsx("text-sm font-bold mt-0.5", {
									"text-Swahilipot-400":
										format(day, "yyyy-MM-dd") ===
										format(new Date(), "yyyy-MM-dd"),
									"text-white":
										format(day, "yyyy-MM-dd") !==
										format(new Date(), "yyyy-MM-dd"),
								})}>
								{format(day, "d")}
							</div>
						</div>
					))}

					{/* Time slots — show only hours with content + a few buffer hours */}
					{HOURS.filter((h) => h >= 5 && h <= 23).map((hour) => (
						<div key={hour} className="contents">
							<div className="py-3 pr-2 text-right text-[10px] text-slate-600 border-t border-surface-border/30">
								{hour.toString().padStart(2, "0")}:00
							</div>
							{days.map((day) => {
								const daySlots = getSlotsForDay(day).filter((s: any) => {
									const h = parseISO(s.start_datetime).getHours();
									return h === hour;
								});
								return (
									<div
										key={day.toISOString() + hour}
										className="border-t border-l border-surface-border/30 min-h-[40px] p-0.5">
										{daySlots.map((slot: any) => (
											<button
												key={slot.id}
												onClick={() => setSelectedSlot(slot)}
												className={clsx(
													"w-full text-left p-1.5 rounded text-[10px] border font-medium leading-tight mb-0.5 hover:opacity-80 transition-opacity",
													SHOW_TYPE_COLORS[slot.show_type] ||
														SHOW_TYPE_COLORS.other,
												)}>
												<div className="truncate font-semibold">
													{slot.show_name}
												</div>
												<div className="opacity-70">
													{format(parseISO(slot.start_datetime), "HH:mm")}–
													{format(parseISO(slot.end_datetime), "HH:mm")}
												</div>
												<div className="opacity-60 truncate">
													{slot.presenter_name}
												</div>
												{!slot.show_plan && (
													<div className="text-amber-400 opacity-90">
														⚠ No plan
													</div>
												)}
											</button>
										))}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>

			{/* Slot detail modal */}
			{selectedSlot && (
				<div className="modal-backdrop" onClick={() => setSelectedSlot(null)}>
					<div className="modal-box" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<div>
								<h3 className="font-semibold text-white">
									{selectedSlot.show_name}
								</h3>
								<p className="text-xs text-slate-400 mt-0.5">
									{selectedSlot.frequency_name}
								</p>
							</div>
							<span
								className={clsx(
									"badge capitalize",
									SHOW_TYPE_COLORS[selectedSlot.show_type] || "",
								)}>
								{selectedSlot.show_type}
							</span>
						</div>
						<div className="modal-body space-y-3">
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div className="bg-surface rounded-lg p-3">
									<div className="text-slate-500 text-xs mb-1">Start</div>
									<div className="text-white">
										{format(
											parseISO(selectedSlot.start_datetime),
											"dd MMM yyyy, HH:mm",
										)}
									</div>
								</div>
								<div className="bg-surface rounded-lg p-3">
									<div className="text-slate-500 text-xs mb-1">End</div>
									<div className="text-white">
										{format(parseISO(selectedSlot.end_datetime), "HH:mm")}
									</div>
								</div>
								<div className="bg-surface rounded-lg p-3">
									<div className="text-slate-500 text-xs mb-1">Presenter</div>
									<div className="text-white">
										{selectedSlot.presenter_name}
									</div>
								</div>
								<div className="bg-surface rounded-lg p-3">
									<div className="text-slate-500 text-xs mb-1">Status</div>
									<div
										className={clsx("capitalize", {
											"text-green-400": selectedSlot.status === "live",
											"text-amber-400": selectedSlot.status === "scheduled",
											"text-slate-400": true,
										})}>
										{selectedSlot.status}
									</div>
								</div>
							</div>
							{selectedSlot.show_plan ? (
								<div className="bg-surface rounded-xl p-4">
									<div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
										Show Plan
									</div>
									<p className="text-sm text-slate-200 leading-relaxed">
										{selectedSlot.show_plan}
									</p>
								</div>
							) : (
								<div className="alert alert-warning">
									<AlertCircle size={14} />
									<span>No show plan submitted yet.</span>
								</div>
							)}
						</div>
						<div className="modal-footer">
							<button
								onClick={() => setSelectedSlot(null)}
								className="btn-secondary">
								Close
							</button>
							{isPresenter &&
								selectedSlot.presenter === user?.id &&
								!selectedSlot.show_plan && (
									<button
										onClick={() => {
											setShowPlanModal(selectedSlot);
											setSelectedSlot(null);
										}}
										className="btn-primary">
										Submit Show Plan
									</button>
								)}
						</div>
					</div>
				</div>
			)}

			{/* Submit show plan */}
			{showPlanModal && (
				<div className="modal-backdrop" onClick={() => setShowPlanModal(null)}>
					<div className="modal-box" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="font-semibold text-white">
								Submit Show Plan — {showPlanModal.show_name}
							</h3>
						</div>
						<ShowPlanForm
							slot={showPlanModal}
							onSubmit={(plan: string) =>
								submitPlanMutation.mutate({
									id: showPlanModal.id,
									show_plan: plan,
								})
							}
							isPending={submitPlanMutation.isPending}
							onClose={() => setShowPlanModal(null)}
						/>
					</div>
				</div>
			)}

			{showCreateModal && (
				<CreateSlotModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["radio-schedule"] });
						setShowCreateModal(false);
					}}
				/>
			)}
		</div>
	);
}

function ShowPlanForm({ slot, onSubmit, isPending, onClose }: any) {
	const [plan, setPlan] = useState(slot.show_plan || "");
	return (
		<>
			<div className="modal-body space-y-4">
				<div className="card bg-surface/60 text-sm">
					<div className="text-slate-400">
						Show: <span className="text-white">{slot.show_name}</span>
					</div>
					<div className="text-slate-400">
						Time:{" "}
						<span className="text-white">
							{format(parseISO(slot.start_datetime), "dd MMM, HH:mm")} —{" "}
							{format(parseISO(slot.end_datetime), "HH:mm")}
						</span>
					</div>
				</div>
				<div className="input-group">
					<label className="input-label">
						Show Plan — Topics, Guests, Content Notes *
					</label>
					<textarea
						value={plan}
						onChange={(e) => setPlan(e.target.value)}
						rows={6}
						className="textarea"
						placeholder="Outline your topics, any guests, music selections, news segments, etc..."
					/>
				</div>
			</div>
			<div className="modal-footer">
				<button onClick={onClose} className="btn-secondary">
					Cancel
				</button>
				<button
					disabled={!plan.trim() || isPending}
					onClick={() => onSubmit(plan)}
					className="btn-primary">
					{isPending ? "Submitting..." : "Submit Plan"}
				</button>
			</div>
		</>
	);
}

function CreateSlotModal({ onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm();
	const { data: frequencies = [] } = useQuery({
		queryKey: ["radio-frequencies"],
		queryFn: () => radioApi.frequencies().then((r) => r.data),
	});
	const { data: shows = [] } = useQuery({
		queryKey: ["radio-shows"],
		queryFn: () => radioApi.shows().then((r) => r.data),
	});
	const mutation = useMutation({
		mutationFn: (data: any) => radioApi.createSlot(data),
		onSuccess: () => {
			toast.success("Slot created!");
			onSuccess();
		},
		onError: (e: any) =>
			toast.error(
				e.response?.data?.detail ||
					"Slot creation failed — check for conflicts",
			),
	});
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Create Radio Slot</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="alert alert-info">
							<span>
								The system will automatically check for scheduling conflicts.
							</span>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Frequency *</label>
								<select
									{...register("frequency", { required: true })}
									className="select-input">
									<option value="">Select...</option>
									{frequencies.map((f: any) => (
										<option key={f.id} value={f.id}>
											{f.name} ({f.frequency_mhz} MHz)
										</option>
									))}
								</select>
							</div>
							<div className="input-group">
								<label className="input-label">Show *</label>
								<select
									{...register("show", { required: true })}
									className="select-input">
									<option value="">Select...</option>
									{shows.map((s: any) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Start *</label>
								<input
									type="datetime-local"
									{...register("start_datetime", { required: true })}
									className="input"
								/>
							</div>
							<div className="input-group">
								<label className="input-label">End *</label>
								<input
									type="datetime-local"
									{...register("end_datetime", { required: true })}
									className="input"
								/>
							</div>
						</div>
						<div className="input-group">
							<label className="input-label">Presenter User ID *</label>
							<input
								{...register("presenter", { required: true })}
								className="input"
								placeholder="User ID"
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
							{mutation.isPending ? "Creating..." : "Create Slot"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
