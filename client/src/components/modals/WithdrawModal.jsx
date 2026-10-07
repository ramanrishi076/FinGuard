import React, { useState } from "react";
import { walletService } from "../../services/api";
import { Landmark, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { TransactionPinModal } from "./TransactionPinModal";

export const WithdrawModal = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  if (!isOpen) return null;

  const numericBalance = Number(currentBalance || 0);
  const withdrawNum = Number(amount || 0);
  const isInsufficient = withdrawNum > numericBalance;
  const shortfall = Math.max(0, withdrawNum - numericBalance);

  const executeWithdrawal = async (pin) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await walletService.withdraw(withdrawNum, pin);
      setSuccess(`Successfully transferred ₹${withdrawNum.toLocaleString()} to linked bank account.`);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!withdrawNum || withdrawNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (withdrawNum > numericBalance) {
      setError(
        `Insufficient balance in account: Available balance is ₹${numericBalance.toLocaleString()}, but requested withdrawal is ₹${withdrawNum.toLocaleString()} (shortfall: ₹${shortfall.toLocaleString()}).`
      );
      return;
    }

    // Require PIN for withdrawal
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
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[var(--gpay-blue-light)] flex items-center justify-center shadow-md shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Transfer to Bank</h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Available UPI balance: ₹{numericBalance.toLocaleString()}
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-tertiary)]">Amount (₹)</label>
              <button
                type="button"
                onClick={() => setAmount(String(numericBalance))}
                className="text-[11px] font-semibold text-[var(--gpay-blue-light)] hover:text-[#aecbfa] transition-colors cursor-pointer"
              >
                Use Max (₹{numericBalance.toLocaleString()})
              </button>
            </div>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${isInsufficient ? "text-[#ea4335]" : "text-[var(--text-tertiary)]"}`}>₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-2.5 rounded-full bg-[var(--input-bg)] border placeholder-[var(--text-placeholder)] text-sm outline-none transition-all ${
                  isInsufficient
                    ? "border-[#ea4335] text-[#ea4335] focus:border-[#ea4335]"
                    : "border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)]"
                }`}
              />
            </div>
            {isInsufficient && (
              <p className="mt-2 text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#ea4335] shrink-0" />
                Insufficient balance: Available ₹{numericBalance.toLocaleString()} (Shortfall: ₹{shortfall.toLocaleString()})
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || numericBalance <= 0 || isInsufficient}
              className={`w-full py-3 rounded-full font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isInsufficient
                  ? "bg-[#ea4335]/85 text-white hover:bg-[#ea4335] cursor-not-allowed opacity-90 shadow-rose-900/20"
                  : "bg-[#1b6ef3] hover:bg-[#1558c7] text-white disabled:opacity-50 shadow-[#1b6ef3]/20"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Withdrawal...
                </>
              ) : isInsufficient ? (
                `Insufficient Balance (Need ₹${shortfall.toLocaleString()} More)`
              ) : (
                `Withdraw ₹${amount ? Number(amount).toLocaleString() : "0"} to Bank`
              )}
            </button>
          </div>
        </form>
      </div>

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={(pin) => executeWithdrawal(pin)}
        title="Enter Withdrawal PIN"
        description="Enter your 6-digit Transaction PIN to authorize this withdrawal."
      />
    </div>
  );
};
