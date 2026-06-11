// Swahilipot — MFA Verification Page
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, AlertCircle, LogOut } from "lucide-react";
import { authApi, useAuthStore } from "../../services/api";
import toast from "react-hot-toast";

export default function MFAPage() {
	const navigate = useNavigate();
	const { setAuth, logout, user, accessToken, refreshToken } = useAuthStore();
	const [code, setCode] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

	const handleChange = (i: number, val: string) => {
		if (!/^\d*$/.test(val)) return;
		const next = [...code];
		next[i] = val.slice(-1);
		setCode(next);
		if (val && i < 5) inputs.current[i + 1]?.focus();
		if (next.every((d) => d !== "") && next.join("").length === 6) {
			handleVerify(next.join(""));
		}
	};

	const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
		if (e.key === "Backspace" && !code[i] && i > 0) {
			inputs.current[i - 1]?.focus();
		}
	};

	const handleVerify = async (token?: string) => {
		const otp = token || code.join("");
		if (otp.length !== 6) {
			setError("Enter all 6 digits");
			return;
		}
		setLoading(true);
		setError("");
		try {
			await authApi.verifyMfa(otp);
			if (user) setAuth(user, accessToken!, refreshToken!, false);
			toast.success("MFA verified successfully");
			navigate("/dashboard");
		} catch {
			setError("Invalid code. Please try again.");
			setCode(["", "", "", "", "", ""]);
			inputs.current[0]?.focus();
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-surface flex items-center justify-center p-4">
			<div className="absolute top-1/4 left-1/3 w-80 h-80 bg-Swahilipot-600/15 rounded-full blur-3xl" />
			<div className="relative z-10 w-full max-w-sm animate-slide-up">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-Swahilipot shadow-Swahilipot mb-4">
						<Shield size={28} className="text-white" />
					</div>
					<h1 className="font-display font-bold text-2xl text-white">
						Two-Factor Auth
					</h1>
					<p className="text-slate-400 text-sm mt-2">
						Enter the 6-digit code from your authenticator app
					</p>
					{user?.email && (
						<p className="text-xs text-slate-500 mt-1">{user.email}</p>
					)}
				</div>

				<div className="card-elevated">
					{error && (
						<div className="alert alert-danger mb-5">
							<AlertCircle size={14} /> <span>{error}</span>
						</div>
					)}

					<div className="flex justify-center gap-3 mb-6">
						{code.map((digit, i) => (
							<input
								key={i}
								ref={(el) => (inputs.current[i] = el)}
								type="text"
								inputMode="numeric"
								maxLength={1}
								value={digit}
								onChange={(e) => handleChange(i, e.target.value)}
								onKeyDown={(e) => handleKeyDown(i, e)}
								onFocus={(e) => e.target.select()}
								className="w-12 h-14 text-center text-xl font-bold bg-surface border-2 border-surface-border rounded-xl text-white focus:outline-none focus:border-Swahilipot-500 focus:ring-1 focus:ring-Swahilipot-500/30 transition-all"
								autoFocus={i === 0}
							/>
						))}
					</div>

					<button
						onClick={() => handleVerify()}
						disabled={loading || code.some((d) => !d)}
						className="btn-primary w-full py-3 justify-center">
						{loading ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Verifying...
							</span>
						) : (
							<span className="flex items-center gap-2">
								Verify Code <ArrowRight size={16} />
							</span>
						)}
					</button>

					<button
						onClick={handleLogout}
						className="btn-ghost w-full mt-3 justify-center text-slate-500 text-sm">
						<LogOut size={14} /> Sign out and use a different account
					</button>
				</div>
			</div>
		</div>
	);
}
