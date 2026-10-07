import React, { useState, useEffect, useCallback } from "react";
import { complianceService } from "../services/api";
import { useSocket } from "../context/SocketContext";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Check,
  Ban,
  Loader2,
  Clock,
  ArrowUpRight,
  User,
  Info,
} from "lucide-react";
import { FraudExplanationModal } from "../components/modals/FraudExplanationModal";

export const ComplianceView = () => {
  const { socket } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    flagged: 0,
    review: 0,
    blocked: 0,
    approved: 0,
    resolved: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTxForExpl, setSelectedTxForExpl] = useState(null);

  // Action modal state
  const [actionTx, setActionTx] = useState(null);
  const [actionType, setActionType] = useState(null); // "APPROVE" | "REJECT"
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchComplianceData = useCallback(async () => {
    setLoading(true);
    try {
      const [txList, statsData] = await Promise.all([
        complianceService.getFlaggedTransactions(selectedStatus),
        complianceService.getComplianceStats(),
      ]);
      setTransactions(txList);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  // Listen for real-time resolution and alert events
  useEffect(() => {
    if (!socket) return;

    const handleResolved = () => {
      fetchComplianceData();
    };

    const handleFraudAlert = () => {
      fetchComplianceData();
    };

    socket.on("transaction:resolved", handleResolved);
    socket.on("fraud:alert", handleFraudAlert);

    return () => {
      socket.off("transaction:resolved", handleResolved);
      socket.off("fraud:alert", handleFraudAlert);
    };
  }, [socket, fetchComplianceData]);

  const handleOpenAction = (tx, type) => {
    setActionTx(tx);
    setActionType(type);
    setActionNotes(
      type === "APPROVE"
        ? "Verified genuine counterparty after user contact verification."
        : "Confirmed suspicious drain pattern. Suspended and rolled back."
    );
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!actionTx || !actionType) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await complianceService.resolveTransaction(actionTx.id, actionType, actionNotes);
      setActionTx(null);
      setActionType(null);
      fetchComplianceData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to resolve transaction");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(tx.id).includes(q) ||
      tx.sender?.name?.toLowerCase().includes(q) ||
      tx.sender?.upiId?.toLowerCase().includes(q) ||
      tx.receiver?.name?.toLowerCase().includes(q) ||
      tx.receiver?.upiId?.toLowerCase().includes(q) ||
      tx.description?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EA4335]/20 text-[#EA4335] border border-[#EA4335]/30">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <Clock className="w-3 h-3" /> IN REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EA4335]/15 border border-[#EA4335]/30 flex items-center justify-center text-[#EA4335] shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Compliance & Fraud Operations Hub
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              Real-time monitoring, machine learning investigation, and fund release controls
            </p>
          </div>
        </div>

        <button
          onClick={fetchComplianceData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {stats.review ?? 0}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Requires human review</p>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
            <span>Flagged Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {stats.flagged ?? 0}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Elevated risk score (60-79)</p>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
            <span>Auto-Blocked</span>
            <Ban className="w-4 h-4 text-[#EA4335]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {stats.blocked ?? 0}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Critical threshold (80+)</p>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
            <span>Resolved Cases</span>
            <ShieldCheck className="w-4 h-4 text-[#34A853]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {stats.resolved ?? 0}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Officer investigated & cleared</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "REVIEW", "FLAGGED", "BLOCKED", "APPROVED"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === status
                  ? "bg-[#1b6ef3] text-white shadow-sm"
                  : "bg-[var(--surface-dim)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-nav)]"
              }`}
            >
              {status === "ALL" ? "All Queue" : status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by ID, sender, recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#4285F4]"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-dim)] text-[var(--text-tertiary)] font-bold">
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">Sender / Recipient</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">AI Trigger Factors</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-tertiary)]">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
                        <span>Loading queue...</span>
                      </div>
                    ) : (
                      "No transactions match the selected filter."
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[var(--surface-dim)]/50 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">
                      #{tx.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {tx.sender?.name || "Deposit"} ➔ {tx.receiver?.name || "Payout"}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          {tx.sender?.upiId || "system"} • {new Date(tx.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                      ₹{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedTxForExpl(tx)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-[var(--surface-dim)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer"
                        title="Click to view full ML Explainability breakdown"
                      >
                        <Cpu className="w-3 h-3 text-[#4285F4]" />
                        <span
                          className={
                            tx.riskScore >= 80
                              ? "text-[#EA4335]"
                              : tx.riskScore >= 60
                              ? "text-amber-400"
                              : tx.riskScore >= 30
                              ? "text-yellow-400"
                              : "text-emerald-400"
                          }
                        >
                          {tx.riskScore}/100
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {tx.riskFactors?.length > 0 ? (
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {tx.riskFactors.slice(0, 2).join(", ")}
                          {tx.riskFactors.length > 2 && ` (+${tx.riskFactors.length - 2} more)`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">No anomalies</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTxForExpl(tx)}
                          className="p-1.5 rounded-full hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[#4285F4] transition-colors cursor-pointer"
                          title="Inspect ML & Heuristic Factors"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {(tx.status === "FLAGGED" || tx.status === "REVIEW") && (
                          <>
                            <button
                              onClick={() => handleOpenAction(tx, "APPROVE")}
                              className="px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                              title="Clear & Release Funds"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(tx, "REJECT")}
                              className="px-2.5 py-1 rounded-full bg-[#EA4335]/15 hover:bg-[#EA4335]/25 text-[#EA4335] font-semibold text-[11px] border border-[#EA4335]/30 transition-colors cursor-pointer flex items-center gap-1"
                              title="Reject & Rollback Funds"
                            >
                              <Ban className="w-3 h-3" /> Block
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Action Modal */}
      {actionTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              {actionType === "APPROVE" ? "Approve & Clear Transaction" : "Confirm Fraud & Block Transaction"}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Tx #{actionTx.id} • ₹{Number(actionTx.amount).toLocaleString()} from {actionTx.sender?.name}
            </p>

            {actionError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Compliance Officer Investigation Notes:
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter audit trail rationale..."
                className="w-full p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#4285F4]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionTx(null)}
                className="flex-1 py-2.5 rounded-full bg-[var(--surface-dim)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--text-tertiary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading || !actionNotes.trim()}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  actionType === "APPROVE"
                    ? "bg-[#34A853] hover:bg-[#2d9249]"
                    : "bg-[#EA4335] hover:bg-[#d93025]"
                }`}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {actionType === "APPROVE" ? "Confirm Clearance" : "Confirm Block & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explainable AI Modal */}
      <FraudExplanationModal
        isOpen={Boolean(selectedTxForExpl)}
        onClose={() => setSelectedTxForExpl(null)}
        transaction={selectedTxForExpl}
      />
    </div>
  );
};
