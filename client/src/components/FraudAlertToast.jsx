import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { ShieldAlert, AlertTriangle, XCircle, CheckCircle2, X } from "lucide-react";

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
        className={`p-4 rounded-2xl border shadow-2xl ${
          isBlocked
            ? "border-rose-500/50 bg-rose-950 text-rose-100 glow-rose"
            : isFlagged
            ? "border-amber-500/50 bg-amber-950 text-amber-100"
            : "border-yellow-500/50 bg-yellow-950 text-yellow-100"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                isBlocked
                  ? "bg-rose-500/20 text-rose-400"
                  : isFlagged
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-yellow-500/20 text-yellow-400"
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
                <h4 className="text-sm font-bold tracking-tight">
                  {isBlocked ? "Transfer Blocked by AI Shield" : "Transaction Under Review"}
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                  {activeAlert.decision}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                Amount: ₹{Number(activeAlert.amount).toLocaleString()} • Risk Score:{" "}
                <strong className="underline">{activeAlert.riskScore}/100</strong>
              </p>
              {activeAlert.reasons && activeAlert.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] opacity-80 list-disc list-inside">
                  {activeAlert.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 rounded-lg hover:bg-black/30 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
