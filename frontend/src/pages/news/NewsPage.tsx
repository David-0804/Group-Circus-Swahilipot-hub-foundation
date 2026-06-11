// Swahilipot News CMS Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
	Newspaper,
	Plus,
	Edit3,
	Eye,
	CheckCircle,
	XCircle,
	Clock,
	RotateCcw,
	Search,
	Tag,
	AlertCircle,
	ChevronRight,
	Zap,
} from "lucide-react";
import { newsApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
	draft: "badge-slate",
	submitted: "badge-blue",
	under_review: "badge-amber",
	changes_requested: "badge-amber",
	approved: "badge-green",
	published: "badge-green",
	rejected: "badge-red",
	archived: "badge-slate",
};

export default function NewsPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isEditor = ["editor", "broadcast_admin", "broadcast_staff"].includes(
		user?.role || "",
	);
	const isJournalist = user?.role === "journalist" || isEditor;

	const [activeTab, setActiveTab] = useState<
		"all" | "mine" | "review" | "published"
	>("all");
	const [showWriteModal, setShowWriteModal] = useState(false);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [selectedStory, setSelectedStory] = useState<any>(null);
	const [search, setSearch] = useState("");

	const { data: stories = [], isLoading } = useQuery({
		queryKey: ["news", activeTab, search],
		queryFn: () =>
			newsApi
				.list({
					search: search || undefined,
					status:
						activeTab === "review"
							? "submitted"
							: activeTab === "published"
								? "published"
								: undefined,
				})
				.then((r) => r.data.results || r.data),
		refetchInterval: 60000,
	});

	const reviewMutation = useMutation({
		mutationFn: ({ id, action, comment }: any) =>
			newsApi.review(id, { action, comment }),
		onSuccess: (_, { action }) => {
			qc.invalidateQueries({ queryKey: ["news"] });
			setShowReviewModal(false);
			toast.success(`Story ${action.replace("_", " ")}`);
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Action failed"),
	});

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Newspaper size={24} className="text-Swahilipot-400" />
						News CMS
					</h1>
					<p className="page-subtitle">
						Write, review, and publish news stories for broadcast
					</p>
				</div>
				{isJournalist && (
					<button
						onClick={() => {
							setSelectedStory(null);
							setShowWriteModal(true);
						}}
						className="btn-primary">
						<Plus size={16} /> Write Story
					</button>
				)}
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-3 flex-wrap">
				<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl">
					{(
						[
							"all",
							"mine",
							...(isEditor ? ["review"] : []),
							"published",
						] as const
					).map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab as any)}
							className={clsx(
								"px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
								{
									"bg-Swahilipot-600 text-white": activeTab === tab,
									"text-slate-400 hover:text-white": activeTab !== tab,
								},
							)}>
							{tab === "review" ? "Pending Review" : tab}
						</button>
					))}
				</div>
				<div className="relative flex-1 max-w-72">
					<Search
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search stories..."
						className="input pl-8 py-1.5 text-sm"
					/>
				</div>
			</div>

			{/* Stories grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
				{isLoading ? (
					[...Array(6)].map((_, i) => (
						<div key={i} className="skeleton h-48 rounded-xl" />
					))
				) : stories.length === 0 ? (
					<div className="col-span-3 card text-center py-12">
						<Newspaper size={32} className="mx-auto text-slate-500 mb-3" />
						<p className="text-slate-400">No stories found</p>
					</div>
				) : (
					stories.map((story: any) => (
						<div key={story.id} className="card-hover group">
							{story.is_breaking && (
								<div className="flex items-center gap-1.5 text-red-400 text-xs font-bold mb-2 animate-pulse">
									<Zap size={11} /> BREAKING
								</div>
							)}
							<div className="flex items-start justify-between gap-2 mb-2">
								<span
									className={clsx(
										"badge text-[10px]",
										STATUS_STYLES[story.status] || "badge-slate",
									)}>
									{story.status?.replace("_", " ")}
								</span>
								{story.category_name && (
									<span className="text-[10px] text-slate-500 flex items-center gap-1">
										<Tag size={9} /> {story.category_name}
									</span>
								)}
							</div>
							<h3 className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-2 group-hover:text-Swahilipot-400 transition-colors">
								{story.title}
							</h3>
							{story.subtitle && (
								<p className="text-xs text-slate-400 line-clamp-1 mb-2">
									{story.subtitle}
								</p>
							)}
							<div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border/50">
								<div className="text-xs text-slate-500">
									{story.author_name} ·{" "}
									{formatDistanceToNow(new Date(story.updated_at), {
										addSuffix: true,
									})}
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-[10px] text-slate-600">
										{story.word_count}w
									</span>
									<button
										onClick={() => {
											setSelectedStory(story);
											setShowWriteModal(true);
										}}
										className="btn-ghost btn-sm p-1">
										<Edit3 size={12} />
									</button>
									{isEditor && story.status === "submitted" && (
										<button
											onClick={() => {
												setSelectedStory(story);
												setShowReviewModal(true);
											}}
											className="btn-primary btn-sm">
											Review
										</button>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Write Story Modal */}
			{showWriteModal && (
				<WriteStoryModal
					story={selectedStory}
					onClose={() => setShowWriteModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["news"] });
						setShowWriteModal(false);
					}}
				/>
			)}

			{/* Review Modal */}
			{showReviewModal && selectedStory && (
				<ReviewModal
					story={selectedStory}
					onClose={() => setShowReviewModal(false)}
					onAction={(action, comment) =>
						reviewMutation.mutate({ id: selectedStory.id, action, comment })
					}
					isPending={reviewMutation.isPending}
				/>
			)}
		</div>
	);
}

function WriteStoryModal({ story, onClose, onSuccess }: any) {
	const { register, handleSubmit, watch } = useForm({
		defaultValues: story || { status: "draft" },
	});
	const { data: categories = [] } = useQuery({
		queryKey: ["news-categories"],
		queryFn: () => newsApi.categories().then((r) => r.data),
	});

	const mutation = useMutation({
		mutationFn: (data: any) =>
			story ? newsApi.update(story.id, data) : newsApi.create(data),
		onSuccess: () => {
			toast.success(story ? "Story updated" : "Story created");
			onSuccess();
		},
		onError: (e: any) => toast.error(e.response?.data?.detail || "Failed"),
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">
						{story ? "Edit Story" : "Write New Story"}
					</h3>
				</div>
				<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
					<div className="modal-body space-y-4">
						<div className="grid grid-cols-3 gap-4">
							<div className="input-group col-span-2">
								<label className="input-label">Story Title *</label>
								<input
									{...register("title", { required: true })}
									className="input text-base font-semibold"
									placeholder="Enter compelling headline..."
								/>
							</div>
							<div className="input-group">
								<label className="input-label">Category</label>
								<select {...register("category")} className="select-input">
									<option value="">None</option>
									{categories.map((c: any) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="input-group">
							<label className="input-label">Subtitle / Deck</label>
							<input
								{...register("subtitle")}
								className="input"
								placeholder="Supporting headline..."
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Story Body *</label>
							<textarea
								{...register("body", { required: true })}
								className="textarea min-h-64"
								placeholder="Write your story here..."
							/>
						</div>
						<div className="flex items-center gap-4">
							<label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
								<input
									type="checkbox"
									{...register("is_breaking")}
									className="rounded"
								/>
								Mark as Breaking News
							</label>
							<label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
								<input
									type="checkbox"
									{...register("is_featured")}
									className="rounded"
								/>
								Feature this story
							</label>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn-secondary">
							Cancel
						</button>
						<button
							type="submit"
							name="status"
							value="draft"
							onClick={() => {}}
							className="btn-secondary"
							disabled={mutation.isPending}>
							Save Draft
						</button>
						<button
							type="submit"
							className="btn-primary"
							disabled={mutation.isPending}>
							{mutation.isPending
								? "Saving..."
								: story
									? "Update Story"
									: "Submit for Review"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function ReviewModal({ story, onClose, onAction, isPending }: any) {
	const [comment, setComment] = useState("");
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white">Editorial Review</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="card bg-surface/60">
						<h4 className="font-semibold text-white text-base mb-1">
							{story.title}
						</h4>
						{story.subtitle && (
							<p className="text-sm text-slate-400 mb-3">{story.subtitle}</p>
						)}
						<p className="text-sm text-slate-300 leading-relaxed max-h-64 overflow-y-auto">
							{story.body}
						</p>
					</div>
					<div className="flex items-center gap-2 text-xs text-slate-500">
						<span>By {story.author_name}</span>·
						<span>{story.word_count} words</span>·
						<span>
							Submitted{" "}
							{formatDistanceToNow(new Date(story.updated_at), {
								addSuffix: true,
							})}
						</span>
					</div>
					<div className="input-group">
						<label className="input-label">Editorial Comment (optional)</label>
						<textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							className="textarea h-20"
							placeholder="Add notes for the journalist..."
						/>
					</div>
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Close
					</button>
					<button
						disabled={isPending}
						onClick={() => onAction("request_changes", comment)}
						className="btn btn-lg bg-amber-600 text-white hover:bg-amber-700">
						<RotateCcw size={14} /> Request Changes
					</button>
					<button
						disabled={isPending}
						onClick={() => onAction("reject", comment)}
						className="btn-danger">
						<XCircle size={14} /> Reject
					</button>
					<button
						disabled={isPending}
						onClick={() => onAction("approve", comment)}
						className="btn-success">
						<CheckCircle size={14} /> Approve
					</button>
					<button
						disabled={isPending}
						onClick={() => onAction("publish", comment)}
						className="btn-primary">
						<Zap size={14} /> Publish
					</button>
				</div>
			</div>
		</div>
	);
}
