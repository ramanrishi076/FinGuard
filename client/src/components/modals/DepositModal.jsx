import React, { useState } from "react";
import { walletService } from "../../services/api";
import { ArrowDownLeft, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const DepositModal = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 5000, 10000, 25000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const depositNum = Number(amount);
    if (!depositNum || depositNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.deposit(depositNum);
      setSuccess(`Successfully deposited ₹${depositNum.toLocaleString()} into your wallet.`);
      if (onSuccess) onSuccess(res);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setAmount("");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process deposit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deposit Funds</h3>
            <p className="text-xs text-slate-400">
              Current balance: ₹{Number(currentBalance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deposit Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-2">Quick Select</label>
            <div className="grid grid-cols-5 gap-1.5">
              {quickAmounts.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-300 border border-slate-700/40 transition-colors"
                >
                  ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Deposit...
                </>
              ) : (
                "Confirm Deposit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
