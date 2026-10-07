import React, { useState, useEffect, useMemo } from "react";
import { walletService } from "../../services/api";
import {
  X,
  User,
  AtSign,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
} from "lucide-react";

const POPULAR_HANDLES = ["@okicici", "@oksbi", "@okhdfcbank", "@paytm", "@finguard"];

export const RecipientProfileModal = ({
  isOpen,
  onClose,
  recipient,
  transactions = [],
  currentUser,
  onPayRecipient,
  onRecipientUpdated,
  onRecipientDeleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUpiId, setEditUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (recipient) {
      setEditName(recipient.name || "");
      setEditUpiId(recipient.upiId || recipient.email || "");
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError(null);
      setSuccess(null);
    }
  }, [recipient, isOpen]);

  // Compute transactions with this contact
  const contactTransactions = useMemo(() => {
    if (!recipient) return [];
    const qName = (recipient.name || "").toLowerCase();
    const qUpi = (recipient.upiId || "").toLowerCase();
    const recId = recipient.id;

    return transactions.filter((tx) => {
      if (recId && (tx.receiverUserId === recId || tx.senderUserId === recId)) return true;
      if (tx.receiverUpiId && tx.receiverUpiId.toLowerCase() === qUpi) return true;
      if (tx.receiverName && tx.receiverName.toLowerCase() === qName) return true;
      if (tx.senderUpiId && tx.senderUpiId.toLowerCase() === qUpi) return true;
      if (tx.senderName && tx.senderName.toLowerCase() === qName) return true;
      return false;
    });
  }, [recipient, transactions]);

  const totalTransferred = useMemo(() => {
    return contactTransactions
      .filter((t) => t.status === "APPROVED")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [contactTransactions]);

  if (!isOpen || !recipient) return null;

  const handleCopyUPI = () => {
    if (!recipient.upiId) return;
    navigator.clipboard.writeText(recipient.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySuffix = (suffix) => {
    const prefix = editUpiId.includes("@") ? editUpiId.split("@")[0] : editUpiId || editName.toLowerCase().replace(/\s+/g, "");
    setEditUpiId(`${prefix}${suffix}`);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = editName.trim();
    const trimmedUpi = editUpiId.trim();

    if (!trimmedName) {
      setError("Recipient name cannot be empty");
      return;
    }
    if (!trimmedUpi) {
      setError("Recipient UPI ID cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await walletService.updateRecipient(recipient.id, {
        name: trimmedName,
        upiId: trimmedUpi,
      });

      setSuccess("Recipient updated successfully!");
      setIsEditing(false);
      if (onRecipientUpdated) {
        onRecipientUpdated(res.recipient);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update recipient");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await walletService.deleteRecipient(recipient.id);
      if (onRecipientDeleted) {
        onRecipientDeleted(recipient.id);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete recipient");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (text) => {
    if (!text) return "?";
    const parts = text.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gpay-blue-muted)]">
            Contact Profile & Options
          </span>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#EA4335]/15 border border-[#EA4335]/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#EA4335]" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-[#34A853]/15 border border-[#34A853]/30 text-[#81c995] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34A853]" />
            <span>{success}</span>
          </div>
        )}

        {/* State A: Delete Confirmation Dialog */}
        {showDeleteConfirm ? (
          <div className="p-5 rounded-2xl bg-[#EA4335]/10 border border-[#EA4335]/30 text-center space-y-3 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#EA4335]/20 text-[#EA4335] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">Delete Contact?</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--text-primary)]">{recipient.name}</strong> ({recipient.upiId}) from your recipient directory?
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Past payment records will remain safely archived in your statement.
            </p>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-xs font-semibold border border-[var(--border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-500/20"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Delete
              </button>
            </div>
          </div>
        ) : isEditing ? (
          /* State B: Inline Edit / Modify Form */
          <form onSubmit={handleUpdate} className="space-y-4 animate-in zoom-in-95 duration-150">
            <div className="text-center pb-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Edit Recipient Details</h4>
              <p className="text-xs text-[var(--text-tertiary)]">Update name or linked UPI ID</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#1b6ef3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                UPI ID / VPA
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  required
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[#1b6ef3] transition-colors"
                />
              </div>

              {/* Suffix Shortcuts */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-[var(--text-tertiary)]">Shortcuts:</span>
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

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-xs font-semibold border border-[var(--border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* State C: Normal Profile Display */
          <div className="space-y-5">
            {/* Contact Hero Card */}
            <div className="text-center py-2">
              <div
                className={`w-20 h-20 rounded-full ${
                  recipient.bg || "bg-gradient-to-tr from-[#1b6ef3] to-[#8ab4f8]"
                } text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-[#1b6ef3]/20`}
              >
                {recipient.initials || getInitials(recipient.name)}
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {recipient.name}
                </h3>
                <span className="text-[#81c995]" title="Verified UPI Handle">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--border)]">
                <span className="font-mono text-xs text-[var(--gpay-blue-muted)] font-semibold">
                  {recipient.upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34A853]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick Actions (Pay, Edit, Delete) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Pay Now Button */}
              <button
                type="button"
                onClick={() => {
                  if (onPayRecipient) onPayRecipient(recipient.upiId);
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1b6ef3] hover:bg-[#185abc] text-white transition-all cursor-pointer shadow-md shadow-blue-500/20 group"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 ml-0.5" />
                </div>
                <span className="text-xs font-bold">Pay ₹</span>
              </button>

              {/* Modify / Edit Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--input-bg)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit2 className="w-4 h-4 text-[var(--gpay-blue-light)]" />
                </div>
                <span className="text-xs font-semibold">Edit Contact</span>
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[#ea4335]/15 border border-[var(--border)] hover:border-[#ea4335]/40 text-[#f28b82] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#ea4335]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trash2 className="w-4 h-4 text-[#ea4335]" />
                </div>
                <span className="text-xs font-semibold">Delete</span>
              </button>
            </div>

            {/* Interaction Summary / History with this Contact */}
            <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" />
                  Past Activity:
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {contactTransactions.length} {contactTransactions.length === 1 ? "Transfer" : "Transfers"}
                </span>
              </div>

              {contactTransactions.length > 0 ? (
                <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                  {contactTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-[11px] py-1 text-[var(--text-secondary)]"
                    >
                      <span className="font-mono">#{tx.id} • {new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      <span className="font-semibold text-[var(--text-primary)]">₹{Number(tx.amount).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {contactTransactions.length > 3 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] text-center pt-1">
                      + {contactTransactions.length - 3} more in transaction history
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border)]">
                  No previous transactions with this recipient yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
