// ConversationList — Left sidebar listing groups and direct messages
import { useState } from "react";
import { Plus, Search, Hash, ChevronDown, ChevronRight } from "lucide-react";
import { useChatStore, type Conversation } from  "../../stores/chatStore"
;
import { useAuthStore } from "../../services/api";
import clsx from "clsx";

const DEMO_ONLINE_USERS = [
	{
		id: "u1",
		name: "Sarah Kamau",
		role: "Supervisor",
		department: "Broadcast",
		email: "sarah.kamau@nexus.co.ke",
		isOnline: true,
	},
	{
		id: "u2",
		name: "John Mwangi",
		role: "Journalist",
		department: "News",
		email: "john.mwangi@nexus.co.ke",
		isOnline: true,
	},
	{
		id: "u3",
		name: "Amina Ochieng",
		role: "HR Officer",
		department: "Human Resources",
		email: "amina.ochieng@nexus.co.ke",
		isOnline: false,
	},
	{
		id: "u4",
		name: "David Otieno",
		role: "Station Engineer",
		department: "Broadcast",
		email: "david.otieno@nexus.co.ke",
		isOnline: true,
	},
	{
		id: "u5",
		name: "Grace Wanjiku",
		role: "Presenter",
		department: "Radio",
		email: "grace.wanjiku@nexus.co.ke",
		isOnline: false,
	},
	{
		id: "u6",
		name: "Peter Njoroge",
		role: "Videographer",
		department: "Production",
		email: "peter.njoroge@nexus.co.ke",
		isOnline: true,
	},
];

interface Props {
	canCreateGroup: boolean;
	onCreateGroup: () => void;
}

export function ConversationList({ canCreateGroup, onCreateGroup }: Props) {
	const { user } = useAuthStore();
	const {
		conversations,
		activeConversationId,
		setActiveConversation,
		getOrCreateConversation,
		markConversationRead,
		onlineUsers,
		activeTab,
		setActiveTab,
	} = useChatStore();

	const [search, setSearch] = useState("");
	const [groupsOpen, setGroupsOpen] = useState(true);
	const [dmsOpen, setDmsOpen] = useState(true);

	const groups = conversations.filter((c) => c.type === "group");
	const dms = conversations.filter((c) => c.type === "direct");

	const filtered = (list: Conversation[]) =>
		search
			? list.filter(
					(c) =>
						c.name?.toLowerCase().includes(search.toLowerCase()) ||
						c.participants.some((p) =>
							p.name.toLowerCase().includes(search.toLowerCase()),
						),
				)
			: list;

	const handleSelect = (conv: Conversation) => {
		setActiveConversation(conv.id);
		markConversationRead(conv.id);
	};

	const handleStartDM = (targetUser: (typeof DEMO_ONLINE_USERS)[0]) => {
		if (!user) return;
		const currentParticipant = {
			id: user.id,
			name: user.full_name,
			role: user.role_display,
			department: user.department_name || undefined,
			email: user.email,
			isOnline: true,
		};
		const convId = getOrCreateConversation(currentParticipant, targetUser);
		setActiveConversation(convId);
		markConversationRead(convId);
	};

	const formatTime = (iso?: string) => {
		if (!iso) return "";
		const d = new Date(iso);
		const now = new Date();
		const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
		if (diffMin < 1) return "now";
		if (diffMin < 60) return `${diffMin}m`;
		if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
		return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	};

	const getInitials = (name: string) =>
		name
			.split(" ")
			.map((w) => w[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();

	return (
		<div className="flex flex-col flex-1 min-h-0">
			{/* Search */}
			<div className="p-3 border-b border-surface-border">
				<div className="relative">
					<Search
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search conversations..."
						className="input pl-8 py-2 text-xs"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
				{/* ── Chat Groups ── */}
				<div>
					<div
						className="flex items-center justify-between px-2 py-1.5 cursor-pointer group"
						onClick={() => setGroupsOpen(!groupsOpen)}>
						<div className="flex items-center gap-1.5">
							{groupsOpen ? (
								<ChevronDown size={12} className="text-slate-500" />
							) : (
								<ChevronRight size={12} className="text-slate-500" />
							)}
							<span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
								Chat Groups
							</span>
						</div>
						{canCreateGroup && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onCreateGroup();
								}}
								className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-all"
								title="Create group (Admin only)">
								<Plus size={12} />
							</button>
						)}
					</div>

					{groupsOpen &&
						filtered(groups).map((conv) => (
							<button
								key={conv.id}
								onClick={() => handleSelect(conv)}
								className={clsx(
									"w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
									activeConversationId === conv.id
										? "bg-Swahilipot-600/20 border border-Swahilipot-500/30"
										: "hover:bg-surface-elevated",
								)}>
								<div className="w-8 h-8 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
									<Hash size={14} className="text-slate-400" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-slate-200 truncate">
											{conv.name}
										</span>
										{conv.lastMessage && (
											<span className="text-[10px] text-slate-600 shrink-0 ml-1">
												{formatTime(conv.lastMessage.timestamp)}
											</span>
										)}
									</div>
									{conv.lastMessage && (
										<p className="text-[11px] text-slate-500 truncate mt-0.5">
											{conv.lastMessage.senderName !== "You"
												? `${conv.lastMessage.senderName.split(" ")[0]}: `
												: ""}
											{conv.lastMessage.content}
										</p>
									)}
								</div>
								{conv.unreadCount > 0 && (
									<span className="w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-Swahilipot-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
										{conv.unreadCount}
									</span>
								)}
							</button>
						))}
				</div>

				{/* ── Direct Messages ── */}
				<div className="mt-2">
					<div
						className="flex items-center justify-between px-2 py-1.5 cursor-pointer"
						onClick={() => setDmsOpen(!dmsOpen)}>
						<div className="flex items-center gap-1.5">
							{dmsOpen ? (
								<ChevronDown size={12} className="text-slate-500" />
							) : (
								<ChevronRight size={12} className="text-slate-500" />
							)}
							<span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
								Direct Chats
							</span>
						</div>
					</div>

					{dmsOpen && (
						<>
							{/* Existing DM threads */}
							{filtered(dms).map((conv) => {
								const other = conv.participants[0];
								const isOnline = other
									? (onlineUsers[other.id] ?? other.isOnline)
									: false;
								return (
									<button
										key={conv.id}
										onClick={() => handleSelect(conv)}
										className={clsx(
											"w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
											activeConversationId === conv.id
												? "bg-Swahilipot-600/20 border border-Swahilipot-500/30"
												: "hover:bg-surface-elevated",
										)}>
										<div className="relative shrink-0">
											<div className="w-8 h-8 rounded-full bg-gradient-Nexus flex items-center justify-center text-[11px] font-bold text-white">
												{other ? getInitials(other.name) : "?"}
											</div>
											<span
												className={clsx(
													"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card",
													isOnline ? "bg-green-500" : "bg-slate-600",
												)}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium text-slate-200 truncate">
													{other?.name || "Unknown"}
												</span>
												{conv.lastMessage && (
													<span className="text-[10px] text-slate-600 shrink-0 ml-1">
														{formatTime(conv.lastMessage.timestamp)}
													</span>
												)}
											</div>
											{conv.lastMessage && (
												<p className="text-[11px] text-slate-500 truncate mt-0.5">
													{conv.lastMessage.content}
												</p>
											)}
										</div>
										{conv.unreadCount > 0 && (
											<span className="min-w-[18px] px-1 h-4.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
												{conv.unreadCount}
											</span>
										)}
									</button>
								);
							})}

							{/* Active users to start new DMs */}
							<div className="mt-2 px-2">
								<p className="text-[10px] text-slate-600 mb-1.5">
									Start conversation
								</p>
								{DEMO_ONLINE_USERS.filter((u) => u.id !== user?.id).map((u) => {
									const alreadyDm = dms.find(
										(d) => d.participants[0]?.id === u.id,
									);
									if (alreadyDm) return null;
									const isOnline = onlineUsers[u.id] ?? u.isOnline;
									return (
										<button
											key={u.id}
											onClick={() => handleStartDM(u)}
											className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-all">
											<div className="relative shrink-0">
												<div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center text-[10px] font-bold text-slate-300">
													{getInitials(u.name)}
												</div>
												<span
													className={clsx(
														"absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface-card",
														isOnline ? "bg-green-500" : "bg-slate-600",
													)}
												/>
											</div>
											<div className="flex-1 min-w-0 text-left">
												<p className="text-xs text-slate-400 truncate">
													{u.name}
												</p>
												<p className="text-[10px] text-slate-600 truncate">
													{u.role}
												</p>
											</div>
											{isOnline && (
												<span className="text-[9px] text-green-500 font-medium shrink-0">
													online
												</span>
											)}
										</button>
									);
								})}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
