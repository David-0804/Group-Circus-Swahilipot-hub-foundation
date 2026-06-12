// Nexus — Feedback & Complaints Ticketing
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	MessageSquare,
	Plus,
	Search,
	Filter,
	CheckCircle,
	Clock,
	AlertCircle,
	ChevronRight,
	BarChart3,
} from "lucide-react";
import { feedbackApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
	open: "badge-red",
	in_progress: "badge-amber",
	resolved: "badge-green",
	closed: "badge-slate",
};
const PRIORITY_STYLES: Record<string, string> = {
	low: "text-slate-400",
	medium: "text-blue-400",
	high: "text-amber-400",
	urgent: "text-red-400",
};
const CATEGORIES = [
	"Equipment",
	"Wi-Fi",
	"Scheduling",
	"Facilities",
	"Staff",
	"Software",
	"Broadcast",
	"Other",
];

export default function FeedbackPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isAdmin = [
		"system_admin",
		"broadcast_admin",
		"hr_officer",
		"ict",
		"operations",
	].includes(user?.role || "");
	const [activeTab, setActiveTab] = useState<"tickets" | "stats">("tickets");
	const [showNewModal, setShowNewModal] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<any>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	const { data: ticketsData, isLoading } = useQuery({
		queryKey: ["feedback", search, statusFilter],
		queryFn: () =>
			feedbackApi
				.list({
					search: search || undefined,
					status: statusFilter || undefined,
				})
				.then((r) => r.data),
		refetchInterval: 60000,
	});

	const tickets = Array.isArray(ticketsData)
    ? ticketsData
    : Array.isArray(ticketsData?.results)
        ? ticketsData.results
        : [];

	const { data: stats } = useQuery({
		queryKey: ["feedback-stats"],
		queryFn: () => feedbackApi.stats().then((r) => r.data),
		enabled: activeTab === "stats",
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: any) => feedbackApi.update(id, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["feedback"] });
			setSelectedTicket(null);
			toast.success("Ticket updated");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Update failed"),
	});

	const openTickets = tickets.filter((t: any) => t.status === "open");
	const inProgressTickets = tickets.filter(
		(t: any) => t.status === "in_progress",
	);
	const resolvedTickets = tickets.filter((t: any) => t.status === "resolved");

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<MessageSquare size={22} className="text-Swahilipot-400" /> Feedback
						& Complaints
					</h1>
					<p className="page-subtitle">
						Structured ticketing for institutional complaints, suggestions, and
						feedback
					</p>
				</div>
				<button onClick={() => setShowNewModal(true)} className="btn-primary">
					<Plus size={15} /> New Ticket
				</button>
			</div>

			{/* Summary stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[
					{ label: "Open", value: openTickets.length, color: "text-red-400" },
					{
						label: "In Progress",
						value: inProgressTickets.length,
						color: "text-amber-400",
					},
					{
						label: "Resolved",
						value: resolvedTickets.length,
						color: "text-green-400",
					},
					{ label: "Total", value: tickets.length, color: "text-white" },
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3">
				<div className="relative flex-1 min-w-48">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search tickets..."
						className="input pl-9 py-2"
					/>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="select-input w-36">
					<option value="">All Statuses</option>
					<option value="open">Open</option>
					<option value="in_progress">In Progress</option>
					<option value="resolved">Resolved</option>
					<option value="closed">Closed</option>
				</select>
			</div>

			{/* Tickets list */}
			<div className="space-y-3">
				{isLoading ? (
					[...Array(5)].map((_, i) => (
						<div key={i} className="skeleton h-28 rounded-xl" />
					))
				) : tickets.length === 0 ? (
					<div className="card text-center py-12">
						<MessageSquare
							size={32}
							className="mx-auto text-slate-500 mb-3 opacity-30"
						/>
						<p className="text-slate-400">No tickets found</p>
					</div>
				) : (
					tickets.map((ticket: any) => (
						<div
							key={ticket.id}
							className="card-hover group"
							onClick={() => setSelectedTicket(ticket)}>
							<div className="flex items-start gap-4">
								<div
									className={clsx(
										"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
										{
											"bg-red-500/10": ticket.status === "open",
											"bg-amber-500/10": ticket.status === "in_progress",
											"bg-green-500/10": ticket.status === "resolved",
											"bg-slate-500/10": ticket.status === "closed",
										},
									)}>
									{ticket.status === "resolved" ? (
										<CheckCircle size={18} className="text-green-400" />
									) : ticket.status === "in_progress" ? (
										<Clock size={18} className="text-amber-400" />
									) : (
										<AlertCircle size={18} className="text-red-400" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="font-medium text-white text-sm group-hover:text-Swahilipot-400 transition-colors">
											#{ticket.ticket_number || ticket.id?.slice(0, 8)} —{" "}
											{ticket.title || ticket.category}
										</span>
										<span
											className={clsx(
												"badge text-[10px]",
												STATUS_STYLES[ticket.status] || "badge-slate",
											)}>
											{ticket.status?.replace("_", " ")}
										</span>
										{ticket.priority && (
											<span
												className={clsx(
													"text-[10px] font-medium capitalize",
													PRIORITY_STYLES[ticket.priority],
												)}>
												{ticket.priority}
											</span>
										)}
									</div>
									<p className="text-xs text-slate-400 mt-1 line-clamp-1">
										{ticket.description || ticket.body}
									</p>
									<div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
										{ticket.category && (
											<span className="badge-slate text-[10px]">
												{ticket.category}
											</span>
										)}
										{ticket.submitted_by_name && (
											<span>By {ticket.submitted_by_name}</span>
										)}
										<span>
											{format(
												parseISO(ticket.created_at),
												"dd MMM yyyy, HH:mm",
											)}
										</span>
									</div>
								</div>
								<ChevronRight
									size={14}
									className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1"
								/>
							</div>
						</div>
					))
				)}
			</div>

			{/* New ticket modal */}
			{showNewModal && (
				<NewTicketModal
					onClose={() => setShowNewModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["feedback"], exact: false });
						setShowNewModal(false);
					}}
				/>
			)}

			{/* Ticket detail modal */}
			{selectedTicket && (
				<TicketDetailModal
					ticket={selectedTicket}
					isAdmin={isAdmin}
					onClose={() => setSelectedTicket(null)}
					onUpdate={(data: any) =>
						updateMutation.mutate({ id: selectedTicket.id, data })
					}
					isPending={updateMutation.isPending}
				/>
			)}
		</div>
	);
}

function NewTicketModal({ onClose, onSuccess }: any) {
	const { register, handleSubmit } = useForm();
	const mutation = useMutation({
		mutationFn: (data: any) => feedbackApi.submit(data),
		onSuccess: () => {
			toast.success("Ticket submitted! You will receive a confirmation.");
			onSuccess();
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Submission failed"),
	});
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Submit New Ticket</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">Category *</label>
								<select
									{...register("category", { required: true })}
									className="select-input">
									<option value="">Select...</option>
									{CATEGORIES.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>
							</div>
							<div className="input-group">
								<label className="input-label">Priority</label>
								<select {...register("priority")} className="select-input">
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="urgent">Urgent</option>
								</select>
							</div>
						</div>
						<div className="input-group">
							<label className="input-label">Title *</label>
							<input
								{...register("title", { required: true })}
								className="input"
								placeholder="Brief description of the issue"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Full Description *</label>
							<textarea
								{...register("description", { required: true })}
								rows={5}
								className="textarea"
								placeholder="Describe the issue in detail, including when it started and how it affects you..."
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
							{mutation.isPending ? "Submitting..." : "Submit Ticket"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function TicketDetailModal({
	ticket: t,
	isAdmin,
	onClose,
	onUpdate,
	isPending,
}: any) {
	const [response, setResponse] = useState(t.admin_response || "");
	const [status, setStatus] = useState(t.status);
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<div>
						<h3 className="font-semibold text-white">
							#{t.ticket_number || t.id?.slice(0, 8)} — {t.title || t.category}
						</h3>
						<div className="flex items-center gap-2 mt-1">
							<span
								className={clsx(
									"badge text-[10px]",
									STATUS_STYLES[t.status] || "badge-slate",
								)}>
								{t.status?.replace("_", " ")}
							</span>
							{t.category && (
								<span className="badge-slate text-[10px]">{t.category}</span>
							)}
						</div>
					</div>
				</div>
				<div className="modal-body space-y-4">
					<div className="bg-surface rounded-xl p-4">
						<div className="text-xs text-slate-500 mb-2">
							Submitted by {t.submitted_by_name || "User"} ·{" "}
							{format(parseISO(t.created_at), "dd MMM yyyy, HH:mm")}
						</div>
						<p className="text-sm text-slate-200 leading-relaxed">
							{t.description || t.body}
						</p>
					</div>
					{t.admin_response && (
						<div className="bg-Swahilipot-900/20 rounded-xl p-4 border border-Swahilipot-500/20">
							<div className="text-xs text-Swahilipot-400 mb-1">
								Admin Response
							</div>
							<p className="text-sm text-slate-200">{t.admin_response}</p>
						</div>
					)}
					{isAdmin && (
						<div className="space-y-3 border-t border-surface-border pt-4">
							<div className="grid grid-cols-2 gap-3">
								<div className="input-group">
									<label className="input-label">Update Status</label>
									<select
										value={status}
										onChange={(e) => setStatus(e.target.value)}
										className="select-input">
										<option value="open">Open</option>
										<option value="in_progress">In Progress</option>
										<option value="resolved">Resolved</option>
										<option value="closed">Closed</option>
									</select>
								</div>
							</div>
							<div className="input-group">
								<label className="input-label">
									Response / Resolution Notes
								</label>
								<textarea
									value={response}
									onChange={(e) => setResponse(e.target.value)}
									rows={4}
									className="textarea"
									placeholder="Provide a response or resolution details..."
								/>
							</div>
						</div>
					)}
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Close
					</button>
					{isAdmin && (
						<button
							disabled={isPending}
							onClick={() => onUpdate({ status, admin_response: response })}
							className="btn-primary">
							{isPending ? "Saving..." : "Update Ticket"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
