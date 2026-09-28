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
} from "lucide-react";

export const AuthView = () => {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#090d16] text-slate-100 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/80">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white m-0">FinGuard</h1>
                <p className="text-xs text-slate-400">Desktop Digital Wallet Simulation</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              AI-Shielded Financial Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Full-stack digital wallet powered by real-time heuristic rules, machine learning fraud detection, and instantaneous socket notifications.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Trained on 1 Lakh transactions with 99.98% ML accuracy</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Sub-millisecond native Node.js fraud prediction engine</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Socket.IO live alerts and Redis-accelerated wallet cache</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>FinGuard v1.0 • Desktop Client</span>
            <button
              onClick={handleFillDemo}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Fill Sample Credentials
            </button>
          </div>
        </div>

        {/* Right Side: Login & Register Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h3>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {isRegister ? "Sign In Instead" : "Register New Wallet"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>{isRegister ? "Create Wallet & Sign In" : "Sign In to Wallet"}</span>
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
