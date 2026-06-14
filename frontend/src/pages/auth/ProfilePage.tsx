<<<<<<< HEAD
// Swahilipot — My Profile Page  (fixed)
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
=======
// Swahilipot — My Profile Page
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
>>>>>>> origin/main
import {
	User,
	Mail,
	Phone,
<<<<<<< HEAD
=======
	Building2,
>>>>>>> origin/main
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
<<<<<<< HEAD
	QrCode,
=======
>>>>>>> origin/main
} from "lucide-react";
import { authApi, useAuthStore } from "../../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NotificationPrefs {
	notification_email: boolean;
	notification_sms: boolean;
	notification_push: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePage() {
	const { user, setUser } = useAuthStore();
	const qc = useQueryClient();

	const [activeTab, setActiveTab] = useState<
		"profile" | "security" | "notifications"
	>("profile");

	// ── Avatar preview ──────────────────────────────────────────────────────
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be smaller than 5 MB");
			return;
		}
		setAvatarFile(file);
		const reader = new FileReader();
		reader.onload = () => setAvatarPreview(reader.result as string);
		reader.readAsDataURL(file);
	};

	// ── Password ─────────────────────────────────────────────────────────────
=======
export default function ProfilePage() {
	const { user, setUser } = useAuthStore();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<
		"profile" | "security" | "notifications"
	>("profile");
>>>>>>> origin/main
	const [showCurrentPw, setShowCurrentPw] = useState(false);
	const [showNewPw, setShowNewPw] = useState(false);
	const [pwForm, setPwForm] = useState({
		current_password: "",
		new_password: "",
		confirm: "",
	});
	const [pwLoading, setPwLoading] = useState(false);

<<<<<<< HEAD
	// ── 2FA setup dialog ──────────────────────────────────────────────────────
	const [mfaLoading, setMfaLoading] = useState(false);
	const [mfaQr, setMfaQr] = useState<string | null>(null); // base64 QR image
	const [mfaCode, setMfaCode] = useState("");

	// ── Notification prefs local state ────────────────────────────────────────
	const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
		notification_email: !!(user as any)?.notification_email,
		notification_sms: !!(user as any)?.notification_sms,
		notification_push: !!(user as any)?.notification_push,
	});

	// ── React Hook Form ───────────────────────────────────────────────────────
=======
>>>>>>> origin/main
	const {
		register,
		handleSubmit,
		formState: { isDirty },
<<<<<<< HEAD
	} = useForm({
		defaultValues: user || {},
	});

	// ── Mutations ─────────────────────────────────────────────────────────────

	// Profile text fields + optional avatar
	const updateMutation = useMutation({
		mutationFn: async (data: any) => {
			if (avatarFile) {
				// If the API supports multipart, send FormData; otherwise send JSON + a
				// separate avatar request.  We try FormData first and fall back.
				try {
					const fd = new FormData();
					Object.entries(data).forEach(
						([k, v]) =>
							v !== undefined && v !== null && fd.append(k, v as string),
					);
					fd.append("profile_photo", avatarFile);
					return await (authApi as any).updateProfileMultipart(fd);
				} catch {
					// API doesn't support multipart — update text fields only for now
					toast(
						"Avatar upload not supported by your API yet — profile fields saved.",
						{
							icon: "ℹ️",
						},
					);
				}
			}
			// Plain JSON update (most common)
			if (typeof (authApi as any).updateProfile === "function") {
				return (authApi as any).updateProfile(data);
			}
			// Fallback: PATCH /auth/profile/
			const res = await fetch("/api/auth/profile/", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error(await res.text());
			return res.json();
		},
		onSuccess: (res) => {
			// axios wraps response in .data; unwrap one level
			const updated = res?.data ?? res;
			if (updated?.id) setUser(updated);
			setAvatarFile(null);
			setAvatarPreview(null);
			// Reset file input so selecting the same file again fires onChange
			const input = document.getElementById(
				"avatar-upload",
			) as HTMLInputElement;
			if (input) input.value = "";
			qc.invalidateQueries({ queryKey: ["profile"] });
			toast.success("Profile updated");
		},
		onError: (err: any) => {
			console.error("Profile update error:", err);
			toast.error(err?.response?.data?.detail ?? "Failed to update profile");
		},
	});

	// Notification prefs
	const notifMutation = useMutation({
		mutationFn: async (prefs: NotificationPrefs) => {
			if (typeof (authApi as any).updateProfile === "function") {
				return (authApi as any).updateProfile(prefs);
			}
			const res = await fetch("/api/auth/profile/", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(prefs),
			});
			if (!res.ok) throw new Error(await res.text());
			return res.json();
		},
		onSuccess: (res) => {
			if (res?.data) setUser(res.data);
			else if (res) setUser(res);
			toast.success("Preferences saved");
		},
		onError: () => toast.error("Failed to save preferences"),
	});

	// ── Password change ───────────────────────────────────────────────────────
=======
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

>>>>>>> origin/main
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
<<<<<<< HEAD
			if (typeof (authApi as any).changePassword === "function") {
				await (authApi as any).changePassword({
					current_password: pwForm.current_password,
					new_password: pwForm.new_password,
				});
			} else {
				const res = await fetch("/api/auth/change-password/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						current_password: pwForm.current_password,
						new_password: pwForm.new_password,
					}),
				});
				if (!res.ok) throw new Error(await res.text());
			}
			toast.success("Password changed successfully");
			setPwForm({ current_password: "", new_password: "", confirm: "" });
		} catch (err: any) {
			toast.error(
				err?.response?.data?.detail ??
					"Failed to change password — check your current password",
			);
=======
			await authApi.profile(); // placeholder - would call change password endpoint
			toast.success("Password changed successfully");
			setPwForm({ current_password: "", new_password: "", confirm: "" });
		} catch {
			toast.error("Failed to change password — check current password");
>>>>>>> origin/main
		} finally {
			setPwLoading(false);
		}
	};

<<<<<<< HEAD
	// ── 2FA ──────────────────────────────────────────────────────────────────
	const handleToggle2FA = async () => {
		setMfaLoading(true);
		try {
			if (!user?.mfa_enabled) {
				// Enable: fetch QR code from API
				let qrData: string | null = null;
				if (typeof (authApi as any).mfaSetup === "function") {
					const res = await (authApi as any).mfaSetup();
					qrData = res?.data?.qr_code ?? res?.qr_code ?? null;
				} else {
					const res = await fetch("/api/auth/mfa/setup/", {
						method: "POST",
						credentials: "include",
					});
					if (!res.ok) throw new Error(await res.text());
					const json = await res.json();
					qrData = json?.qr_code ?? null;
				}
				setMfaQr(qrData);
				setMfaCode("");
			} else {
				// Disable 2FA
				if (typeof (authApi as any).mfaDisable === "function") {
					await (authApi as any).mfaDisable();
				} else {
					const res = await fetch("/api/auth/mfa/disable/", {
						method: "POST",
						credentials: "include",
					});
					if (!res.ok) throw new Error(await res.text());
				}
				setUser({ ...user!, mfa_enabled: false });
				toast.success("Two-factor authentication disabled");
			}
		} catch (err: any) {
			toast.error(err?.response?.data?.detail ?? "2FA action failed");
		} finally {
			setMfaLoading(false);
		}
	};

	const handleMfaVerify = async () => {
		if (mfaCode.length < 6) {
			toast.error("Enter the 6-digit code from your authenticator app");
			return;
		}
		setMfaLoading(true);
		try {
			if (typeof (authApi as any).mfaVerify === "function") {
				await (authApi as any).mfaVerify({ code: mfaCode });
			} else {
				const res = await fetch("/api/auth/mfa/verify/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ code: mfaCode }),
				});
				if (!res.ok) throw new Error(await res.text());
			}
			setUser({ ...user!, mfa_enabled: true });
			setMfaQr(null);
			setMfaCode("");
			toast.success("Two-factor authentication enabled");
		} catch {
			toast.error("Invalid code — please try again");
		} finally {
			setMfaLoading(false);
		}
	};

	// ── Tabs ──────────────────────────────────────────────────────────────────
=======
>>>>>>> origin/main
	const tabs = [
		{ key: "profile", label: "Profile", icon: User },
		{ key: "security", label: "Security", icon: Shield },
		{ key: "notifications", label: "Notifications", icon: Bell },
	] as const;

<<<<<<< HEAD
	// ── Render ────────────────────────────────────────────────────────────────
=======
>>>>>>> origin/main
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

<<<<<<< HEAD
			{/* ── Avatar + name card ─────────────────────────────────────────── */}
			<div className="card flex items-center gap-5">
				<div className="relative">
					{/* File input — label triggers it, no JS .click() needed */}
					<label htmlFor="avatar-upload" className="cursor-pointer">
						{/* Avatar display */}
						{avatarPreview ? (
							<img
								src={avatarPreview}
								alt="Avatar preview"
								className="w-20 h-20 rounded-2xl object-cover shadow-Swahilipot"
							/>
						) : user?.profile_photo ? (
							<img
								src={user.profile_photo}
								alt="Profile"
								className="w-20 h-20 rounded-2xl object-cover shadow-Swahilipot"
							/>
						) : (
							<div className="w-20 h-20 rounded-2xl bg-gradient-Swahilipot flex items-center justify-center text-2xl font-bold text-white shadow-Swahilipot">
								{user?.first_name?.[0]}
								{user?.last_name?.[0]}
							</div>
						)}
					</label>

					<input
						id="avatar-upload"
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleAvatarChange}
					/>

					{/* Camera button — also opens file picker via label */}
					<label
						htmlFor="avatar-upload"
						title="Change profile picture"
						className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-Swahilipot-600 flex items-center justify-center border-2 border-surface-card hover:bg-Swahilipot-700 transition-colors cursor-pointer">
						<Camera size={12} className="text-white" />
					</label>
				</div>

=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
					{avatarPreview && (
						<p className="text-xs text-amber-400 mt-1">
							New photo selected — save profile to apply.
						</p>
					)}
				</div>
			</div>

			{/* ── Tabs ──────────────────────────────────────────────────────── */}
=======
				</div>
			</div>

			{/* Tabs */}
>>>>>>> origin/main
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

<<<<<<< HEAD
			{/* ── PROFILE TAB ───────────────────────────────────────────────── */}
=======
			{/* ── PROFILE TAB ── */}
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
			{/* ── SECURITY TAB ──────────────────────────────────────────────── */}
=======
			{/* ── SECURITY TAB ── */}
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
								{/* Strength bar */}
=======
>>>>>>> origin/main
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
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD

							<div className="flex justify-end">
								<button
									type="button"
=======
							<div className="flex justify-end">
								<button
>>>>>>> origin/main
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

<<<<<<< HEAD
					{/* Two-Factor Authentication */}
=======
					{/* MFA */}
>>>>>>> origin/main
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
<<<<<<< HEAD

						{/* QR setup dialog */}
						{mfaQr && (
							<div className="mt-5 p-4 bg-surface-elevated border border-surface-border rounded-xl space-y-4">
								<div className="flex items-center gap-2 text-sm font-medium text-white">
									<QrCode size={16} className="text-Swahilipot-400" />
									Scan with your authenticator app
								</div>
								<img
									src={mfaQr}
									alt="2FA QR Code"
									className="w-40 h-40 rounded-lg mx-auto bg-white p-2"
								/>
								<div className="input-group">
									<label className="input-label">
										Enter the 6-digit code to confirm
									</label>
									<input
										type="text"
										inputMode="numeric"
										maxLength={6}
										value={mfaCode}
										onChange={(e) =>
											setMfaCode(e.target.value.replace(/\D/g, ""))
										}
										className="input tracking-[0.4em] text-center text-lg"
										placeholder="000000"
									/>
								</div>
								<div className="flex gap-2 justify-end">
									<button
										type="button"
										onClick={() => {
											setMfaQr(null);
											setMfaCode("");
										}}
										className="btn-ghost btn-sm">
										Cancel
									</button>
									<button
										type="button"
										onClick={handleMfaVerify}
										disabled={mfaLoading || mfaCode.length < 6}
										className="btn-primary btn-sm">
										{mfaLoading ? "Verifying..." : "Verify & Enable"}
									</button>
								</div>
							</div>
						)}

						{!mfaQr && (
							<div className="mt-4">
								{!user?.mfa_enabled ? (
									<button
										type="button"
										onClick={handleToggle2FA}
										disabled={mfaLoading}
										className="btn-primary btn-sm">
										{mfaLoading ? "Setting up..." : "Enable 2FA"}
									</button>
								) : (
									<button
										type="button"
										onClick={handleToggle2FA}
										disabled={mfaLoading}
										className="btn-danger btn-sm">
										{mfaLoading ? "Disabling..." : "Disable 2FA"}
									</button>
								)}
							</div>
						)}
=======
						<div className="mt-4">
							{!user?.mfa_enabled ? (
								<button className="btn-primary btn-sm">Enable 2FA</button>
							) : (
								<button className="btn-danger btn-sm">Disable 2FA</button>
							)}
						</div>
>>>>>>> origin/main
					</div>
				</div>
			)}

<<<<<<< HEAD
			{/* ── NOTIFICATIONS TAB ─────────────────────────────────────────── */}
=======
			{/* ── NOTIFICATIONS TAB ── */}
>>>>>>> origin/main
			{activeTab === "notifications" && (
				<div className="card">
					<h3 className="font-semibold text-white mb-5">
						Notification Preferences
					</h3>
					<div className="space-y-4">
<<<<<<< HEAD
						{(
							[
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
							] as {
								label: string;
								sub: string;
								field: keyof NotificationPrefs;
							}[]
						).map(({ label, sub, field }) => (
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
										checked={notifPrefs[field]}
										onChange={(e) =>
											setNotifPrefs((p) => ({
												...p,
												[field]: e.target.checked,
											}))
										}
=======
										defaultChecked={(user as any)?.[field]}
>>>>>>> origin/main
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-Swahilipot-600" />
								</label>
							</div>
						))}
					</div>
					<div className="flex justify-end mt-5">
<<<<<<< HEAD
						<button
							type="button"
							onClick={() => notifMutation.mutate(notifPrefs)}
							disabled={notifMutation.isPending}
							className="btn-primary">
							<Save size={14} />
							{notifMutation.isPending ? "Saving..." : "Save Preferences"}
=======
						<button className="btn-primary">
							<Save size={14} /> Save Preferences
>>>>>>> origin/main
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
