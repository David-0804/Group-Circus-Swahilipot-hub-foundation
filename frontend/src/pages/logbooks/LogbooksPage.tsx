// Nexus — Daily Logbooks
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	BookOpen,
	Plus,
	CheckCircle,
	Clock,
	Edit3,
	ChevronRight,
	AlertCircle,
} from "lucide-react";
import { logbooksApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
	draft: "badge-slate",
	submitted: "badge-blue",
	approved: "badge-green",
	rejected: "badge-red",
};

export default function LogbooksPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isSupervisor = [
		"supervisor",
		"department_leader",
		"hr_officer",
		"system_admin",
		"broadcast_admin",
	].includes(user?.role || "");
	const [selectedLogbook, setSelectedLogbook] = useState<any>(null);
	const [showEntryModal, setShowEntryModal] = useState(false);
	const [selectedEntry, setSelectedEntry] = useState<any>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["logbooks"],
		queryFn: () => logbooksApi.list().then((r) => r.data),
	});

	const logbooks = Array.isArray(data)
		? data
		: Array.isArray(data?.results)
			? data.results
			: [];

	const { data: entriesData, isLoading: entriesLoading } = useQuery({
		queryKey: ["logbook-entries", selectedLogbook?.id],
		queryFn: () => logbooksApi.entries(selectedLogbook.id).then((r) => r.data),
		enabled: !!selectedLogbook,
	});

	const entries = Array.isArray(entriesData)
		? entriesData
		: Array.isArray(entriesData?.results)
			? entriesData.results
			: [];

	const addEntryMutation = useMutation({
		mutationFn: (data: any) => logbooksApi.addEntry(selectedLogbook.id, data),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["logbook-entries", selectedLogbook?.id],
			});
			setShowEntryModal(false);
			toast.success("Logbook entry saved!");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Failed to save entry"),
	});
	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<BookOpen size={22} className="text-Nexus-400" />
						Logbooks
					</h1>
					<p className="page-subtitle">
						Daily activity entries, supervisor review, and digital signatures
					</p>
				</div>
				{selectedLogbook && !isSupervisor && (
					<button
						onClick={() => {
							setSelectedEntry(null);
							setShowEntryModal(true);
						}}
						className="btn-primary">
						<Plus size={14} /> Add Entry
					</button>
				)}
			</div>

			{!selectedLogbook ? (
				/* Logbook list */
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{isLoading ? (
						[...Array(3)].map((_, i) => (
							<div key={i} className="skeleton h-36 rounded-xl" />
						))
					) : logbooks.length === 0 ? (
						<div className="col-span-3 card text-center py-12">
							<BookOpen
								size={32}
								className="mx-auto text-slate-500 mb-3 opacity-30"
							/>
							<p className="text-slate-400">
								No logbooks found. Contact your supervisor.
							</p>
						</div>
					) : (
						logbooks.map((lb: any) => (
							<div
								key={lb.id}
								className="card-hover"
								onClick={() => setSelectedLogbook(lb)}>
								<div className="flex items-start justify-between mb-3">
									<BookOpen size={20} className="text-Nexus-400" />
									<span
										className={clsx(
											"badge",
											lb.final_submitted ? "badge-green" : "badge-blue",
										)}>
										{lb.final_submitted ? "Submitted" : "Active"}
									</span>
								</div>
								<h3 className="font-semibold text-white">{lb.title}</h3>
								<p className="text-xs text-slate-400 mt-1">
									{lb.start_date &&
										format(parseISO(lb.start_date), "dd MMM yyyy")}{" "}
									—{" "}
									{lb.end_date && format(parseISO(lb.end_date), "dd MMM yyyy")}
								</p>
								<div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border/50">
									<span className="text-xs text-slate-500">
										Tap to view entries
									</span>
									<ChevronRight size={14} className="text-slate-600" />
								</div>
							</div>
						))
					)}
				</div>
			) : (
				/* Entry list */
				<div className="space-y-4">
					<button
						onClick={() => setSelectedLogbook(null)}
						className="btn-secondary btn-sm">
						← Back to Logbooks
					</button>

					<div className="card">
						<div className="flex items-center justify-between mb-5">
							<div>
								<h3 className="font-semibold text-white">
									{selectedLogbook.title}
								</h3>
								<p className="text-xs text-slate-400 mt-0.5">
									{selectedLogbook.start_date &&
										format(parseISO(selectedLogbook.start_date), "dd MMM")}{" "}
									—{" "}
									{selectedLogbook.end_date &&
										format(parseISO(selectedLogbook.end_date), "dd MMM yyyy")}
								</p>
							</div>
							{!isSupervisor && (
								<button
									onClick={() => {
										setSelectedEntry(null);
										setShowEntryModal(true);
									}}
									className="btn-primary btn-sm">
									<Plus size={13} /> Add Entry
								</button>
							)}
						</div>

						{entriesLoading ? (
							[...Array(4)].map((_, i) => (
								<div key={i} className="skeleton h-20 rounded-xl mb-3" />
							))
						) : entries.length === 0 ? (
							<div className="text-center py-10 text-slate-500">
								<BookOpen size={28} className="mx-auto mb-2 opacity-30" />
								<p>No entries yet. Start writing your daily logbook!</p>
							</div>
						) : (
							<div className="space-y-3">
								{entries.map((entry: any) => (
									<div
										key={entry.id}
										className="p-4 bg-surface rounded-xl border border-surface-border hover:border-Nexus-500/30 cursor-pointer transition-all"
										onClick={() => {
											setSelectedEntry(entry);
											setShowEntryModal(true);
										}}>
										<div className="flex items-center justify-between mb-2">
											<span className="font-medium text-white text-sm">
												{entry.date &&
													format(parseISO(entry.date), "EEEE, dd MMMM yyyy")}
											</span>
											<span
												className={clsx(
													"badge text-[10px]",
													STATUS_STYLES[entry.status] || "badge-slate",
												)}>
												{entry.status}
											</span>
										</div>
										<p className="text-xs text-slate-400 line-clamp-2">
											{entry.activities}
										</p>
										{entry.supervisor_comments && (
											<div className="mt-2 flex items-start gap-1.5 text-xs text-blue-400">
												<CheckCircle size={11} className="mt-0.5 shrink-0" />
												<span className="line-clamp-1">
													{entry.supervisor_comments}
												</span>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{showEntryModal && selectedLogbook && (
				<LogbookEntryModal
					entry={selectedEntry}
					isSupervisor={isSupervisor}
					onClose={() => {
						setShowEntryModal(false);
						setSelectedEntry(null);
					}}
					onSave={(data: any) => addEntryMutation.mutate(data)}
					isPending={addEntryMutation.isPending}
				/>
			)}
		</div>
	);
}

function LogbookEntryModal({
	entry,
	isSupervisor,
	onClose,
	onSave,
	isPending,
}: any) {
	const { register, handleSubmit } = useForm({
		defaultValues: entry || { date: format(new Date(), "yyyy-MM-dd") },
	});
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">
						{entry ? "View Entry" : "New Logbook Entry"}
					</h3>
				</div>
				<form onSubmit={handleSubmit(onSave)}>
					<div className="modal-body space-y-4">
						<div className="input-group">
							<label className="input-label">Date</label>
							<input
								type="date"
								{...register("date", { required: true })}
								className="input"
								disabled={!!entry}
							/>
						</div>
						<div className="input-group">
							<label className="input-label">
								Activities & Tasks Completed *
							</label>
							<textarea
								{...register("activities", { required: true })}
								rows={5}
								className="textarea"
								placeholder="Describe your activities in detail..."
								disabled={isSupervisor}
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Skills Acquired</label>
							<textarea
								{...register("skills_acquired")}
								rows={2}
								className="textarea"
								placeholder="What new skills or knowledge did you gain?"
								disabled={isSupervisor}
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Challenges Faced</label>
							<textarea
								{...register("challenges")}
								rows={2}
								className="textarea"
								placeholder="Any difficulties or challenges?"
								disabled={isSupervisor}
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Reflection</label>
							<textarea
								{...register("reflection")}
								rows={2}
								className="textarea"
								placeholder="Your overall reflection for the day..."
								disabled={isSupervisor}
							/>
						</div>
						{isSupervisor && (
							<div className="input-group border-t border-surface-border pt-4">
								<label className="input-label text-Nexus-400">
									Supervisor Comments
								</label>
								<textarea
									{...register("supervisor_comments")}
									rows={3}
									className="textarea"
									placeholder="Add feedback and comments..."
								/>
							</div>
						)}
					</div>
					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						{!isSupervisor && (
							<>
								<button
									type="submit"
									name="status"
									value="draft"
									className="btn-secondary"
									disabled={isPending}>
									Save Draft
								</button>
								<button
									type="submit"
									className="btn-primary"
									disabled={isPending}>
									{isPending ? "Saving..." : "Submit for Review"}
								</button>
							</>
						)}
						{isSupervisor && (
							<button
								type="submit"
								className="btn-primary"
								disabled={isPending}>
								{isPending ? "Saving..." : "Save Review"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
