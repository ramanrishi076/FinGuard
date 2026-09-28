import React from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownLeft, Shield } from "lucide-react";

export const TransactionDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const isDeposit = transaction.type === "DEPOSIT";
  const isTransfer = transaction.type === "TRANSFER";
  const isWithdrawal = transaction.type === "WITHDRAWAL";

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel-elevated bg-slate-900 border border-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={`p-3 rounded-2xl border ${
              isDeposit
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isWithdrawal
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            }`}
          >
            {isDeposit ? (
              <ArrowDownLeft className="w-6 h-6" />
            ) : isWithdrawal ? (
              <ArrowUpRight className="w-6 h-6" />
            ) : (
              <ArrowUpRight className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Transaction #{transaction.id}</h3>
              {getStatusBadge(transaction.status)}
            </div>
            <p className="text-xs text-slate-400">
              {new Date(transaction.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Amount</span>
            <span className="text-base font-bold text-white font-mono">
              ₹{Number(transaction.amount).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Type</span>
            <span className="font-semibold text-slate-200 uppercase">{transaction.type}</span>
          </div>

          {transaction.senderWalletId && (
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sender Wallet</span>
              <span className="font-mono text-slate-300">Wallet #{transaction.senderWalletId}</span>
            </div>
          )}

          {transaction.receiverWalletId && (
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Receiver Wallet</span>
              <span className="font-mono text-slate-300">Wallet #{transaction.receiverWalletId}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Description / Memo</span>
            <span className="text-slate-300 italic">
              {transaction.description || "No description provided"}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Fraud Engine Evaluation
            </span>
            <span
              className={`font-semibold ${
                transaction.status === "APPROVED"
                  ? "text-emerald-400"
                  : transaction.status === "BLOCKED"
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {transaction.status}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
