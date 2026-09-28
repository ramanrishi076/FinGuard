import React, { useState } from "react";
import { walletService } from "../../services/api";
import { ArrowUpRight, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const WithdrawModal = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const numericBalance = Number(currentBalance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const withdrawNum = Number(amount);
    if (!withdrawNum || withdrawNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (withdrawNum > numericBalance) {
      setError(`Insufficient balance. Maximum available is ₹${numericBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.withdraw(withdrawNum);
      setSuccess(`Successfully withdrew ₹${withdrawNum.toLocaleString()}.`);
      if (onSuccess) onSuccess(res);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setAmount("");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process withdrawal. Please try again.");
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
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
            <p className="text-xs text-slate-400">
              Available balance: ₹{numericBalance.toLocaleString()}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Withdrawal Amount (₹)</label>
              <button
                type="button"
                onClick={() => setAmount(String(numericBalance))}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Use Max (₹{numericBalance.toLocaleString()})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                max={numericBalance}
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || numericBalance <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Withdrawal...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
