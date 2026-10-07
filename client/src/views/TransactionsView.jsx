import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  AtSign,
  Send,
  FileText,
  FileSpreadsheet,
  Download,
  Cpu,
} from "lucide-react";
import {
  exportTransactionsToPDF,
  exportTransactionsToExcel,
} from "../utils/exportUtils";
import { ExportStatementModal } from "../components/modals/ExportStatementModal";

export const TransactionsView = ({
  transactions,
  onSelectTransaction,
  onOpenRecipientProfile,
  onRefresh,
  loading,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exporting, setExporting] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const isFiltered = search !== "" || typeFilter !== "ALL" || statusFilter !== "ALL";

  const handleExportPDF = (useFiltered = true) => {
    try {
      setExporting("pdf");
      const listToExport = useFiltered ? filteredTransactions : transactions;
      const suffix = isFiltered && useFiltered ? "Filtered" : "Statement";
      exportTransactionsToPDF(listToExport, user, suffix);
      setExportSuccess(`Exported ${listToExport.length} transactions to PDF Statement`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = (useFiltered = true) => {
    try {
      setExporting("excel");
      const listToExport = useFiltered ? filteredTransactions : transactions;
      const suffix = isFiltered && useFiltered ? "Filtered" : "Statement";
      exportTransactionsToExcel(listToExport, user, suffix);
      setExportSuccess(`Exported ${listToExport.length} transactions to Excel (.xlsx)`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Real-time audit record of payments, UPI transfers, deposits, and ML fraud decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Statement Dialog Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-blue-500/20"
            title="Custom Date Range, Debit/Credit Filters & Formats"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>

          {/* Quick PDF Button */}
          <button
            onClick={() => handleExportPDF(true)}
            disabled={exporting || filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--surface)] hover:bg-[#ea4335]/15 text-[var(--text-secondary)] hover:text-[#f28b82] border border-[var(--border)] hover:border-[#ea4335]/40 text-xs font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
            title={`Quick export ${filteredTransactions.length} transactions as PDF`}
          >
            <FileText className="w-3.5 h-3.5 text-[#ea4335]" />
            <span>{exporting === "pdf" ? "Exporting..." : "Quick PDF"}</span>
          </button>

          {/* Quick Excel Button */}
          <button
            onClick={() => handleExportExcel(true)}
            disabled={exporting || filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--surface)] hover:bg-[#34a853]/15 text-[var(--text-secondary)] hover:text-[#81c995] border border-[var(--border)] hover:border-[#34a853]/40 text-xs font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
            title={`Quick export ${filteredTransactions.length} transactions as Excel`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34a853]" />
            <span>{exporting === "excel" ? "Exporting..." : "Quick Excel"}</span>
          </button>

          {/* Refresh Feed */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] text-xs font-semibold transition-colors cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--gpay-blue-light)]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Export Success Notification */}
      {exportSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#34A853]/15 border border-[#34A853]/30 text-[#81c995] text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34A853]" />
            <span className="font-semibold">{exportSuccess}</span>
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)]">Downloaded to your device</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-[var(--surface)] p-4 border border-[var(--border)] flex flex-col md:flex-row items-center gap-3 shadow-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, UPI ID, or amount..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[#1b6ef3] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] text-xs outline-none"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["ALL", "DEPOSIT", "TRANSFER", "WITHDRAWAL"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === type
                  ? "bg-[#1b6ef3] text-white shadow-sm"
                  : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto ml-auto overflow-x-auto no-scrollbar">
          {["ALL", "APPROVED", "REVIEW", "FLAGGED", "BLOCKED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--gpay-blue-light)]"
                  : "bg-[var(--input-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border)]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-dim)] border-b border-[var(--border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-[var(--border)]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncomingTransfer = user?.id && tx.receiverUserId === user.id && tx.type === "TRANSFER";
                  let partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "—");
                  let partyUpi = tx.receiverUpiId;

                  if (tx.type === "DEPOSIT") {
                    partyName = "Direct Deposit";
                    partyUpi = "Bank Account";
                  } else if (tx.type === "WITHDRAWAL") {
                    partyName = "Direct Withdrawal";
                    partyUpi = "Linked Bank Account";
                  } else if (isIncomingTransfer) {
                    partyName = tx.senderName || (tx.senderWalletId ? `Wallet #${tx.senderWalletId}` : "Contact");
                    partyUpi = tx.senderUpiId;
                  } else {
                    partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "Contact");
                    partyUpi = tx.receiverUpiId;
                  }

                  const initials = partyName.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--surface-elevated)] transition-colors group cursor-pointer"
                      onClick={() => onSelectTransaction(tx)}
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-[var(--text-primary)] block">#{tx.id}</span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
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
                            className={`p-1.5 rounded-full ${
                              tx.type === "DEPOSIT"
                                ? "bg-[#34a853]/20 text-[#81c995]"
                                : tx.type === "WITHDRAWAL"
                                ? "bg-[var(--gpay-blue-light)]/20 text-[var(--gpay-blue-light)]"
                                : "bg-[#1b6ef3]/20 text-[var(--gpay-blue-light)]"
                            }`}
                          >
                            {tx.type === "DEPOSIT" ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : tx.type === "WITHDRAWAL" ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-semibold text-[var(--text-secondary)]">{tx.type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`flex items-center gap-2.5 ${
                            tx.type === "TRANSFER" ? "cursor-pointer group/rec hover:opacity-90" : ""
                          }`}
                          onClick={(e) => {
                            if (tx.type === "TRANSFER" && onOpenRecipientProfile) {
                              e.stopPropagation();
                              onOpenRecipientProfile({
                                id: tx.receiverUserId || tx.senderUserId,
                                name: partyName,
                                upiId: partyUpi,
                              });
                            }
                          }}
                          title={tx.type === "TRANSFER" ? "Click to view, edit, or delete recipient" : undefined}
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[var(--gpay-blue-light)] font-bold text-xs flex items-center justify-center shrink-0 group-hover/rec:ring-2 group-hover/rec:ring-[#1b6ef3]/40 transition-all">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">
                                {partyRole}:
                              </span>
                              <span className="font-semibold text-[var(--text-secondary)] group-hover/rec:text-[var(--text-primary)] truncate max-w-[140px]">
                                {partyName}
                              </span>
                            </div>
                            {partyUpi && (
                              <span className="text-[11px] font-mono text-[var(--gpay-blue-light)] truncate max-w-[160px] flex items-center gap-1 mt-0.5">
                                <AtSign className="w-3 h-3 text-[var(--gpay-blue-light)]/70 shrink-0" />
                                {partyUpi}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[var(--text-tertiary)] truncate max-w-xs">
                          {tx.description || (tx.type === "DEPOSIT" ? "Wallet Deposit" : tx.type === "WITHDRAWAL" ? "Wallet Withdrawal" : "UPI Transfer")}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(tx.status)}
                          {tx.riskScore != null && (
                            <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 font-mono">
                              <Cpu className="w-2.5 h-2.5 text-[#4285F4]" />
                              Score: {tx.riskScore}/100
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            tx.type === "DEPOSIT" || isIncomingTransfer ? "text-[#81c995]" : "text-[var(--text-primary)]"
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
                          className="p-1.5 rounded-full hover:bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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

      {/* Export Statement Configurator Modal */}
      <ExportStatementModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        currentUser={user}
      />
    </div>
  );
};
