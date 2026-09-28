import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  AtSign,
  User,
} from "lucide-react";

export const TransactionsView = ({ transactions, onSelectTransaction, onRefresh, loading }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        String(t.id).includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.receiverName && t.receiverName.toLowerCase().includes(q)) ||
        (t.receiverUpiId && t.receiverUpiId.toLowerCase().includes(q)) ||
        (t.senderName && t.senderName.toLowerCase().includes(q)) ||
        (t.senderUpiId && t.senderUpiId.toLowerCase().includes(q)) ||
        String(t.amount).includes(q);

      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit-grade record of deposits, withdrawals, and peer-to-peer transfers with real-time fraud statuses.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, amount, description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-600 text-xs outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {["ALL", "DEPOSIT", "TRANSFER", "WITHDRAWAL"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === type
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto ml-auto overflow-x-auto">
          {["ALL", "APPROVED", "REVIEW", "FLAGGED", "BLOCKED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">ID & Date</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Recipient / Party & UPI ID</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Fraud Status</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncomingTransfer = user?.id && tx.receiverUserId === user.id && tx.type === "TRANSFER";
                  let partyRole = "Recipient";
                  let partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "—");
                  let partyUpi = tx.receiverUpiId;

                  if (tx.type === "DEPOSIT") {
                    partyRole = "Source";
                    partyName = "Direct Deposit";
                    partyUpi = "Bank / Card";
                  } else if (tx.type === "WITHDRAWAL") {
                    partyRole = "Payout";
                    partyName = "Direct Withdrawal";
                    partyUpi = "Linked Bank Account";
                  } else if (isIncomingTransfer) {
                    partyRole = "From";
                    partyName = tx.senderName || (tx.senderWalletId ? `Wallet #${tx.senderWalletId}` : "Peer User");
                    partyUpi = tx.senderUpiId;
                  } else {
                    partyRole = "To";
                    partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "Peer User");
                    partyUpi = tx.receiverUpiId;
                  }

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectTransaction(tx)}
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-white block">#{tx.id}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              tx.type === "DEPOSIT"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : tx.type === "WITHDRAWAL"
                                ? "bg-indigo-500/10 text-indigo-400"
                                : "bg-cyan-500/10 text-cyan-400"
                            }`}
                          >
                            {tx.type === "DEPOSIT" ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-200">{tx.type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              {partyRole}:
                            </span>
                            <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                              {partyName}
                            </span>
                          </div>
                          {partyUpi && (
                            <span className="text-[11px] font-mono text-cyan-400 truncate max-w-[160px] flex items-center gap-1 mt-0.5">
                              <AtSign className="w-3 h-3 text-cyan-500/70 shrink-0" />
                              {partyUpi}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-300 truncate max-w-xs">
                          {tx.description || (tx.type === "DEPOSIT" ? "Wallet Deposit" : tx.type === "WITHDRAWAL" ? "Wallet Withdrawal" : "Wallet Transfer")}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            tx.type === "DEPOSIT" || isIncomingTransfer ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {tx.type === "DEPOSIT" || isIncomingTransfer ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(tx);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View Transaction Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
