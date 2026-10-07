import React, { useState, useEffect } from "react";
import { walletService } from "../../services/api";
import {
  UserPlus,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AtSign,
  User,
  Send,
  Sparkles,
} from "lucide-react";

const POPULAR_HANDLES = ["@okicici", "@oksbi", "@okhdfcbank", "@paytm", "@finguard"];

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-indigo-600",
];

export const AddRecipientModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialUpiId = "",
}) => {
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState(initialUpiId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialUpiId) {
        setUpiId(initialUpiId);
        // Guess a friendly default name from handle if empty
        if (!name) {
          const rawName = initialUpiId.split("@")[0] || "";
          const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          setName(formatted);
        }
      }
      setError(null);
      setSuccessResult(null);
    }
  }, [isOpen, initialUpiId]);

  if (!isOpen) return null;

  const handleApplySuffix = (suffix) => {
    const prefix = upiId.includes("@") ? upiId.split("@")[0] : upiId || name.toLowerCase().replace(/\s+/g, "");
    setUpiId(`${prefix}${suffix}`);
  };

  const getInitials = (text) => {
    if (!text) return "?";
    const parts = text.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e, shouldPay = false) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUpi = upiId.trim();

    if (!trimmedName) {
      setError("Please enter the recipient's full name");
      return;
    }

    if (!trimmedUpi) {
      setError("Please enter a valid UPI ID (e.g. oliver@okicici)");
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.addRecipient({
        name: trimmedName,
        upiId: trimmedUpi,
      });

      setSuccessResult(res.recipient);
      if (onSuccess) {
        onSuccess(res.recipient, shouldPay);
      }

      if (shouldPay) {
        setTimeout(() => {
          handleClose();
        }, 300);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add recipient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setUpiId("");
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  // Pick color based on name length
  const colorIndex = (name.length + upiId.length) % AVATAR_COLORS.length;
  const avatarBg = AVATAR_COLORS[colorIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gpay-blue-muted)]">
            Google Pay Directory
          </span>
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#1b6ef3]" />
          Add New Recipient
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Save a friend, merchant, or contact to send money securely anytime.
        </p>

        {/* State: Successfully Added */}
        {successResult ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-200 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-[#34A853]/20 text-[#34A853] flex items-center justify-center mx-auto border border-[#34A853]/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">Recipient Added!</h4>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                <strong className="text-[var(--text-primary)]">{successResult.name}</strong> is now verified and ready to receive payments.
              </p>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--border)] font-mono text-xs text-[var(--gpay-blue-muted)] font-semibold">
                {successResult.upiId}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess(successResult, true);
                  handleClose();
                }}
                className="flex-1 py-2.5 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Pay Now
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-[#EA4335]/15 border border-[#EA4335]/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Contact Card Preview */}
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full ${avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md`}
              >
                {getInitials(name || upiId)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                    {name.trim() || "Recipient Name"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[#81c995] font-semibold bg-[#34A853]/15 px-1.5 py-0.2 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] font-mono truncate">
                  {upiId.trim() || "username@bank"}
                </p>
              </div>
            </div>

            {/* Recipient Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oliver Smith"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[#1b6ef3] transition-colors"
                />
              </div>
            </div>

            {/* UPI ID / VPA */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                UPI ID / VPA
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. oliver@okicici"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-mono placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[#1b6ef3] transition-colors"
                />
              </div>

              {/* Suffix Shortcuts */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-[var(--text-tertiary)]">Quick Handles:</span>
                {POPULAR_HANDLES.map((suffix) => (
                  <button
                    key={suffix}
                    type="button"
                    onClick={() => handleApplySuffix(suffix)}
                    className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--surface-elevated)] hover:bg-[#1b6ef3]/20 hover:text-[var(--gpay-blue-light)] text-[var(--text-secondary)] border border-[var(--border)] transition-colors cursor-pointer"
                  >
                    {suffix}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex gap-2.5">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] disabled:opacity-50 text-[var(--text-primary)] font-semibold text-xs flex items-center justify-center gap-1.5 border border-[var(--border)] transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add Recipient
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 py-3 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Add & Pay Now
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
