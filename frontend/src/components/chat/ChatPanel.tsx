// ChatPanel — Collapsible right-side chat panel for Nexus Enterprise
import { useEffect, useRef } from "react";
import {
	MessageSquare,
	X,
	Minimize2,
	Maximize2,
	ChevronLeft,
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useAuthStore } from "../../services/api";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ContactProfile } from "./ContactProfile";
import { ActiveCallOverlay } from "./ActiveCallOverlay";
import { CreateGroupModal } from "./CreateGroupModal";
import { useState } from "react";
import clsx from "clsx";

export default function ChatPanel() {
	const { user } = useAuthStore();
	const {
		isChatOpen,
		isExpanded,
		activeConversationId,
		conversations,
		toggleChat,
		toggleExpanded,
		setActiveConversation,
		getTotalUnread,
		activeCall,
	} = useChatStore();

	const [showProfile, setShowProfile] = useState(false);
	const [showCreateGroup, setShowCreateGroup] = useState(false);
	const totalUnread = getTotalUnread();

	// Close profile when conversation changes
	useEffect(() => {
		setShowProfile(false);
	}, [activeConversationId]);

	const activeConv = conversations.find((c) => c.id === activeConversationId);
	const otherParticipant =
		activeConv?.type === "direct" ? activeConv.participants[0] : null;

	// Admin check for group creation
	const canCreateGroup = user?.role
		? ["system_admin", "broadcast_admin", "hr_officer", "executive"].includes(
				user.role,
			)
		: false;

	if (!isChatOpen) {
		return (
			<button
				onClick={toggleChat}
				className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-Swahilipot-600 hover:bg-Swahilipot-700 text-white rounded-2xl shadow-glow-blue transition-all duration-200 hover:scale-105 active:scale-95"
				title="Open Chat">
				<MessageSquare size={18} />
				<span className="text-sm font-medium">Chat</span>
				{totalUnread > 0 && (
					<span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
						{totalUnread > 9 ? "9+" : totalUnread}
					</span>
				)}
			</button>
		);
	}

	return (
		<>
			{activeCall && <ActiveCallOverlay />}
			{showCreateGroup && (
				<CreateGroupModal onClose={() => setShowCreateGroup(false)} />
			)}

			{/* Panel */}
			<div
				className={clsx(
					"fixed bottom-0 right-0 z-40 flex bg-surface-card border-l border-t border-surface-border shadow-elevated transition-all duration-300",
					isExpanded
						? "inset-0 rounded-none"
						: "bottom-0 right-0 w-[780px] h-[600px] rounded-tl-2xl max-w-[calc(100vw-1rem)]",
				)}>
				{/* ── Sidebar: conversation list ── */}
				<div
					className={clsx(
						"flex flex-col border-r border-surface-border shrink-0 transition-all duration-200",
						activeConversationId && !isExpanded
							? "hidden sm:flex w-64"
							: "flex w-72",
					)}>
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
						<span className="font-display font-semibold text-white text-sm">
							Messages
						</span>
						<div className="flex items-center gap-1">
							<button
								onClick={toggleExpanded}
								className="btn-ghost btn-icon p-1.5"
								title={isExpanded ? "Minimize" : "Expand"}>
								{isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
							</button>
							<button onClick={toggleChat} className="btn-ghost btn-icon p-1.5">
								<X size={14} />
							</button>
						</div>
					</div>

					<ConversationList
						canCreateGroup={canCreateGroup}
						onCreateGroup={() => setShowCreateGroup(true)}
					/>
				</div>

				{/* ── Main: message thread ── */}
				{activeConversationId ? (
					<div className="flex flex-1 min-w-0">
						<div className="flex flex-col flex-1 min-w-0">
							{/* Back button on mobile */}
							<div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-surface-border">
								<button
									onClick={() => setActiveConversation(null)}
									className="btn-ghost btn-icon p-1">
									<ChevronLeft size={16} />
								</button>
							</div>
							<MessageThread
								conversationId={activeConversationId}
								onProfileClick={() => setShowProfile(true)}
							/>
						</div>

						{/* ── Right: contact profile ── */}
						{showProfile && otherParticipant && (
							<div className="w-64 shrink-0 border-l border-surface-border hidden lg:flex flex-col">
								<ContactProfile
									participant={otherParticipant}
									conversationId={activeConversationId}
									onClose={() => setShowProfile(false)}
								/>
							</div>
						)}
					</div>
				) : (
					/* Empty state */
					<div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
						<MessageSquare size={40} className="opacity-30" />
						<p className="text-sm">Select a conversation to start messaging</p>
					</div>
				)}
			</div>

			{/* Backdrop on mobile */}
			{!isExpanded && (
				<div
					className="fixed inset-0 bg-black/40 z-30 sm:hidden"
					onClick={toggleChat}
				/>
			)}
		</>
	);
}
