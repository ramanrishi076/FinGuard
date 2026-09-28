import React, { useState } from "react";
import { walletService } from "../../services/api";
import {
  Send,
  X,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export const TransferModal = ({ isOpen, onClose, onSuccess, currentBalance, currentUserId }) => {
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [blockedResult, setBlockedResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const numericBalance = Number(currentBalance || 0);
  const transferNum = Number(amount || 0);

  // Live client-side risk indicator
  const isLargeAmount = transferNum >= 50000;
  const isDrainRisk = numericBalance > 0 && transferNum / numericBalance >= 0.85;

  const handleReset = () => {
    setReceiverId("");
    setAmount("");
    setDescription("");
    setResult(null);
    setBlockedResult(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBlockedResult(null);

    const targetReceiver = Number(receiverId);
    if (!targetReceiver || targetReceiver <= 0) {
      setError("Please provide a valid recipient User ID");
      return;
    }

    if (targetReceiver === Number(currentUserId)) {
      setError("Self-transfers are not allowed. Please enter another user's ID.");
      return;
    }

    if (!transferNum || transferNum <= 0) {
      setError("Please enter a valid transfer amount greater than 0");
      return;
    }

    if (transferNum > numericBalance) {
      setError(`Insufficient balance. Current balance is ₹${numericBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.transfer(targetReceiver, transferNum, description);
      setResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.fraud) {
        setBlockedResult(err.response.data);
      } else {
        setError(err.response?.data?.message || "Failed to execute transfer. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transfer Funds</h3>
            <p className="text-xs text-slate-400">
              Wallet Balance: ₹{numericBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* State 1: Transaction BLOCKED Result */}
        {blockedResult && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-6 h-6 text-rose-400" />
                <h4 className="text-base font-bold text-rose-300">Transaction BLOCKED by AI Shield</h4>
              </div>
              <p className="text-xs leading-relaxed text-rose-200/90 mb-3">
                {blockedResult.message || "This transaction was automatically blocked due to high fraud risk evaluation."}
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Composite Risk Score:</span>
                  <span className="font-bold text-rose-400 text-sm">
                    {blockedResult.fraud?.riskScore}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Decision Status:</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase text-[10px]">
                    {blockedResult.fraud?.decision}
                  </span>
                </div>
                {blockedResult.fraud?.reasons?.length > 0 && (
                  <div>
                    <span className="text-slate-400 block mb-1">Detected Risk Triggers:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300">
                      {blockedResult.fraud.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Try Another Transaction
            </button>
          </div>
        )}

        {/* State 2: Transaction Successful Result */}
        {result && !blockedResult && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h4 className="text-base font-bold text-emerald-300">Transfer Successful</h4>
              </div>
              <p className="text-xs leading-relaxed text-emerald-200/90 mb-3">
                Sent ₹{Number(result.transaction.amount).toLocaleString()} to User #{receiverId}.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-200">#{result.transaction.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Fraud AI Risk Score:</span>
                  <span className="font-bold text-slate-200">
                    {result.fraud?.riskScore}/100 ({result.fraud?.decision})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">New Balance:</span>
                  <span className="font-bold text-emerald-400">
                    ₹{Number(result.senderWallet?.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* State 3: Active Form */}
        {!result && !blockedResult && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Recipient User ID
              </label>
              <input
                type="number"
                min="1"
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="Enter recipient User ID (e.g. 2)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Amount (₹)</label>
                <span className="text-[11px] text-slate-400">
                  Available: ₹{numericBalance.toLocaleString()}
                </span>
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
                  placeholder="e.g. 500"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description / Memo (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Project payment, rent, groceries"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

            {/* AI Risk Radar Indicator */}
            {(isLargeAmount || isDrainRisk) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 block">AI Shield Evaluation Notice:</span>
                  <span className="text-[11px] text-amber-200/80">
                    {isLargeAmount && "Amount ≥ ₹50,000 activates large transaction heuristic review. "}
                    {isDrainRisk && "Transferring ≥ 85% of wallet reserves may trigger anomaly detection."}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || numericBalance <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running AI Fraud Analysis & Processing...
                  </>
                ) : (
                  "Evaluate & Send Transfer"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
