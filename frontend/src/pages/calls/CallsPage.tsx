// Swahilipot — Call Recording System
import { useNavigate } from "react-router-dom";
import {
	Phone,
	Plus,
	Search,
	Download,
	CheckCircle,
	Eye,
	AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../services/api";
import clsx from "clsx";

export default function CallsPage() {
	const navigate = useNavigate();
	const { user } = useAuthStore();

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Phone size={22} className="text-Swahilipot-400" />
						Call Recording System
					</h1>
					<p className="page-subtitle">
						On-air call metadata logging, audio storage, playback, and hardware
						tracking
					</p>
				</div>
				<button className="btn-primary btn-sm">
					<Plus size={13} /> Add New
				</button>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[
					{ label: "Total", value: "—", color: "text-white" },
					{ label: "Active", value: "—", color: "text-green-400" },
					{ label: "Pending", value: "—", color: "text-amber-400" },
					{ label: "This Month", value: "—", color: "text-blue-400" },
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			<div className="card text-center py-16">
				<Phone
					size={40}
					className="mx-auto mb-4 text-Swahilipot-400 opacity-25"
				/>
				<h3 className="text-lg font-semibold text-white mb-2">
					Call Recording System
				</h3>
				<p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
					On-air call metadata logging, audio storage, playback, and hardware
					tracking. Connect to the Django REST API at
					<code className="mx-1 text-Swahilipot-400 bg-surface px-1.5 py-0.5 rounded text-xs">
						/api/v1/calls/
					</code>
					using the established patterns.
				</p>
				<div className="flex justify-center gap-3 mt-6">
					<button onClick={() => navigate(-1)} className="btn-secondary">
						← Back
					</button>
					<button
						onClick={() => navigate("/dashboard")}
						className="btn-primary">
						Dashboard
					</button>
				</div>
			</div>
		</div>
	);
}
