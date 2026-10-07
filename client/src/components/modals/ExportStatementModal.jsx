import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  Download,
} from "lucide-react";
import {
  filterTransactionsForExport,
  exportTransactionsToPDF,
  exportTransactionsToExcel,
} from "../../utils/exportUtils";

const PRESETS = [
  { id: "7d", label: "Last 7 Days" },
  { id: "10d", label: "Last 10 Days" },
  { id: "1m", label: "Last 1 Month" },
  { id: "3m", label: "Last 3 Months" },
  { id: "custom", label: "Custom Range" },
  { id: "all", label: "All Time" },
];

export const ExportStatementModal = ({
  isOpen,
  onClose,
  transactions = [],
  currentUser,
}) => {
  const [preset, setPreset] = useState("7d");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [flowType, setFlowType] = useState("all"); // "all" | "debit" | "credit"
  const [exporting, setExporting] = useState(null); // "pdf" | "excel" | null
  const [successMessage, setSuccessMessage] = useState(null);

  // When a preset is clicked, calculate date range
  const handleSelectPreset = (presetId) => {
    setPreset(presetId);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    setToDate(todayStr);

    if (presetId === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split("T")[0]);
    } else if (presetId === "10d") {
      const d = new Date();
      d.setDate(d.getDate() - 10);
      setFromDate(d.toISOString().split("T")[0]);
    } else if (presetId === "1m") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split("T")[0]);
    } else if (presetId === "3m") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setFromDate(d.toISOString().split("T")[0]);
    }
  };

  // Filtered transactions for the current selection
  const matchingTransactions = useMemo(() => {
    return filterTransactionsForExport(transactions, currentUser, {
      preset,
      fromDate,
      toDate,
      flowType,
    });
  }, [transactions, currentUser, preset, fromDate, toDate, flowType]);

  // Statistics for preview
  const stats = useMemo(() => {
    let credits = 0;
    let debits = 0;
    let blocked = 0;

    matchingTransactions.forEach((tx) => {
      const isIncoming = currentUser?.id && tx.receiverUserId === currentUser.id && tx.type === "TRANSFER";
      const isCredit = tx.type === "DEPOSIT" || isIncoming;
      const amt = Number(tx.amount || 0);

      if (tx.status === "BLOCKED") {
        blocked += 1;
      } else if (isCredit) {
        credits += amt;
      } else {
        debits += amt;
      }
    });

    return { credits, debits, blocked };
  }, [matchingTransactions, currentUser]);

  if (!isOpen) return null;

  // Format description of selected period
  const getPeriodLabel = () => {
    if (preset === "7d") return "Last 7 Days";
    if (preset === "10d") return "Last 10 Days";
    if (preset === "1m") return "Last 1 Month (30 Days)";
    if (preset === "3m") return "Last 3 Months (90 Days)";
    if (preset === "all") return "All Time";
    return `${fromDate || "Start"} to ${toDate || "Present"}`;
  };

  const getFlowLabel = () => {
    if (flowType === "debit") return "Debits Only";
    if (flowType === "credit") return "Credits Only";
    return "All Transactions (Credits & Debits)";
  };

  const handleExport = (format) => {
    try {
      setExporting(format);
      const periodLabel = getPeriodLabel();
      const flowLabel = getFlowLabel();
      const suffix = `${preset}_${flowType}`;

      if (format === "pdf") {
        exportTransactionsToPDF(matchingTransactions, currentUser, {
          periodLabel,
          flowLabel,
          titleSuffix: suffix,
        });
        setSuccessMessage(`Downloaded PDF Statement (${matchingTransactions.length} records)`);
      } else {
        exportTransactionsToExcel(matchingTransactions, currentUser, {
          periodLabel,
          flowLabel,
          titleSuffix: suffix,
        });
        setSuccessMessage(`Downloaded Excel Spreadsheet (${matchingTransactions.length} records)`);
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gpay-blue-muted)]">
            Account Statement Export
          </span>
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#1b6ef3]" />
          Export Statement
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Select timeframe, filter transaction flow, and generate PDF or Excel reports.
        </p>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-[#34A853]/15 border border-[#34A853]/30 text-[#81c995] text-xs flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Section 1: Date Range Presets */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-2">
              <Calendar className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" />
              Statement Timeframe
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    preset === p.id
                      ? "bg-[#1b6ef3] text-white border-[#1b6ef3] shadow-md shadow-blue-500/20"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="mt-3 grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)]">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-1">
                  From Date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#1b6ef3]"
                />
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-1">
                  To Date
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#1b6ef3]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Flow Filter (All vs Debit vs Credit) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-2">
              <Filter className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" />
              Transaction Flow Filter
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* All */}
              <button
                type="button"
                onClick={() => setFlowType("all")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  flowType === "all"
                    ? "bg-[#1b6ef3]/15 border-[#1b6ef3] text-[var(--text-primary)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" />
                  <span className="text-xs font-bold">All</span>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">Credits & Debits</p>
              </button>

              {/* Debit Only */}
              <button
                type="button"
                onClick={() => setFlowType("debit")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  flowType === "debit"
                    ? "bg-[#ea4335]/15 border-[#ea4335]/50 text-[var(--text-primary)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#f28b82]" />
                  <span className="text-xs font-bold text-[#f28b82]">Debit Only</span>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">Sent & Withdrawn</p>
              </button>

              {/* Credit Only */}
              <button
                type="button"
                onClick={() => setFlowType("credit")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  flowType === "credit"
                    ? "bg-[#34a853]/15 border-[#34a853]/50 text-[var(--text-primary)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#81c995]" />
                  <span className="text-xs font-bold text-[#81c995]">Credit Only</span>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">Received & Deposited</p>
              </button>
            </div>
          </div>

          {/* Section 3: Live Preview & Counter */}
          <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Statement Preview:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1b6ef3]/20 text-[var(--gpay-blue-light)] font-bold text-xs">
                {matchingTransactions.length} {matchingTransactions.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border)]">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block">Total Credits:</span>
                <span className="font-bold text-[#81c995] text-sm">
                  + ₹{stats.credits.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] block">Total Debits:</span>
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  - ₹{stats.debits.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {stats.blocked > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#f28b82] pt-1">
                <Shield className="w-3 h-3" />
                <span>Includes {stats.blocked} high-risk intercepted transaction(s)</span>
              </div>
            )}
          </div>

          {/* Section 4: Export Buttons */}
          <div className="pt-1 flex flex-col sm:flex-row gap-3">
            {/* Download PDF Button */}
            <button
              type="button"
              disabled={exporting !== null || matchingTransactions.length === 0}
              onClick={() => handleExport("pdf")}
              className="flex-1 py-3 px-4 rounded-full bg-[#ea4335] hover:bg-[#d93025] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/20"
            >
              {exporting === "pdf" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Download PDF Statement
            </button>

            {/* Download Excel Button */}
            <button
              type="button"
              disabled={exporting !== null || matchingTransactions.length === 0}
              onClick={() => handleExport("excel")}
              className="flex-1 py-3 px-4 rounded-full bg-[#1e8e3e] hover:bg-[#188038] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {exporting === "excel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Download Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
