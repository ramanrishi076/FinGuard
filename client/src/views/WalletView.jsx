import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { walletService } from "../services/api";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CreditCard,
  Shield,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const WalletView = ({
  wallet,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const balanceNum = Number(wallet?.balance || 0);

  const handleQuickTransfer = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const targetRecipient = recipient.trim();
    const transferNum = Number(amount);

    if (!targetRecipient) {
      setFeedback({ type: "error", message: "Please enter a valid recipient UPI ID, name, or User ID." });
      return;
    }

    if (targetRecipient === String(user?.id)) {
      setFeedback({ type: "error", message: "Self-transfer is not allowed." });
      return;
    }

    if (!transferNum || transferNum <= 0) {
      setFeedback({ type: "error", message: "Please enter an amount greater than 0." });
      return;
    }

    if (transferNum > balanceNum) {
      setFeedback({ type: "error", message: "Insufficient balance in wallet." });
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.transfer(targetRecipient, transferNum, description);
      setFeedback({
        type: "success",
        message: `Transfer of ₹${transferNum.toLocaleString()} to ${res.recipient?.name || targetRecipient} completed successfully (Risk Score: ${res.fraud?.riskScore}/100 - ${res.fraud?.decision}).`,
      });
      setRecipient("");
      setAmount("");
      setDescription("");
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.fraud) {
        setFeedback({
          type: "blocked",
          message: `Transfer BLOCKED by AI Shield (Risk: ${err.response.data.fraud.riskScore}/100). Reasons: ${err.response.data.fraud.reasons?.join(", ")}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: err.response?.data?.message || "Transfer execution failed.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Wallet & Fund Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your virtual wallet reserves, perform transfers, and inspect security telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Virtual Metallic Card & Wallet Stats */}
        <div className="lg:col-span-6 space-y-6">
          {/* Virtual Digital Card */}
          <div className="rounded-3xl p-7 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-700/80 shadow-2xl relative overflow-hidden group">
            {/* Card glow background */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white tracking-wider uppercase">FinGuard</span>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                ACTIVE
              </span>
            </div>

            {/* Chip & Contactless */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-200 to-amber-500 shadow-inner flex items-center justify-center">
                <div className="w-8 h-5 border border-amber-800/40 rounded-sm" />
              </div>
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>

            {/* Wallet Balance */}
            <div className="mb-6 relative z-10">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                Available Digital Balance
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-400">₹</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {balanceNum.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-mono ml-2">INR</span>
              </div>
            </div>

            {/* Cardholder details & Wallet ID */}
            <div className="flex justify-between items-end relative z-10 pt-4 border-t border-slate-800/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Cardholder</span>
                <span className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                  {user?.name || "FinGuard Member"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Wallet Ref</span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  FG-WLT-{wallet?.id ? String(wallet.id).padStart(6, "0") : "000000"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onOpenDeposit}
              className="py-3.5 px-4 rounded-2xl bg-[#0d1527] hover:bg-slate-800 border border-slate-800 text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 block">Deposit</span>
              <span className="text-[10px] text-slate-500">Add funds</span>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="py-3.5 px-4 rounded-2xl bg-[#0d1527] hover:bg-slate-800 border border-slate-800 text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 block">Withdraw</span>
              <span className="text-[10px] text-slate-500">Cash out</span>
            </button>

            <button
              onClick={onOpenTransfer}
              className="py-3.5 px-4 rounded-2xl bg-[#0d1527] hover:bg-slate-800 border border-slate-800 text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 block">Send</span>
              <span className="text-[10px] text-slate-500">Modal transfer</span>
            </button>
          </div>
        </div>

        {/* Right Column: Instant Fast Transfer Form */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-[#0d1527] p-6 sm:p-7 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Instant Wallet Transfer</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI EVALUATED
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Instantly transfer funds to another FinGuard account. Transactions are screened in real-time by the Phase 5 ML prediction model.
            </p>

            {feedback && (
              <div
                className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : feedback.type === "blocked"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : feedback.type === "blocked" ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleQuickTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient (UPI ID, Name, or User ID)
                </label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. alice@finguard or Alice or User ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Amount (₹)</label>
                  <span className="text-[11px] text-slate-400">
                    Max: ₹{balanceNum.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={balanceNum}
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Reference Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Freelance invoice, dinner split"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || balanceNum <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating & Sending...
                    </>
                  ) : (
                    "Send Transfer Now"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
