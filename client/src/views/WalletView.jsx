import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { walletService } from "../services/api";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Shield,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Landmark,
  QrCode,
  UserPlus,
} from "lucide-react";
import { TransactionPinModal } from "../components/modals/TransactionPinModal";
import { LinkedBankAccountsCard } from "../components/LinkedBankAccountsCard";

export const WalletView = ({
  wallet,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenAddRecipient,
  onOpenReceiveQr,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const balanceNum = Number(wallet?.balance || 0);
  const quickTransferNum = Number(amount || 0);
  const isQuickInsufficient = quickTransferNum > balanceNum;
  const quickShortfall = Math.max(0, quickTransferNum - balanceNum);

  const handleQuickTransfer = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const targetRecipient = recipient.trim();
    const transferNum = Number(amount);

    if (!targetRecipient) {
      setFeedback({ type: "error", message: "Please enter a valid recipient UPI ID, name, or User ID." });
      return;
    }

    if (targetRecipient === String(user?.id) || targetRecipient === user?.upiId) {
      setFeedback({ type: "error", message: "Self-transfer is not allowed." });
      return;
    }

    if (!transferNum || transferNum <= 0) {
      setFeedback({ type: "error", message: "Please enter an amount greater than 0." });
      return;
    }

    if (transferNum > balanceNum) {
      setFeedback({
        type: "error",
        message: `Insufficient balance in account: Available balance is ₹${balanceNum.toLocaleString()}, but requested transfer is ₹${transferNum.toLocaleString()} (shortfall: ₹${(transferNum - balanceNum).toLocaleString()}).`,
      });
      return;
    }

    setPendingPayload({ targetRecipient, transferNum, description });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin) => {
    if (!pendingPayload) return;
    const { targetRecipient, transferNum, description: txDesc } = pendingPayload;

    setLoading(true);
    try {
      const res = await walletService.transfer(targetRecipient, transferNum, txDesc, pin);
      setFeedback({
        type: "success",
        message: `Transfer of ₹${transferNum.toLocaleString()} to ${res.recipient?.name || targetRecipient} completed successfully (Risk Score: ${res.fraud?.riskScore}/100 - ${res.fraud?.decision}).`,
      });
      setRecipient("");
      setAmount("");
      setDescription("");
      setPendingPayload(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.fraud) {
        setFeedback({
          type: "blocked",
          message: `Transfer BLOCKED by FinGuard Protect (Risk: ${err.response.data.fraud.riskScore}/100). Reasons: ${err.response.data.fraud.reasons?.join(", ")}`,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          UPI Account & Wallet
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
          Manage your virtual UPI balances, perform instant peer-to-peer transfers, and inspect security telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Virtual Google Pay Card & Actions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Virtual GPay Style Card */}
          <div className="rounded-3xl p-7 bg-[var(--surface)] border border-[var(--border)] shadow-2xl relative overflow-hidden">
            {/* Google 4-color top strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1 bg-[#4285F4]" />
              <div className="flex-1 bg-[#EA4335]" />
              <div className="flex-1 bg-[#FBBC05]" />
              <div className="flex-1 bg-[#34A853]" />
            </div>

            <div className="flex justify-between items-center mb-6 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1b6ef3] flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] tracking-wide block">FinGuard Pay</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">UPI Digital Account</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--gpay-blue-light)] border border-[var(--border-strong)]">
                {user?.upiId || "user@finguard"}
              </span>
            </div>

            {/* Chip & UPI Contactless */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-6 rounded bg-[#fbbc04]/20 border border-[#fbbc04]/40 flex items-center justify-center">
                  <div className="w-7 h-4 border border-[#fbbc04]/60 rounded-xs" />
                </div>
                <Sparkles className="w-4 h-4 text-[var(--gpay-blue-light)]" />
              </div>
              <span className="text-xs font-mono text-[var(--text-tertiary)]">NPCI • UPI 2.0</span>
            </div>

            {/* Wallet Balance */}
            <div className="mb-6">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] block mb-0.5">
                Available UPI Balance
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[var(--text-tertiary)]">₹</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight">
                  {balanceNum.toLocaleString()}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] font-mono ml-2">INR</span>
              </div>
            </div>

            {/* Cardholder details & Account info */}
            <div className="flex justify-between items-end pt-4 border-t border-[var(--border)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">Primary Account Holder</span>
                <span className="text-sm font-bold text-[var(--text-secondary)] tracking-wide">
                  {user?.name || "FinGuard Member"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">Linked VPA</span>
                <span className="text-xs font-mono text-[var(--gpay-blue-light)] font-bold">
                  {user?.upiId || "active@finguard"}
                </span>
              </div>
            </div>
          </div>

          {/* Circular GPay Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={onOpenDeposit}
              className="py-4 px-3 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-11 h-11 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform shadow-md">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] block">Add Money</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Deposit funds</span>
            </button>

            <button
              onClick={() => (onOpenReceiveQr ? onOpenReceiveQr() : onOpenDeposit())}
              className="py-4 px-3 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#4285F4] text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform shadow-md">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] block">Receive QR</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">My UPI QR</span>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="py-4 px-3 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-11 h-11 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[var(--gpay-blue-light)] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform shadow-md">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] block">Withdraw</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">To bank account</span>
            </button>

            <button
              onClick={onOpenTransfer}
              className="py-4 px-3 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-md"
            >
              <div className="w-11 h-11 rounded-full bg-[#1b6ef3] text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform shadow-md">
                <Send className="w-5 h-5 ml-0.5" />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] block">Pay UPI</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Peer transfer</span>
            </button>
          </div>
        </div>

        {/* Right Column: Instant Fast Transfer Form */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-[var(--surface)] p-6 sm:p-7 border border-[var(--border)] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[var(--gpay-blue-light)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Instant UPI Transfer</h3>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#1b6ef3]/15 text-[var(--gpay-blue-light)] border border-[#1b6ef3]/30">
                AI PROTECTED
              </span>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mb-5">
              Instantly send money to any FinGuard UPI ID or name. Transactions are pre-screened in &lt;0.1ms by our trained fraud model.
            </p>

            {feedback && (
              <div
                className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  feedback.type === "success"
                    ? "bg-[#34a853]/15 border-[#34a853]/30 text-[#81c995]"
                    : feedback.type === "blocked"
                    ? "bg-[#ea4335]/15 border-[#ea4335]/30 text-[#f28b82]"
                    : "bg-[#ea4335]/15 border-[#ea4335]/30 text-[#f28b82]"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#81c995] shrink-0 mt-0.5" />
                ) : feedback.type === "blocked" ? (
                  <XCircle className="w-4 h-4 text-[#ea4335] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#ea4335] shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed flex-1">{feedback.message}</span>
                {feedback.type === "error" && feedback.message?.toLowerCase().includes("not found") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddRecipient) onOpenAddRecipient(recipient);
                      else onOpenTransfer(recipient);
                    }}
                    className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white flex items-center gap-1.5 w-fit cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Add "{recipient}" as Recipient
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleQuickTransfer} noValidate className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">
                    Recipient (UPI ID, Name, or User ID)
                  </label>
                  {onOpenAddRecipient && (
                    <button
                      type="button"
                      onClick={() => onOpenAddRecipient(recipient)}
                      className="text-[11px] text-[var(--gpay-blue-light)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <UserPlus className="w-3 h-3" />
                      + Add Recipient
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. alice@finguard or Alice or 5"
                  className="w-full px-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-sm outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">Amount (₹)</label>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Available: ₹{balanceNum.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${isQuickInsufficient ? "text-[#ea4335]" : "text-[var(--text-tertiary)]"}`}>₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (feedback) setFeedback(null);
                    }}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-full bg-[var(--input-bg)] border placeholder-[var(--text-placeholder)] text-sm outline-none transition-all ${
                      isQuickInsufficient
                        ? "border-[#ea4335] text-[#ea4335] focus:border-[#ea4335]"
                        : "border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)]"
                    }`}
                  />
                </div>
                {isQuickInsufficient && (
                  <p className="mt-2 text-xs text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ea4335] shrink-0" />
                    Insufficient balance: Available ₹{balanceNum.toLocaleString()} (Shortfall: ₹{quickShortfall.toLocaleString()})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] mb-1.5">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner, rent split, coffee"
                  className="w-full px-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-sm outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || balanceNum <= 0 || isQuickInsufficient}
                  className={`w-full py-3 rounded-full font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isQuickInsufficient
                      ? "bg-[#ea4335]/85 text-white hover:bg-[#ea4335] cursor-not-allowed opacity-90 shadow-rose-900/20"
                      : "bg-[#1b6ef3] hover:bg-[#1558c7] text-white disabled:opacity-50 shadow-[#1b6ef3]/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating & Sending...
                    </>
                  ) : isQuickInsufficient ? (
                    `Insufficient Balance (Need ₹${quickShortfall.toLocaleString()} More)`
                  ) : (
                    "Send Money with FinGuard"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Linked Multi-Bank Accounts & NPCI Section */}
      <LinkedBankAccountsCard />

      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingPayload(null);
        }}
        onSuccess={handlePinSuccess}
        title="Enter UPI PIN"
        description="Enter your 6-digit Transaction PIN to authorize this payment."
      />
    </div>
  );
};
