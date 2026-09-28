import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  ShieldCheck,
  ShieldAlert,
  Activity,
  TrendingUp,
  Cpu,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const DashboardView = ({
  wallet,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onSelectTransaction,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const { isConnected, alerts } = useSocket();

  const balanceNum = Number(wallet?.balance || 0);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name || "User"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            FinGuard Digital Wallet • Protected by Real-Time Heuristics & Machine Learning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={onOpenWithdraw}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send Money
          </button>
        </div>
      </div>

      {/* Hero Cards: Balance & AI Shield Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-2 rounded-3xl glass-panel-elevated bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Wallet Balance
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800/80 text-cyan-400 border border-slate-700/60">
              Wallet #{wallet?.id || "—"}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-slate-400">₹</span>
            <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
              {balanceNum.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 ml-2">INR</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Total Deposits</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                +₹{depositsTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Outflows</span>
              <span className="text-xs sm:text-sm font-bold text-slate-300 font-mono">
                -₹{outflowsTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Blocked Attacks</span>
              <span className="text-xs sm:text-sm font-bold text-rose-400 font-mono">
                {blockedCount} prevented
              </span>
            </div>
          </div>
        </div>

        {/* AI Fraud Shield Radar Status Card */}
        <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">AI Fraud Shield</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real-time hybrid risk evaluator blending deterministic rules with standardized ML weights.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Trained Dataset:</span>
                <span className="font-semibold text-slate-300">100,000 Transactions</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500">ML Model Accuracy:</span>
                <span className="font-semibold text-emerald-400">99.98%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Fraud Recall:</span>
                <span className="font-semibold text-cyan-400">100% (0 False Negatives)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Real-Time Engine:</span>
                <span className="font-semibold text-slate-300">
                  {isConnected ? "Socket.IO Live" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentTab("analytics")}
              className="w-full flex items-center justify-between text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
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
        <div className="lg:col-span-2 rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Live Transaction Activity</h3>
            </div>
            <button
              onClick={() => setCurrentTab("transactions")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View All ({transactions.length})
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No transactions recorded yet. Make a deposit or transfer to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        tx.type === "DEPOSIT"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tx.type === "WITHDRAWAL"
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "bg-cyan-500/10 text-cyan-400"
                      }`}
                    >
                      {tx.type === "DEPOSIT" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {tx.type === "TRANSFER"
                            ? (tx.receiverName ? `To: ${tx.receiverName}` : (tx.description || "Wallet Transfer"))
                            : tx.type === "DEPOSIT"
                            ? "Deposit"
                            : "Withdrawal"}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {tx.receiverUpiId && <span className="font-mono text-cyan-400 mr-1.5">{tx.receiverUpiId} •</span>}
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • ID #{tx.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        tx.type === "DEPOSIT" ? "text-emerald-400" : "text-slate-200"
                      }`}
                    >
                      {tx.type === "DEPOSIT" ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Security & Fraud Alerts Panel */}
        <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Security Alerts</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {alerts.length} event{alerts.length === 1 ? "" : "s"}
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                No security alerts detected. All transactions cleared.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-2xl border text-xs ${
                      alert.decision === "BLOCKED"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">₹{Number(alert.amount).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/40">
                        {alert.decision}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mb-1">
                      Score: <strong>{alert.riskScore}/100</strong>
                    </p>
                    {alert.reasons?.length > 0 && (
                      <p className="text-[10px] opacity-75 truncate">{alert.reasons[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500">
              Live updates enabled via Redis Pub/Sub & WebSockets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
