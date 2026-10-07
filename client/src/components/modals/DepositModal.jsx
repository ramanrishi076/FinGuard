import React, { useState } from "react";
import { walletService } from "../../services/api";
import { ArrowDownLeft, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { TransactionPinModal } from "./TransactionPinModal";

export const DepositModal = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 5000, 10000, 25000];

  const executeDeposit = async (pin) => {
    const depositNum = Number(amount);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await walletService.deposit(depositNum, undefined, pin);
      setSuccess(`Successfully added ₹${depositNum.toLocaleString()} to FinGuard balance.`);
      if (onSuccess) onSuccess(res);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setAmount("");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process deposit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const depositNum = Number(amount);
    if (!depositNum || depositNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    // Require PIN for deposit
    setIsPinModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center shadow-md shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Money</h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Current UPI balance: ₹{Number(currentBalance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#ea4335]/15 border border-[#ea4335]/30 text-[#f28b82] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-[#34a853]/15 border border-[#34a853]/30 text-[#81c995] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] mb-1.5">
              Deposit Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--text-tertiary)] mb-2">Quick Add</label>
            <div className="grid grid-cols-5 gap-1.5">
              {quickAmounts.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="py-1.5 px-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] transition-colors cursor-pointer"
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
              className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white font-semibold text-sm shadow-lg shadow-[#1b6ef3]/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Funds...
                </>
              ) : (
                `Add ₹${amount ? Number(amount).toLocaleString() : "0"} to Wallet`
              )}
            </button>
          </div>
        </form>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={(pin) => executeDeposit(pin)}
        title="Enter UPI PIN"
        description="Enter your 6-digit Transaction PIN to authorize this deposit."
      />
    </div>
  );
};

