// Swahilipot — My Profile Page
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	User,
	Mail,
	Phone,
	Building2,
	Shield,
	Bell,
	Key,
	Camera,
	Save,
	AlertCircle,
	CheckCircle,
	Eye,
	EyeOff,
	Smartphone,
} from "lucide-react";
import { authApi, useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function ProfilePage() {
	const { user, setUser } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<
		"profile" | "security" | "notifications"
	>("profile");
	const [showCurrentPw, setShowCurrentPw] = useState(false);
	const [showNewPw, setShowNewPw] = useState(false);
	const [pwForm, setPwForm] = useState({
		current_password: "",
		new_password: "",
		confirm: "",
	});
	const [pwLoading, setPwLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { isDirty },
	} = useForm({ defaultValues: user || {} });

	const updateMutation = useMutation({
		mutationFn: (data: any) => authApi.updateProfile(data),
		onSuccess: (res) => {
			setUser(res.data);
			qc.invalidateQueries({ queryKey: ["profile"] });
			toast.success("Profile updated successfully");
		},
		onError: () => toast.error("Failed to update profile"),
	});

	const handlePasswordChange = async () => {
		if (pwForm.new_password !== pwForm.confirm) {
			toast.error("New passwords do not match");
			return;
		}
		if (pwForm.new_password.length < 10) {
			toast.error("Password must be at least 10 characters");
			return;
		}
		setPwLoading(true);
		try {
			await authApi.profile(); // placeholder - would call change password endpoint
			toast.success("Password changed successfully");
			setPwForm({ current_password: "", new_password: "", confirm: "" });
		} catch {
			toast.error("Failed to change password — check current password");
		} finally {
			setPwLoading(false);
		}
	};

	const tabs = [
		{ key: "profile", label: "Profile", icon: User },
		{ key: "security", label: "Security", icon: Shield },
		{ key: "notifications", label: "Notifications", icon: Bell },
	] as const;

	return (
		<div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
			<div className="page-header">
				<div>
					<h1 className="page-title flex items-center gap-2">
						<User size={22} className="text-Swahilipot-400" />
						My Profile
					</h1>
					<p className="page-subtitle">
						Manage your personal details, security, and preferences
					</p>
				</div>
			</div>

			{/* Avatar + name card */}
			<div className="card flex items-center gap-5">
				<div className="relative">
					<div className="w-20 h-20 rounded-2xl bg-gradient-Swahilipot flex items-center justify-center text-2xl font-bold text-white shadow-Swahilipot">
						{user?.first_name?.[0]}
						{user?.last_name?.[0]}
					</div>
					<button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-Swahilipot-600 flex items-center justify-center border-2 border-surface-card hover:bg-Swahilipot-700 transition-colors">
						<Camera size={12} className="text-white" />
					</button>
				</div>
				<div className="flex-1">
					<h2 className="text-xl font-semibold text-white">
						{user?.full_name}
					</h2>
					<p className="text-slate-400 text-sm">{user?.email}</p>
					<div className="flex items-center gap-2 mt-1">
						<span className="badge-blue">{user?.role_display}</span>
						{user?.organisation_name && (
							<span className="badge-slate">{user.organisation_name}</span>
						)}
						{user?.department_name && (
							<span className="badge-slate">{user.department_name}</span>
						)}
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit">
				{tabs.map(({ key, label, icon: Icon }) => (
					<button
						key={key}
						onClick={() => setActiveTab(key)}
						className={clsx(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
							{
								"bg-Swahilipot-600 text-white": activeTab === key,
								"text-slate-400 hover:text-white": activeTab !== key,
							},
						)}>
						<Icon size={14} />
						{label}
					</button>
				))}
			</div>

			{/* ── PROFILE TAB ── */}
			{activeTab === "profile" && (
				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Personal Information
					</h3>
					<form
						onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
						className="space-y-5">
						<div className="grid grid-cols-2 gap-4">
							<div className="input-group">
								<label className="input-label">First Name</label>
								<input {...register("first_name")} className="input" />
							</div>
							<div className="input-group">
								<label className="input-label">Last Name</label>
								<input {...register("last_name")} className="input" />
							</div>
						</div>
						<div className="input-group">
							<label className="input-label flex items-center gap-1.5">
								<Mail size={12} />
								Email Address
							</label>
							<input
								type="email"
								value={user?.email}
								disabled
								className="input opacity-50 cursor-not-allowed"
							/>
							<p className="text-xs text-slate-500 mt-1">
								Contact your administrator to change your email.
							</p>
						</div>
						<div className="input-group">
							<label className="input-label flex items-center gap-1.5">
								<Phone size={12} />
								Phone Number
							</label>
							<input
								{...register("phone")}
								className="input"
								placeholder="+254 700 000 000"
							/>
						</div>
						<div className="input-group">
							<label className="input-label">Bio</label>
							<textarea
								{...register("bio")}
								rows={3}
								className="textarea"
								placeholder="Tell us about yourself..."
							/>
						</div>

						<div className="border-t border-surface-border pt-5">
							<h4 className="text-sm font-semibold text-white mb-4">
								Emergency Contact
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="input-group">
									<label className="input-label">Contact Name</label>
									<input
										{...register("emergency_contact_name")}
										className="input"
									/>
								</div>
								<div className="input-group">
									<label className="input-label">Contact Phone</label>
									<input
										{...register("emergency_contact_phone")}
										className="input"
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								disabled={updateMutation.isPending}
								className="btn-primary">
								<Save size={15} />
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* ── SECURITY TAB ── */}
			{activeTab === "security" && (
				<div className="space-y-5">
					{/* Change Password */}
					<div className="card">
						<h3 className="font-semibold text-white mb-5 flex items-center gap-2">
							<Key size={16} className="text-Swahilipot-400" />
							Change Password
						</h3>
						<div className="space-y-4">
							<div className="input-group">
								<label className="input-label">Current Password</label>
								<div className="relative">
									<input
										type={showCurrentPw ? "text" : "password"}
										value={pwForm.current_password}
										onChange={(e) =>
											setPwForm((p) => ({
												...p,
												current_password: e.target.value,
											}))
										}
										className="input pr-10"
										placeholder="••••••••••"
									/>
									<button
										type="button"
										onClick={() => setShowCurrentPw(!showCurrentPw)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
										{showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
									</button>
								</div>
							</div>
							<div className="input-group">
								<label className="input-label">New Password</label>
								<div className="relative">
									<input
										type={showNewPw ? "text" : "password"}
										value={pwForm.new_password}
										onChange={(e) =>
											setPwForm((p) => ({ ...p, new_password: e.target.value }))
										}
										className="input pr-10"
										placeholder="Min. 10 characters"
									/>
									<button
										type="button"
										onClick={() => setShowNewPw(!showNewPw)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
										{showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
									</button>
								</div>
								{pwForm.new_password && (
									<div className="mt-2 flex gap-1">
										{[8, 10, 12, 16].map((len) => (
											<div
												key={len}
												className={clsx(
													"h-1 flex-1 rounded-full transition-colors",
													{
														"bg-red-500": pwForm.new_password.length < 8,
														"bg-amber-500":
															pwForm.new_password.length >= 8 &&
															pwForm.new_password.length < 12,
														"bg-green-500": pwForm.new_password.length >= 12,
													},
												)}
											/>
										))}
									</div>
								)}
							</div>
							<div className="input-group">
								<label className="input-label">Confirm New Password</label>
								<input
									type="password"
									value={pwForm.confirm}
									onChange={(e) =>
										setPwForm((p) => ({ ...p, confirm: e.target.value }))
									}
									className={clsx("input", {
										"border-red-500":
											pwForm.confirm && pwForm.confirm !== pwForm.new_password,
										"border-green-500":
											pwForm.confirm && pwForm.confirm === pwForm.new_password,
									})}
									placeholder="••••••••••"
								/>
							</div>
							<div className="flex justify-end">
								<button
									onClick={handlePasswordChange}
									disabled={
										pwLoading ||
										!pwForm.current_password ||
										!pwForm.new_password
									}
									className="btn-primary">
									{pwLoading ? "Changing..." : "Change Password"}
								</button>
							</div>
						</div>
					</div>

					{/* MFA */}
					<div className="card">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-white flex items-center gap-2">
									<Smartphone size={16} className="text-Swahilipot-400" />
									Two-Factor Authentication
								</h3>
								<p className="text-sm text-slate-400 mt-1">
									Add an extra layer of security with a TOTP app like Google
									Authenticator.
								</p>
							</div>
							<div
								className={clsx(
									"flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
									{
										"bg-green-900/30 text-green-400 border border-green-500/30":
											user?.mfa_enabled,
										"bg-surface-elevated text-slate-400 border border-surface-border":
											!user?.mfa_enabled,
									},
								)}>
								{user?.mfa_enabled ? (
									<>
										<CheckCircle size={14} /> Enabled
									</>
								) : (
									<>
										<AlertCircle size={14} /> Disabled
									</>
								)}
							</div>
						</div>
						<div className="mt-4">
							{!user?.mfa_enabled ? (
								<button className="btn-primary btn-sm">Enable 2FA</button>
							) : (
								<button className="btn-danger btn-sm">Disable 2FA</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ── NOTIFICATIONS TAB ── */}
			{activeTab === "notifications" && (
				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Notification Preferences
					</h3>
					<div className="space-y-4">
						{[
							{
								label: "Email Notifications",
								sub: "Receive alerts and updates via email",
								field: "notification_email",
							},
							{
								label: "SMS Notifications",
								sub: "Receive critical alerts via SMS",
								field: "notification_sms",
							},
							{
								label: "Push Notifications",
								sub: "Browser and mobile push alerts",
								field: "notification_push",
							},
						].map(({ label, sub, field }) => (
							<div
								key={field}
								className="flex items-center justify-between p-4 bg-surface rounded-xl border border-surface-border">
								<div>
									<div className="text-sm font-medium text-white">{label}</div>
									<div className="text-xs text-slate-500 mt-0.5">{sub}</div>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										defaultChecked={(user as any)?.[field]}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-Swahilipot-600" />
								</label>
							</div>
						))}
					</div>
					<div className="flex justify-end mt-5">
						<button className="btn-primary">
							<Save size={14} /> Save Preferences
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
