import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { walletService } from "../services/api";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Search,
  Plus,
  Landmark,
  History,
  Shield,
  Sparkles,
  UserPlus,
} from "lucide-react";

export const DashboardView = ({
  wallet,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenAddRecipient,
  onOpenRecipientProfile,
  onOpenReceiveQr,
  onSelectTransaction,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const { isConnected, alerts } = useSocket();
  const [dynamicContacts, setDynamicContacts] = useState([]);

  const balanceNum = Number(wallet?.balance || 0);

  // Fetch recipients dynamically from server
  useEffect(() => {
    let active = true;
    const loadRecipients = async () => {
      try {
        const list = await walletService.lookupRecipients("");
        if (active && list && list.length > 0) {
          const bgColors = [
            "bg-[#1e8e3e]",
            "bg-[#1b6ef3]",
            "bg-[#f29900]",
            "bg-[#a142f4]",
            "bg-[#e52592]",
            "bg-[#129eaf]",
          ];
          const mapped = list.map((item, idx) => {
            const parts = (item.name || "User").trim().split(" ");
            const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : item.name.slice(0, 2).toUpperCase();
            return {
              id: item.id,
              name: item.name,
              email: item.email,
              initials,
              upiId: item.upiId,
              bg: bgColors[idx % bgColors.length],
            };
          });
          setDynamicContacts(mapped);
        }
      } catch {
        // Fallback to static
      }
    };
    loadRecipients();
    return () => {
      active = false;
    };
  }, [transactions]);

  // Compute summary metrics
  const depositsTotal = transactions
    .filter((t) => t.type === "DEPOSIT" && t.status === "APPROVED")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const outflowsTotal = transactions
    .filter(
      (t) =>
        (t.type === "WITHDRAWAL" || t.type === "TRANSFER") &&
        (t.status === "APPROVED" || t.status === "REVIEW" || t.status === "FLAGGED")
    )
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const blockedCount = transactions.filter((t) => t.status === "BLOCKED").length;

  // Frequent contacts for Google Pay "People / Pay again" row
  const staticContacts = [
    { name: "Alice Sharma", initials: "AS", upiId: "alice@finguard", bg: "bg-[#1e8e3e]" },
    { name: "Rishi", initials: "R", upiId: "rishi@finguard", bg: "bg-[#1b6ef3]" },
    { name: "Demo User", initials: "DU", upiId: "demo@finguard", bg: "bg-[#f29900]" },
  ];

  const frequentContacts = dynamicContacts.length > 0 ? dynamicContacts : staticContacts;

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#ea4335]/20 text-[#f28b82] border border-[#ea4335]/40">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f9ab00]/20 text-[#fdd663] border border-[#f9ab00]/40">
            <AlertTriangle className="w-3 h-3" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fbbc04]/20 text-[#fde293] border border-[#fbbc04]/40">
            <AlertTriangle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#34a853]/20 text-[#81c995] border border-[#34a853]/40">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Google Pay Search & UPI Bar */}
      <div className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div
          onClick={() => onOpenTransfer()}
          className="flex items-center gap-3 text-[var(--text-tertiary)] cursor-pointer flex-1"
        >
          <Search className="w-4 h-4 text-[var(--gpay-blue-light)]" />
          <span className="text-xs sm:text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            Pay friends, phone number, or UPI ID...
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenReceiveQr && (
            <button
              onClick={() => onOpenReceiveQr()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--gpay-blue-light)] border border-[var(--border)] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Show My QR Code to Receive Money"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Receive QR</span>
            </button>
          )}
          <button
            onClick={() => onOpenTransfer()}
            className="p-1.5 rounded-full hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Scan QR / Enter UPI"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Pay "People / Pay Again" Section */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              People • Pay Again
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onOpenAddRecipient && (
              <button
                type="button"
                onClick={() => onOpenAddRecipient()}
                className="text-xs font-semibold text-[var(--gpay-blue-light)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Recipient
              </button>
            )}
            <span className="text-[11px] text-[var(--text-tertiary)]">1-Tap Transfer</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {/* Add New Recipient button */}
          {onOpenAddRecipient && (
            <button
              onClick={() => onOpenAddRecipient()}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-[#1b6ef3]/60 bg-[#1b6ef3]/5 flex items-center justify-center text-[var(--gpay-blue-light)] group-hover:border-[#1b6ef3] group-hover:bg-[#1b6ef3]/15 transition-all">
                <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
                + Recipient
              </span>
            </button>
          )}

          {/* Pay Any UPI button */}
          <button
            onClick={() => onOpenTransfer()}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-[var(--gpay-blue-light)]/50 flex items-center justify-center text-[var(--gpay-blue-light)] group-hover:border-[var(--gpay-blue-light)] group-hover:bg-[#1b6ef3]/10 transition-all">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
              Pay UPI ID
            </span>
          </button>

          {/* Contact bubbles */}
          {frequentContacts.map((contact, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onOpenRecipientProfile) {
                  onOpenRecipientProfile(contact);
                } else {
                  onOpenTransfer(contact.upiId);
                }
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
              title={`Click to view profile, pay, edit, or delete ${contact.name}`}
            >
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full ${contact.bg} text-white font-bold text-base flex items-center justify-center shadow-lg group-hover:ring-4 group-hover:ring-[#1b6ef3]/40 group-hover:scale-105 transition-all`}
              >
                {contact.initials}
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] max-w-[70px] truncate text-center transition-colors">
                {contact.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Google Pay 5 Circular Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={() => onOpenTransfer()}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-[#1b6ef3] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 ml-0.5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Pay Anyone</span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">UPI or Contact</span>
        </button>

        <button
          onClick={() => (onOpenReceiveQr ? onOpenReceiveQr() : onOpenDeposit())}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#4285F4] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Receive QR</span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">Scan to Receive</span>
        </button>

        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Add Money</span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">Bank to Wallet</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[var(--gpay-blue-light)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Self Transfer</span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">Withdraw to Bank</span>
        </button>

        <button
          onClick={() => setCurrentTab("transactions")}
          className="col-span-2 sm:col-span-1 flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-center transition-all group cursor-pointer shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[var(--text-tertiary)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">All History</span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">Transactions</span>
        </button>
      </div>

      {/* Hero Cards: Balance & Google Protect AI Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Google Pay Account & Wallet Balance Card */}
        <div className="lg:col-span-2 rounded-3xl bg-[var(--surface)] p-6 sm:p-7 border border-[var(--border)] shadow-xl relative overflow-hidden">
          {/* Subtle Google 4-color top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-[#4285F4]" />
            <div className="flex-1 bg-[#EA4335]" />
            <div className="flex-1 bg-[#FBBC05]" />
            <div className="flex-1 bg-[#34A853]" />
          </div>

          <div className="flex items-center justify-between mb-4 mt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                FinGuard UPI Wallet Balance
              </span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--gpay-blue-light)] border border-[var(--border-strong)]">
              {user?.upiId || `${user?.name?.toLowerCase().replace(/\s+/g, "") || "user"}@finguard`}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--text-tertiary)]">₹</span>
            <span className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight font-mono">
              {balanceNum.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-2 font-medium">INR • Virtual Reserves</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <button
              onClick={onOpenDeposit}
              className="px-4 py-2 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              + Add Money
            </button>
            {onOpenReceiveQr && (
              <button
                onClick={onOpenReceiveQr}
                className="px-4 py-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--gpay-blue-light)] border border-[var(--border-strong)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                Receive QR
              </button>
            )}
            <button
              onClick={onOpenWithdraw}
              className="px-4 py-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-strong)] text-xs font-semibold transition-all cursor-pointer"
            >
              Transfer to Bank
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
            <div>
              <span className="text-[11px] text-[var(--text-tertiary)] block mb-0.5">Total Deposits</span>
              <span className="text-xs sm:text-sm font-bold text-[#81c995] font-mono">
                +₹{depositsTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-tertiary)] block mb-0.5">Total Outflows</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-tertiary)] font-mono">
                -₹{outflowsTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-tertiary)] block mb-0.5">Protected Attacks</span>
              <span className="text-xs sm:text-sm font-bold text-[#f28b82] font-mono">
                {blockedCount} prevented
              </span>
            </div>
          </div>
        </div>

        {/* Google Protect AI Shield Card */}
        <div className="rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#81c995]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">FinGuard Protect</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#34a853]/20 text-[#81c995] border border-[#34a853]/40">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4">
              Real-time Google Pay-grade fraud shield combining behavioral heuristics with native ML inference.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-tertiary)]">ML Training Corpus:</span>
                <span className="font-semibold text-[var(--text-secondary)]">100k Transactions</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-tertiary)]">Model Accuracy:</span>
                <span className="font-semibold text-[#81c995]">99.98%</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-tertiary)]">Fraud Recall:</span>
                <span className="font-semibold text-[var(--gpay-blue-light)]">100% (0 False Negatives)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[var(--text-tertiary)]">Engine Telemetry:</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  {isConnected ? "Live Socket Sync" : "Reconnecting..."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setCurrentTab("analytics")}
              className="w-full flex items-center justify-between text-xs text-[var(--gpay-blue-light)] hover:text-[#aecbfa] font-semibold transition-colors cursor-pointer"
            >
              <span>Inspect ML Weights & Metrics</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Real-time Transaction Feed & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--gpay-blue-light)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Recent Transactions</h3>
            </div>
            <button
              onClick={() => setCurrentTab("transactions")}
              className="text-xs text-[var(--gpay-blue-light)] hover:text-[#aecbfa] font-semibold cursor-pointer"
            >
              View All ({transactions.length})
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-xs">
              No transactions recorded yet. Make a deposit or transfer to get started.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {transactions.slice(0, 6).map((tx) => {
                const isDeposit = tx.type === "DEPOSIT";
                const isIncoming = user?.id && tx.receiverUserId === user.id && tx.type === "TRANSFER";
                const displayName = tx.type === "TRANSFER"
                  ? (isIncoming ? `From ${tx.senderName || "Contact"}` : `To ${tx.receiverName || "Contact"}`)
                  : isDeposit
                  ? "Added to Wallet"
                  : "Transferred to Bank";
                const initials = (tx.receiverName || tx.senderName || "G").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-[var(--surface-elevated)] rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Circular Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                          isDeposit
                            ? "bg-[#1e8e3e] text-white"
                            : tx.status === "BLOCKED"
                            ? "bg-[#ea4335] text-white"
                            : "bg-[#1b6ef3] text-white"
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          initials
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {displayName}
                          </span>
                          {getStatusBadge(tx.status)}
                        </div>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {tx.receiverUpiId && <span className="font-mono text-[var(--gpay-blue-light)] mr-1.5">{tx.receiverUpiId} •</span>}
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • Ref #{tx.id}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono ${
                          isDeposit || isIncoming ? "text-[#81c995]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {isDeposit || isIncoming ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Security & Fraud Alerts Panel */}
        <div className="rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#f28b82]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Security Alerts</h3>
              </div>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                {alerts.length} event{alerts.length === 1 ? "" : "s"}
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                <ShieldCheck className="w-8 h-8 text-[#81c995]/40 mx-auto mb-2" />
                All payments safe. Protected by ML fraud prevention.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-2xl border text-xs ${
                      alert.decision === "BLOCKED"
                        ? "bg-[#ea4335]/15 border-[#ea4335]/30 text-[#f28b82]"
                        : "bg-[#f9ab00]/15 border-[#f9ab00]/30 text-[#fdd663]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">₹{Number(alert.amount).toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg)]">
                        {alert.decision}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 mb-1">
                      Risk Score: <strong>{alert.riskScore}/100</strong>
                    </p>
                    {alert.reasons?.length > 0 && (
                      <p className="text-[10px] opacity-80 truncate">{alert.reasons[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-center">
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Live updates enabled via Redis & Socket.IO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
