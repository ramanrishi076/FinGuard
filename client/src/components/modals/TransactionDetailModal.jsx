import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownLeft, Shield, Send, FileText, Cpu } from "lucide-react";
import { exportTransactionsToPDF } from "../../utils/exportUtils";
import { FraudExplanationModal } from "./FraudExplanationModal";

export const TransactionDetailModal = ({ transaction, onClose, user, onOpenRecipientProfile }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  if (!transaction) return null;

  const isDeposit = transaction.type === "DEPOSIT";
  const isTransfer = transaction.type === "TRANSFER";
  const isWithdrawal = transaction.type === "WITHDRAWAL";

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#ea4335]/20 text-[#f28b82] border border-[#ea4335]/40">
            <XCircle className="w-3.5 h-3.5" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#f9ab00]/20 text-[#fdd663] border border-[#f9ab00]/40">
            <AlertTriangle className="w-3.5 h-3.5" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#fbbc04]/20 text-[#fde293] border border-[#fbbc04]/40">
            <AlertTriangle className="w-3.5 h-3.5" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#34a853]/20 text-[#81c995] border border-[#34a853]/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
    }
  };

  const recipientName = transaction.receiverName || (transaction.receiverWalletId ? `Wallet #${transaction.receiverWalletId}` : "Account");
  const senderName = transaction.senderName || (transaction.senderWalletId ? `Wallet #${transaction.senderWalletId}` : "Account");
  const primaryParty = isDeposit ? "Self Deposit" : isWithdrawal ? "Bank Account" : recipientName;
  const initials = primaryParty.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] animate-in fade-in duration-150">
        <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Google Pay Receipt Top: Avatar + Amount */}
          <div className="text-center pt-2 pb-5">
            <div
              className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg text-white shadow-lg ${
                isDeposit
                  ? "bg-[#1e8e3e]"
                  : transaction.status === "BLOCKED"
                  ? "bg-[#ea4335]"
                  : "bg-[#1b6ef3]"
              }`}
            >
              {isDeposit ? <ArrowDownLeft className="w-7 h-7" /> : initials}
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)] mb-0.5">{primaryParty}</h3>
            {transaction.receiverUpiId && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xs font-mono text-[var(--gpay-blue-light)]">{transaction.receiverUpiId}</span>
                {onOpenRecipientProfile && isTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecipientProfile({
                        id: transaction.receiverUserId,
                        name: recipientName,
                        upiId: transaction.receiverUpiId,
                      });
                    }}
                    className="text-[10px] text-[var(--gpay-blue-light)] hover:underline font-semibold cursor-pointer"
                  >
                    Manage Profile
                  </button>
                )}
              </div>
            )}

            <div className="flex items-baseline justify-center gap-1 my-3">
              <span className="text-2xl font-bold text-[var(--text-tertiary)]">₹</span>
              <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight">
                {Number(transaction.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-center mt-2">
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          {/* Transaction Meta Details */}
          <div className="space-y-3 bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">UPI Transaction ID</span>
              <span className="font-mono font-semibold text-[var(--text-secondary)]">
                UPI-FG-{String(transaction.id).padStart(8, "0")}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">Date & Time</span>
              <span className="text-[var(--text-secondary)] font-medium">
                {new Date(transaction.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">Payment Type</span>
              <span className="font-semibold text-[var(--text-secondary)] uppercase">{transaction.type}</span>
            </div>

            {isTransfer && (
              <div className="flex justify-between items-start py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-tertiary)]">From / To</span>
                <div className="text-right">
                  <span className="text-[var(--text-tertiary)] block">{senderName} → {recipientName}</span>
                  {transaction.senderUpiId && (
                    <span className="text-[11px] font-mono text-[var(--gpay-blue-light)] block">{transaction.senderUpiId}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">Payment Note</span>
              <span className="text-[var(--text-tertiary)] italic">
                {transaction.description || "FinGuard Transfer"}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-[var(--text-tertiary)] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" /> FinGuard AI Shield
              </span>
              <span
                className={`font-semibold ${
                  transaction.status === "APPROVED"
                    ? "text-[#81c995]"
                    : transaction.status === "BLOCKED"
                    ? "text-[#f28b82]"
                    : "text-[#fdd663]"
                }`}
              >
                {transaction.riskScore != null ? `Risk Score: ${transaction.riskScore}/100` : "Evaluated & Logged"}
              </span>
            </div>
          </div>

          {/* AI Explainability Button */}
          {transaction.riskScore != null && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="w-full py-2.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--gpay-blue-muted)] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-[#4285F4]" />
                Inspect AI Risk Attribution
              </button>
            </div>
          )}

          <div className="mt-4 flex gap-2.5">
            <button
              onClick={() => exportTransactionsToPDF([transaction], user, `Receipt_TX${transaction.id}`)}
              className="flex-1 py-3 rounded-full bg-[var(--surface-elevated)] hover:bg-[#ea4335]/15 border border-[var(--border-strong)] hover:border-[#ea4335]/40 text-[var(--text-primary)] hover:text-[#f28b82] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#ea4335]" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <FraudExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        transaction={transaction}
      />
    </>
  );
};
