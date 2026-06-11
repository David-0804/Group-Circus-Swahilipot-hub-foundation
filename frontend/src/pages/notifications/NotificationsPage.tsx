// Swahilipot — Notifications Centre
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
	Bell,
	CheckCheck,
	Filter,
	Radio,
	Package,
	ClipboardList,
	AlertTriangle,
	Star,
	Wifi,
	MessageSquare,
	Zap,
	Info,
	Trash2,
	Eye,
} from "lucide-react";
import { notificationsApi } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
	task_assigned: {
		icon: ClipboardList,
		color: "text-blue-400",
		bg: "bg-blue-500/10",
	},
	task_reviewed: {
		icon: ClipboardList,
		color: "text-green-400",
		bg: "bg-green-500/10",
	},
	task_overdue: {
		icon: ClipboardList,
		color: "text-red-400",
		bg: "bg-red-500/10",
	},
	fm_outage: { icon: Radio, color: "text-red-400", bg: "bg-red-500/10" },
	fm_restored: { icon: Radio, color: "text-green-400", bg: "bg-green-500/10" },
	emergency_alert: {
		icon: AlertTriangle,
		color: "text-red-400",
		bg: "bg-red-500/10",
	},
	checkout_update: {
		icon: Package,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
	},
	evaluation_due: {
		icon: Star,
		color: "text-yellow-400",
		bg: "bg-yellow-500/10",
	},
	certificate_issued: {
		icon: Zap,
		color: "text-Swahilipot-400",
		bg: "bg-Swahilipot-500/10",
	},
	wifi_decision: { icon: Wifi, color: "text-cyan-400", bg: "bg-cyan-500/10" },
	ticket_update: {
		icon: MessageSquare,
		color: "text-purple-400",
		bg: "bg-purple-500/10",
	},
	geofence_violation: {
		icon: AlertTriangle,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
	},
	reminder: { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10" },
	general: { icon: Info, color: "text-slate-400", bg: "bg-slate-500/10" },
};

export default function NotificationsPage() {
	const qc = useQueryClient();
	const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");
	const [typeFilter, setTypeFilter] = useState("");

	const { data: notifications = [], isLoading } = useQuery({
		queryKey: ["notifications", filter, typeFilter],
		queryFn: () =>
			notificationsApi
				.list({
					unread: filter === "unread" ? "true" : undefined,
					type: typeFilter || undefined,
				})
				.then((r) => r.data.results || r.data),
		refetchInterval: 30000,
	});

	const { data: unreadCount = 0 } = useQuery({
		queryKey: ["unread-notifications"],
		queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
		refetchInterval: 30000,
	});

	const markReadMutation = useMutation({
		mutationFn: (id: string) => notificationsApi.markRead(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
			qc.invalidateQueries({ queryKey: ["unread-notifications"] });
		},
	});

	const markAllMutation = useMutation({
		mutationFn: () => notificationsApi.markAllRead(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
			qc.invalidateQueries({ queryKey: ["unread-notifications"] });
			toast.success("All notifications marked as read");
		},
	});

	const urgent = notifications.filter((n: any) => n.is_urgent);

	return (
		<div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Bell size={22} className="text-Swahilipot-400" />
						Notifications
						{unreadCount > 0 && (
							<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
								{unreadCount > 99 ? "99+" : unreadCount}
							</span>
						)}
					</h1>
					<p className="page-subtitle">
						All system alerts, updates, and reminders
					</p>
				</div>
				{unreadCount > 0 && (
					<button
						onClick={() => markAllMutation.mutate()}
						disabled={markAllMutation.isPending}
						className="btn-secondary btn-sm">
						<CheckCheck size={14} />
						{markAllMutation.isPending ? "Marking..." : "Mark All Read"}
					</button>
				)}
			</div>

			{/* Urgent strip */}
			{urgent.length > 0 && (
				<div className="space-y-2">
					{urgent.map((n: any) => (
						<NotificationCard
							key={n.id}
							notification={n}
							onRead={() => markReadMutation.mutate(n.id)}
							urgent
						/>
					))}
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-wrap gap-3 items-center">
				<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl">
					{(["all", "unread", "urgent"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={clsx(
								"px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
								{
									"bg-Swahilipot-600 text-white": filter === f,
									"text-slate-400 hover:text-white": filter !== f,
								},
							)}>
							{f}
						</button>
					))}
				</div>
				<select
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value)}
					className="select-input w-44 text-sm py-1.5">
					<option value="">All Types</option>
					<option value="task_assigned">Tasks</option>
					<option value="fm_outage">FM Alerts</option>
					<option value="emergency_alert">Emergency</option>
					<option value="checkout_update">Equipment</option>
					<option value="evaluation_due">Evaluations</option>
					<option value="reminder">Reminders</option>
				</select>
			</div>

			{/* Notification list */}
			<div className="space-y-2">
				{isLoading ? (
					[...Array(6)].map((_, i) => (
						<div key={i} className="skeleton h-20 rounded-xl" />
					))
				) : notifications.length === 0 ? (
					<div className="card text-center py-14">
						<Bell
							size={36}
							className="mx-auto text-slate-500 mb-3 opacity-30"
						/>
						<p className="text-slate-400">
							{filter === "unread"
								? "No unread notifications"
								: "No notifications yet"}
						</p>
					</div>
				) : (
					notifications.map((notification: any) => (
						<NotificationCard
							key={notification.id}
							notification={notification}
							onRead={() => markReadMutation.mutate(notification.id)}
						/>
					))
				)}
			</div>
		</div>
	);
}

function NotificationCard({ notification: n, onRead, urgent }: any) {
	const config = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.general;
	const Icon = config.icon;

	return (
		<div
			className={clsx(
				"flex items-start gap-4 p-4 rounded-xl border transition-all",
				{
					"border-red-500/40 bg-red-900/10": urgent && !n.read,
					"border-Swahilipot-500/20 bg-Swahilipot-900/10": !urgent && !n.read,
					"border-surface-border bg-surface-card opacity-70": n.read,
				},
			)}>
			{/* Icon */}
			<div
				className={clsx(
					"w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
					config.bg,
				)}>
				<Icon size={18} className={config.color} />
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1">
						<p
							className={clsx(
								"text-sm font-semibold leading-snug",
								n.read ? "text-slate-400" : "text-white",
							)}>
							{n.title}
						</p>
						<p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
							{n.body}
						</p>
					</div>
					{!n.read && (
						<div className="w-2 h-2 rounded-full bg-Swahilipot-400 shrink-0 mt-1.5" />
					)}
				</div>
				<div className="flex items-center gap-3 mt-2">
					<span className="text-[10px] text-slate-600">
						{formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
					</span>
					{n.notification_type && (
						<span className="text-[10px] text-slate-600 capitalize">
							{n.notification_type.replace(/_/g, " ")}
						</span>
					)}
					{!n.read && (
						<button
							onClick={onRead}
							className="ml-auto text-[10px] text-Swahilipot-400 hover:text-Swahilipot-300 flex items-center gap-1">
							<Eye size={10} /> Mark read
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
