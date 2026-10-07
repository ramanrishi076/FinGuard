import React, { useState, useEffect } from "react";
import { bankService } from "../services/api";
import {
  Building2,
  Plus,
  CheckCircle2,
  Star,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Landmark,
} from "lucide-react";
import { LinkBankAccountModal } from "./modals/LinkBankAccountModal";
import { TransactionPinModal } from "./modals/TransactionPinModal";
import { BankLogo } from "./BankLogo";

export const LinkedBankAccountsCard = ({ onAccountsChanged }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [pinModalState, setPinModalState] = useState({ isOpen: false, accountId: null, bankName: "" });
  const [revealedBalances, setRevealedBalances] = useState({}); // { [accountId]: "45000" }
  const [checkingBalanceId, setCheckingBalanceId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankService.getMyAccounts();
      setAccounts(data);
      if (onAccountsChanged) onAccountsChanged(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load linked bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSetPrimary = async (accountId, bankName) => {
    setActionLoadingId(accountId);
    setError(null);
    try {
      await bankService.setPrimary(accountId);
      setSuccess(`${bankName} set as Primary Account for receiving UPI payments.`);
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update primary bank account");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnlink = async (accountId, bankName) => {
    if (!window.confirm(`Are you sure you want to unlink your ${bankName} account?`)) {
      return;
    }
    setActionLoadingId(accountId);
    setError(null);
    try {
      await bankService.unlinkAccount(accountId);
      setSuccess(`Unlinked ${bankName} account successfully.`);
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unlink account");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestBalance = (acc) => {
    setPinModalState({
      isOpen: true,
      accountId: acc.id,
      bankName: acc.bankName,
    });
  };

  const handlePinSuccess = async (pin) => {
    const { accountId } = pinModalState;
    if (!accountId) return;

    setCheckingBalanceId(accountId);
    setError(null);
    try {
      const res = await bankService.checkBalance(accountId, pin);
      setRevealedBalances((prev) => ({
        ...prev,
        [accountId]: res.balance,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify PIN for balance inquiry");
    } finally {
      setCheckingBalanceId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-[var(--surface)] p-6 sm:p-7 border border-[var(--border)] shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4] shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Linked Bank Accounts
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34A853]/15 text-[#34A853] border border-[#34A853]/30">
                NPCI UPI
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Manage multi-bank accounts, check live balances, and configure default receiving account.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLinkModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Bank Accounts Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[#4285F4] mb-2" />
          <span className="text-xs">Connecting to banking switch...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-[var(--surface-dim)] border border-dashed border-[var(--border)] p-6">
          <Landmark className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">No Bank Accounts Linked</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 mb-4 max-w-sm mx-auto">
            Link any of the 35+ supported banks (SBI, HDFC, ICICI, Kotak, Axis) to enable seamless instant transfers.
          </p>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Link Your First Bank Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const hasRevealed = Boolean(revealedBalances[acc.id]);
            const isActing = actionLoadingId === acc.id;

            return (
              <div
                key={acc.id}
                className="relative rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] p-5 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between overflow-hidden shadow-sm"
              >
                {/* Brand Color Header Stripe */}
                <div
                  style={{ backgroundColor: acc.brandColor || "#006699" }}
                  className="absolute top-0 left-0 right-0 h-1.5"
                />

                <div>
                  <div className="flex items-start justify-between mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <BankLogo
                        code={acc.bankCode}
                        name={acc.bankName}
                        brandColor={acc.brandColor}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">{acc.bankName}</h4>
                          {acc.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#34A853]/15 text-[#34A853] border border-[#34A853]/30 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-[#34A853]" /> PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] font-medium">
                          {acc.accountType} • {acc.branchName || "Main Branch"}
                        </p>
                      </div>
                    </div>

                    {/* Unlink button */}
                    <button
                      onClick={() => handleUnlink(acc.id, acc.bankName)}
                      disabled={isActing}
                      title="Unlink Bank Account"
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Account Numbers & IFSC */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-[var(--surface-dim)] text-xs border border-[var(--border)]/40 font-mono">
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block font-sans">Account No:</span>
                      <span className="font-bold text-[var(--text-primary)]">{acc.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block font-sans">IFSC Code:</span>
                      <span className="font-semibold text-[var(--text-secondary)]">{acc.ifscCode}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Balance & Primary Action */}
                <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Account Balance
                    </span>
                    {hasRevealed ? (
                      <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[var(--text-primary)]">
                        <span>₹{Number(revealedBalances[acc.id]).toLocaleString()}</span>
                        <button
                          onClick={() => handleRequestBalance(acc)}
                          title="Refresh Balance"
                          className="text-[var(--text-tertiary)] hover:text-[#4285F4] cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestBalance(acc)}
                        disabled={checkingBalanceId === acc.id}
                        className="text-xs font-semibold text-[#4285F4] hover:text-[#1b6ef3] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {checkingBalanceId === acc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        <span>Check Balance</span>
                      </button>
                    )}
                  </div>

                  {!acc.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(acc.id, acc.bankName)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer"
                    >
                      {isActing ? "Setting..." : "Make Primary"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Bank Modal */}
      <LinkBankAccountModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={() => {
          fetchAccounts();
        }}
      />

      {/* UPI PIN Modal for Check Balance */}
      <TransactionPinModal
        isOpen={pinModalState.isOpen}
        onClose={() => setPinModalState({ isOpen: false, accountId: null, bankName: "" })}
        onSuccess={handlePinSuccess}
        title="Enter UPI PIN"
        description={`Enter your 6-digit PIN to check balance for ${pinModalState.bankName}.`}
      />
    </div>
  );
};
