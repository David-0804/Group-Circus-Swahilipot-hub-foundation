// Nexus — Certificates & Recommendation Letters
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
	Award,
	Download,
	Plus,
	QrCode,
	CheckCircle,
	Clock,
	Shield,
	Star,
} from "lucide-react";
import { certificatesApi } from "../../services/api";
import { useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
	{
		completion: {
			label: "Certificate of Completion",
			color: "text-green-400 bg-green-500/10",
			icon: Award,
		},
		recommendation: {
			label: "Recommendation Letter",
			color: "text-blue-400 bg-blue-500/10",
			icon: Star,
		},
		achievement: {
			label: "Achievement Award",
			color: "text-amber-400 bg-amber-500/10",
			icon: Award,
		},
		participation: {
			label: "Participation Certificate",
			color: "text-purple-400 bg-purple-500/10",
			icon: Shield,
		},
	};

const STATUS_BADGE: Record<string, string> = {
	pending: "badge-amber",
	generated: "badge-blue",
	issued: "badge-green",
	revoked: "badge-red",
};

export default function CertificatesPage() {
	const { user } = useAuthStore();
	const qc = useQueryClient();
	const isAdmin = [
		"hr_officer",
		"system_admin",
		"supervisor",
		"broadcast_admin",
	].includes(user?.role || "");
	const [showGenerateModal, setShowGenerateModal] = useState(false);

	const { data: certsData, isLoading } = useQuery({
		queryKey: ["certificates"],
		queryFn: () => certificatesApi.list().then((r) => r.data),
	});

<<<<<<< HEAD
=======
	console.log("CERTIFICATES:", certsData);
>>>>>>> origin/main

	const certs = Array.isArray(certsData)
		? certsData
		: Array.isArray(certsData?.results)
			? certsData.results
			: [];

	const handleDownload = async (id: string, certNumber: string) => {
		try {
			const res = await certificatesApi.download(id);
			const url = URL.createObjectURL(
				new Blob([res.data], { type: "application/pdf" }),
			);
			const a = document.createElement("a");
			a.href = url;
			a.download = `certificate-${certNumber}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			toast.error("Download failed");
		}
	};

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<Award size={22} className="text-Nexus-400" /> Certificates &
						Letters
					</h1>
					<p className="page-subtitle">
						Auto-generated completion certificates and recommendation letters
						with QR verification
					</p>
				</div>
				{isAdmin && (
					<button
						onClick={() => setShowGenerateModal(true)}
						className="btn-primary">
						<Plus size={15} /> Generate Certificate
					</button>
				)}
			</div>

			{/* Summary */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[
					{ label: "Total", value: certs.length, color: "text-white" },
					{
						label: "Issued",
						value: certs.filter((c: any) => c.status === "issued").length,
						color: "text-green-400",
					},
					{
						label: "Pending",
						value: certs.filter((c: any) => c.status === "pending").length,
						color: "text-amber-400",
					},
					{
						label: "Generated",
						value: certs.filter((c: any) => c.status === "generated").length,
						color: "text-blue-400",
					},
				].map(({ label, value, color }) => (
					<div key={label} className="stat-card">
						<div className={clsx("stat-value", color)}>{value}</div>
						<div className="stat-label">{label}</div>
					</div>
				))}
			</div>

			{/* Certificates grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="skeleton h-48 rounded-xl" />
					))}
				</div>
			) : certs.length === 0 ? (
				<div className="card text-center py-16">
					<Award size={40} className="mx-auto text-slate-500 mb-3 opacity-30" />
					<p className="text-slate-400">No certificates yet</p>
					{!isAdmin && (
						<p className="text-xs text-slate-500 mt-2">
							Certificates are issued by your supervisor or HR officer upon
							successful completion.
						</p>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{certs.map((cert: any) => {
						const cfg =
							TYPE_CONFIG[cert.certificate_type] || TYPE_CONFIG.completion;
						const Icon = cfg.icon;
						return (
							<div
								key={cert.id}
								className="card hover:border-Nexus-500/30 transition-all group">
								{/* Certificate card header */}
								<div className="flex items-start gap-4 mb-4">
									<div
										className={clsx(
											"w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
											cfg.color.split(" ")[1],
										)}>
										<Icon size={24} className={cfg.color.split(" ")[0]} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<h3 className="font-semibold text-white text-sm leading-tight">
												{cfg.label}
											</h3>
											<span
												className={clsx(
													"badge text-[10px] shrink-0",
													STATUS_BADGE[cert.status] || "badge-slate",
												)}>
												{cert.status}
											</span>
										</div>
										<p className="text-xs text-slate-400 mt-0.5">
											{cert.recipient_name || user?.full_name}
										</p>
										<p className="text-[10px] font-mono text-slate-500 mt-1">
											{cert.certificate_number}
										</p>
									</div>
								</div>

								{/* Details */}
								<div className="grid grid-cols-2 gap-2 mb-4 text-xs">
									<div className="bg-surface rounded-lg p-2.5">
										<div className="text-slate-500 mb-0.5">Issue Date</div>
										<div className="text-white font-medium">
											{cert.issue_date
												? format(parseISO(cert.issue_date), "dd MMM yyyy")
												: "Pending"}
										</div>
									</div>
									<div className="bg-surface rounded-lg p-2.5">
										<div className="text-slate-500 mb-0.5">Signed By</div>
										<div className="text-white font-medium truncate">
											{cert.signed_by_name || "—"}
										</div>
									</div>
								</div>

								{cert.signed_by_title && (
									<p className="text-[10px] text-slate-500 mb-3">
										{cert.signed_by_title}
									</p>
								)}

								{/* Actions */}
								<div className="flex items-center gap-2 mt-auto pt-3 border-t border-surface-border/50">
									{cert.status === "issued" || cert.status === "generated" ? (
										<button
											onClick={() =>
												handleDownload(cert.id, cert.certificate_number)
											}
											className="btn-primary btn-sm flex-1 justify-center">
											<Download size={13} /> Download PDF
										</button>
									) : (
										<div className="flex items-center gap-1.5 text-xs text-amber-400">
											<Clock size={12} /> Processing...
										</div>
									)}

									{cert.qr_verification_code && (
										<button
											title="Verification QR Code"
											className="btn-secondary btn-sm"
											onClick={() => {
<<<<<<< HEAD
												
=======
												console.log("QR code:", cert.qr_verification_code);
>>>>>>> origin/main
												window.open(
													`/verify/${cert.qr_verification_code}`,
													"_blank",
												);
											}}>
											<QrCode size={13} />
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{showGenerateModal && (
				<GenerateCertModal
					onClose={() => setShowGenerateModal(false)}
					onSuccess={() => {
						qc.invalidateQueries({ queryKey: ["certificates"] });
						setShowGenerateModal(false);
					}}
				/>
			)}
		</div>
	);
}

function GenerateCertModal({ onClose, onSuccess }: any) {
	const [form, setForm] = useState({
		attachee_id: "",
		certificate_type: "completion",
		signed_by_name: "",
		signed_by_title: "",
	});
	const mutation = useMutation({
		mutationFn: (data: any) => certificatesApi.generate(data),
		onSuccess: () => {
			toast.success("Certificate generated!");
			onSuccess();
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.detail || "Generation failed"),
	});

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="font-semibold text-white flex items-center gap-2">
						<Award size={18} className="text-Nexus-400" /> Generate Certificate
					</h3>
				</div>
				<div className="modal-body space-y-4">
					<div className="input-group">
						<label className="input-label">
							Attachee / Recipient User ID *
						</label>
						<input
							value={form.attachee_id}
							onChange={(e) =>
								setForm((p) => ({ ...p, attachee_id: e.target.value }))
							}
							className="input"
							placeholder="Enter user ID"
						/>
					</div>
					<div className="input-group">
						<label className="input-label">Certificate Type *</label>
						<select
							value={form.certificate_type}
							onChange={(e) =>
								setForm((p) => ({ ...p, certificate_type: e.target.value }))
							}
							className="select-input">
							{Object.entries(TYPE_CONFIG).map(([v, { label }]) => (
								<option key={v} value={v}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className="input-group">
						<label className="input-label">Signing Authority Name *</label>
						<input
							value={form.signed_by_name}
							onChange={(e) =>
								setForm((p) => ({ ...p, signed_by_name: e.target.value }))
							}
							className="input"
							placeholder="e.g. Dr. Jane Muthoni"
						/>
					</div>
					<div className="input-group">
						<label className="input-label">Signing Authority Title</label>
						<input
							value={form.signed_by_title}
							onChange={(e) =>
								setForm((p) => ({ ...p, signed_by_title: e.target.value }))
							}
							className="input"
							placeholder="e.g. Head of HR & Training"
						/>
					</div>
				</div>
				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						disabled={
							!form.attachee_id || !form.signed_by_name || mutation.isPending
						}
						onClick={() => {
<<<<<<< HEAD
=======
							console.log("BUTTON CLICKED");
							console.log(form);
>>>>>>> origin/main
							mutation.mutate(form);
						}}
						className="btn-primary">
						{mutation.isPending ? "Generating..." : "Generate Certificate"}
					</button>
				</div>
			</div>
		</div>
	);
}
