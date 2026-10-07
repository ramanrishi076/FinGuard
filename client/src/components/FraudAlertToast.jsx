import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { ShieldAlert, AlertTriangle, XCircle, X } from "lucide-react";

export const FraudAlertToast = () => {
  const { addFraudListener } = useSocket();
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const unsubscribe = addFraudListener((alert) => {
      setActiveAlert(alert);

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        setActiveAlert(null);
      }, 8000);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, [addFraudListener]);

  if (!activeAlert) return null;

  const isBlocked = activeAlert.decision === "BLOCKED";
  const isFlagged = activeAlert.decision === "FLAGGED";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`p-4 rounded-3xl border shadow-2xl bg-[var(--surface)] ${
          isBlocked
            ? "border-[#ea4335]/60 text-[var(--text-secondary)]"
            : isFlagged
            ? "border-[#f9ab00]/60 text-[var(--text-secondary)]"
            : "border-[#fbbc04]/60 text-[var(--text-secondary)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-[#ea4335]/20 text-[#f28b82]"
                  : isFlagged
                  ? "bg-[#f9ab00]/20 text-[#fdd663]"
                  : "bg-[#fbbc04]/20 text-[#fde293]"
              }`}
            >
              {isBlocked ? (
                <XCircle className="w-5 h-5" />
              ) : isFlagged ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  {isBlocked ? "Transfer Blocked by FinGuard" : "Payment Under Review"}
                </h4>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isBlocked
                      ? "bg-[#ea4335]/20 text-[#f28b82]"
                      : "bg-[#f9ab00]/20 text-[#fdd663]"
                  }`}
                >
                  {activeAlert.decision}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Amount: ₹{Number(activeAlert.amount).toLocaleString()} • Risk Score:{" "}
                <strong className="text-[var(--text-primary)] font-mono">{activeAlert.riskScore}/100</strong>
              </p>
              {activeAlert.reasons && activeAlert.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-[var(--text-tertiary)] list-disc list-inside">
                  {activeAlert.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="p-1.5 rounded-full hover:bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
