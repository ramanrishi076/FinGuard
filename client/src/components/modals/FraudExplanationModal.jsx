import React from "react";
import {
  ShieldAlert,
  X,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  UserCheck,
  TrendingUp,
} from "lucide-react";

export const FraudExplanationModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const riskScore = Number(transaction.riskScore ?? 0);
  const ruleScore = Number(transaction.ruleScore ?? 0);
  const mlProb = Number(transaction.mlProbability ?? (riskScore / 100));
  const status = transaction.status || "APPROVED";
  const factors = Array.isArray(transaction.riskFactors)
    ? transaction.riskFactors
    : transaction.riskFactors
    ? [transaction.riskFactors]
    : [];

  const getScoreColor = (score) => {
    if (score >= 80) return "#EA4335";
    if (score >= 60) return "#FBBC04";
    if (score >= 30) return "#fbc02d";
    return "#34A853";
  };

  const getStatusBadge = () => {
    switch (status) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EA4335]/20 text-[#EA4335] border border-[#EA4335]/30">
            <XCircle className="w-3.5 h-3.5" /> High Risk Blocked
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged for Anomaly
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Compliance Review
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Clean
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Explainable AI (XAI) Risk Breakdown
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tx #{transaction.id} • ₹{Number(transaction.amount).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gauge & Composite Score */}
        <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--border)] mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-[var(--text-tertiary)]">Composite Risk Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ color: getScoreColor(riskScore) }}
                >
                  {riskScore}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">/ 100</span>
              </div>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* Risk Level Bar */}
          <div className="w-full bg-[var(--border-strong)] h-2.5 rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(riskScore, 5)}%`,
                backgroundColor: getScoreColor(riskScore),
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-1.5">
            <span>0 (Safe)</span>
            <span>30 (Review)</span>
            <span>60 (Flagged)</span>
            <span>80+ (Blocked)</span>
          </div>
        </div>

        {/* Dual Engine Fusion Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
              <Sliders className="w-3.5 h-3.5 text-[#4285F4]" />
              <span>Deterministic Rules</span>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">{ruleScore}/100</div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              Static business guardrails & frequency limits
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#34A853]" />
              <span>ML Probability</span>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {(mlProb * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              Logistic Regression weights on 100k records
            </p>
          </div>
        </div>

        {/* Identified Factors */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Anomaly & Risk Factor Triggers
          </h4>
          {factors.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>No anomalous behavior detected. Normal spending velocity.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{factor}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Officer Resolution Log (if available) */}
        {transaction.resolutionNotes && (
          <div className="p-3.5 rounded-2xl bg-[var(--surface-dim)] border border-[#4285F4]/30 mb-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--gpay-blue-muted)] mb-1">
              <UserCheck className="w-4 h-4" />
              <span>Resolved by {transaction.resolvedBy || "Compliance Officer"}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed italic">
              "{transaction.resolutionNotes}"
            </p>
            {transaction.resolvedAt && (
              <span className="text-[10px] text-[var(--text-tertiary)] block mt-1">
                {new Date(transaction.resolvedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-[10px] text-[var(--text-tertiary)]">
          <span>Model: Native Node.js Predictor</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
