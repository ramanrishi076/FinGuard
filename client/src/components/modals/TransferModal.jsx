import React, { useState, useEffect } from "react";
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
  AtSign,
  User,
  Sparkles,
} from "lucide-react";

export const TransferModal = ({ isOpen, onClose, onSuccess, currentBalance, currentUserId }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [blockedResult, setBlockedResult] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [verifiedRecipient, setVerifiedRecipient] = useState(null);

  const numericBalance = Number(currentBalance || 0);
  const transferNum = Number(amount || 0);

  // Live client-side risk indicator
  const isLargeAmount = transferNum >= 50000;
  const isDrainRisk = numericBalance > 0 && transferNum / numericBalance >= 0.85;

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchSuggestions = async () => {
      try {
        const list = await walletService.lookupRecipients(recipient);
        if (active) {
          setSuggestions(list);
          const q = recipient.trim().toLowerCase();
          const exact = list.find(
            (u) =>
              u.upiId.toLowerCase() === q ||
              u.email.toLowerCase() === q ||
              String(u.id) === q ||
              u.name.toLowerCase() === q
          );
          setVerifiedRecipient(exact || null);
        }
      } catch {
        // Ignored
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [recipient, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setRecipient("");
    setAmount("");
    setDescription("");
    setResult(null);
    setBlockedResult(null);
    setError(null);
    setVerifiedRecipient(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSelectRecipient = (u) => {
    setRecipient(u.upiId);
    setVerifiedRecipient(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBlockedResult(null);

    const targetRecipient = recipient.trim();
    if (!targetRecipient) {
      setError("Please provide a valid recipient Name, UPI ID, or User ID");
      return;
    }

    if (
      (verifiedRecipient && Number(verifiedRecipient.id) === Number(currentUserId)) ||
      targetRecipient === String(currentUserId)
    ) {
      setError("Self-transfers are not allowed. Please enter another user's UPI ID or ID.");
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
      const res = await walletService.transfer(targetRecipient, transferNum, description);
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
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
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
                Sent ₹{Number(result.transaction.amount).toLocaleString()} to{" "}
                <strong>{result.recipient?.name || "Recipient"}</strong> ({result.recipient?.upiId || recipient}).
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-semibold text-white">{result.recipient?.name || "Recipient"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Recipient UPI ID:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{result.recipient?.upiId || recipient}</span>
                </div>
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
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Recipient (UPI ID, Name, or User ID)
                </label>
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> FinGuard UPI
                </span>
              </div>
              <div className="relative">
                <AtSign className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter UPI ID (e.g. alice@finguard) or User ID"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-600 text-sm outline-none transition-all font-sans"
                />
              </div>

              {/* Verified Recipient Confirmation Pill */}
              {verifiedRecipient && (
                <div className="mt-2 p-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300">
                      Recipient: <strong className="text-white">{verifiedRecipient.name}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                    {verifiedRecipient.upiId}
                  </span>
                </div>
              )}

              {/* Quick Suggestions / Contacts */}
              {suggestions.length > 0 && !verifiedRecipient && (
                <div className="mt-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Quick Select Contact:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectRecipient(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-colors cursor-pointer"
                      >
                        <User className="w-3 h-3 text-cyan-400" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400">({s.upiId})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
