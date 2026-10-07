import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";

export const AuthView = () => {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError("Name is required");
          return;
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please verify credentials.");
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@finguard.com");
    setPassword("password123");
    setName("Demo User");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--text-secondary)] relative">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface-dim)]">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#1b6ef3] flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] m-0">FinGuard Pay</h1>
                  <div className="flex items-center gap-1 ml-1">
                    <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                    <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
                    <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
                    <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">Google Pay Aesthetic • UPI Simulation</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
              AI-Shielded UPI Protection
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] leading-relaxed mb-6">
              Full-stack digital wallet powered by real-time heuristics, standardized ML inference, and instant WebSocket notifications.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <div className="w-5 h-5 rounded-full bg-[#34a853]/20 text-[#81c995] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Trained on 1 Lakh transactions with 99.98% ML accuracy</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <div className="w-5 h-5 rounded-full bg-[#1b6ef3]/20 text-[var(--gpay-blue-light)] flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Sub-millisecond native Node.js fraud prediction engine</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <div className="w-5 h-5 rounded-full bg-[#fbbc04]/20 text-[#fde293] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Socket.IO live alerts and Redis-accelerated wallet cache</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>FinGuard v1.0 • Desktop Client</span>
            <button
              onClick={handleFillDemo}
              className="text-[var(--gpay-blue-light)] hover:text-[#aecbfa] font-semibold transition-colors cursor-pointer"
            >
              Fill Sample Credentials
            </button>
          </div>
        </div>

        {/* Right Side: Login & Register Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {isRegister ? "Create Google Account" : "Sign in to FinGuard"}
            </h3>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[var(--gpay-blue-light)] hover:text-[#aecbfa] font-semibold cursor-pointer"
            >
              {isRegister ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-[#ea4335]/15 border border-[#ea4335]/30 text-[#f28b82] text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-[#ea4335] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email ID"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-xs sm:text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white font-semibold text-sm shadow-lg shadow-[#1b6ef3]/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>{isRegister ? "Create Wallet & Sign In" : "Sign In to FinGuard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
