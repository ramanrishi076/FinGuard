import React, { useState, useEffect } from "react";
import { walletService, bankService } from "../../services/api";
import {
  Send,
  X,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Cpu,
  AtSign,
  User,
  Sparkles,
  UserPlus,
  AlertCircle,
  KeyRound,
  Landmark,
} from "lucide-react";
import { TransactionPinModal } from "./TransactionPinModal";
import { FraudExplanationModal } from "./FraudExplanationModal";
import { BankLogo } from "../BankLogo";

export const TransferModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
  currentUserId,
  initialRecipient = "",
  onOpenAddRecipient,
}) => {
  const [recipient, setRecipient] = useState(initialRecipient || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [result, setResult] = useState(null);
  const [blockedResult, setBlockedResult] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [verifiedRecipient, setVerifiedRecipient] = useState(null);

  // Security & AI Explanation States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedExplTx, setSelectedExplTx] = useState(null);
  const [pendingTransferPayload, setPendingTransferPayload] = useState(null);

  // Multi-Bank Account Selection State
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedSource, setSelectedSource] = useState("WALLET");

  useEffect(() => {
    if (!isOpen) return;
    bankService.getMyAccounts().then((accs) => {
      setBankAccounts(accs);
      const primary = accs.find((a) => a.isPrimary);
      if (primary) {
        setSelectedSource(`bank-${primary.id}`);
      }
    }).catch(() => {});
  }, [isOpen]);

  const numericBalance = Number(currentBalance || 0);

  const activeAccount = selectedSource.startsWith("bank-")
    ? bankAccounts.find((b) => b.id === Number(selectedSource.replace("bank-", "")))
    : null;

  const effectiveBalance = activeAccount
    ? Number(activeAccount.balance || 0)
    : numericBalance;

  const transferNum = Number(amount || 0);

  // Live balance check & reason based on selected source account
  const isInsufficient = transferNum > effectiveBalance;
  const shortfall = Math.max(0, transferNum - effectiveBalance);

  // Live client-side risk indicator
  const isLargeAmount = transferNum >= 50000;
  const isDrainRisk = effectiveBalance > 0 && transferNum / effectiveBalance >= 0.85;

  useEffect(() => {
    if (isOpen && initialRecipient) {
      setRecipient(initialRecipient);
    }
  }, [isOpen, initialRecipient]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchSuggestions = async () => {
      try {
        const list = await walletService.lookupRecipients(recipient);
        if (active) {
          setSuggestions(list);
          const q = recipient.trim().toLowerCase();
          const exact = list.find(
            (u) =>
              u.upiId.toLowerCase() === q ||
              u.email.toLowerCase() === q ||
              String(u.id) === q ||
              u.name.toLowerCase() === q
          );
          setVerifiedRecipient(exact || null);
        }
      } catch {
        // Ignored
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [recipient, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setRecipient("");
    setAmount("");
    setDescription("");
    setResult(null);
    setBlockedResult(null);
    setError(null);
    setVerifiedRecipient(null);
    setPendingTransferPayload(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSelectRecipient = (u) => {
    setRecipient(u.upiId);
    setVerifiedRecipient(u);
  };

  const handleQuickAddRecipient = async () => {
    const rawTarget = recipient.trim();
    if (!rawTarget) return;
    setAddingRecipient(true);
    setError(null);
    try {
      const rawName = rawTarget.split("@")[0] || "Recipient";
      const guessedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const res = await walletService.addRecipient({
        name: guessedName,
        upiId: rawTarget,
      });
      setVerifiedRecipient(res.recipient);
      setRecipient(res.recipient.upiId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add recipient");
    } finally {
      setAddingRecipient(false);
    }
  };

  const performTransfer = async (targetRecipient, amountNum, desc, pin = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await walletService.transfer(targetRecipient, amountNum, desc, pin);
      setResult(res);
      setPendingTransferPayload(null);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresPin) {
        setPendingTransferPayload({ targetRecipient, transferNum: amountNum, description: desc });
        setIsPinModalOpen(true);
      } else if (err.response?.status === 403 && err.response?.data?.fraud) {
        setBlockedResult(err.response.data);
      } else {
        setError(err.response?.data?.message || "Failed to execute transfer. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBlockedResult(null);

    const targetRecipient = recipient.trim();
    if (!targetRecipient) {
      setError("Please enter a valid recipient UPI ID, name, or User ID");
      return;
    }

    if (
      (verifiedRecipient && Number(verifiedRecipient.id) === Number(currentUserId)) ||
      targetRecipient === String(currentUserId)
    ) {
      setError("Self-transfers are not allowed. Please enter another user's UPI ID or ID.");
      return;
    }

    if (!transferNum || transferNum <= 0) {
      setError("Please enter an amount greater than ₹0");
      return;
    }

    if (transferNum > effectiveBalance) {
      setError(
        `Insufficient balance in account: Your available balance is ₹${effectiveBalance.toLocaleString()}, but you are attempting to transfer ₹${transferNum.toLocaleString()} (shortfall: ₹${shortfall.toLocaleString()}). Please enter a smaller amount or deposit funds.`
      );
      return;
    }

    // Every single transfer strictly requires 6-digit Transaction PIN authorization
    setPendingTransferPayload({ targetRecipient, transferNum, description });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = (verifiedPin) => {
    if (pendingTransferPayload) {
      performTransfer(
        pendingTransferPayload.targetRecipient,
        pendingTransferPayload.transferNum,
        pendingTransferPayload.description,
        verifiedPin
      );
    }
  };

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
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gpay-blue-muted)]">
            Google Pay Shield Transfer
          </span>
        </div>

        {/* State 1: Transaction BLOCKED Result */}
        {blockedResult && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="p-5 rounded-2xl bg-[#EA4335]/10 border border-[#EA4335]/30 text-rose-200 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EA4335]/20 text-[#EA4335] flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">Transfer Blocked by AI Shield</h4>
              <p className="text-xs leading-relaxed text-rose-200/90 mb-4">
                {blockedResult.message || "High risk pattern detected by machine learning engine."}
              </p>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[#EA4335]/30 space-y-2 text-xs text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Risk Score:</span>
                  <span className="font-bold text-[#EA4335] text-sm">
                    {blockedResult.fraud?.riskScore}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Decision:</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EA4335]/20 text-rose-300 font-bold uppercase text-[10px]">
                    {blockedResult.fraud?.decision}
                  </span>
                </div>
                {blockedResult.fraud?.reasons?.length > 0 && (
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-1">Risk Factors:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300">
                      {blockedResult.fraud.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedExplTx({
                    ...blockedResult.transaction,
                    riskScore: blockedResult.fraud?.riskScore,
                    ruleScore: blockedResult.fraud?.ruleScore,
                    riskFactors: blockedResult.fraud?.reasons,
                    mlProbability: blockedResult.fraud?.ml?.probability,
                    status: blockedResult.fraud?.decision || "BLOCKED",
                  })
                }
                className="w-full py-2.5 rounded-full bg-[#EA4335]/20 hover:bg-[#EA4335]/30 text-rose-200 text-xs font-semibold border border-[#EA4335]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" /> Explain AI Risk Breakdown
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
              >
                Try Another Payment
              </button>
            </div>
          </div>
        )}

        {/* State 2: Transaction Successful Result (Google Pay Receipt Style) */}
        {result && !blockedResult && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-[#34A853]/20 text-[#34A853] flex items-center justify-center mx-auto mb-2 border border-[#34A853]/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Payment Successful
              </p>
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)] font-mono mt-1">
                ₹{Number(result.transaction.amount).toLocaleString()}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Paid to <strong className="text-[var(--text-primary)]">{result.recipient?.name || "Recipient"}</strong> (
                {result.recipient?.upiId || recipient})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">Recipient UPI ID:</span>
                <span className="font-mono text-[var(--gpay-blue-muted)] font-semibold">
                  {result.recipient?.upiId || recipient}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">UPI Ref / Tx ID:</span>
                <span className="font-mono text-[var(--text-secondary)]">FG-TX-{result.transaction.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">AI Shield Risk Score:</span>
                <span className="font-bold text-emerald-400">
                  {result.fraud?.riskScore}/100 ({result.fraud?.decision})
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text-tertiary)]">Updated Wallet Balance:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  ₹{Number(result.senderWallet?.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedExplTx({
                    ...result.transaction,
                    riskScore: result.fraud?.riskScore,
                    ruleScore: result.fraud?.ruleScore,
                    riskFactors: result.fraud?.reasons,
                    mlProbability: result.fraud?.ml?.probability,
                    status: result.fraud?.decision || "APPROVED",
                  })
                }
                className="w-full py-2.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-[#4285F4]" /> View AI Model Factors
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* State 3: Active GPay Payment Sheet */}
        {!result && !blockedResult && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#EA4335]/15 border border-[#EA4335]/30 text-rose-300 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA4335]" />
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
                {error.toLowerCase().includes("not found") && (
                  <div className="pt-2 border-t border-[#EA4335]/25 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-200">Want to register this recipient?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAddRecipient) {
                          onOpenAddRecipient(recipient);
                        } else {
                          handleQuickAddRecipient();
                        }
                      }}
                      disabled={addingRecipient}
                      className="px-3 py-1.5 rounded-full bg-[#1b6ef3] hover:bg-[#185abc] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
                    >
                      {addingRecipient ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      Add & Verify Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recipient Selector / Avatar Header */}
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#8ab4f8] flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {verifiedRecipient?.name
                    ? verifiedRecipient.name.charAt(0).toUpperCase()
                    : recipient
                    ? recipient.charAt(0).toUpperCase()
                    : <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)]">Paying to:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAddRecipient) onOpenAddRecipient(recipient);
                          else handleQuickAddRecipient();
                        }}
                        className="text-[11px] text-[var(--gpay-blue-light)] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                      >
                        <UserPlus className="w-3 h-3" />
                        + Add Recipient
                      </button>
                      {verifiedRecipient && (
                        <span className="text-[10px] text-[#81c995] font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter UPI ID (e.g. alice@finguard or rishi@finguard)"
                    className="w-full bg-transparent text-[var(--text-primary)] font-semibold text-sm placeholder-[var(--text-placeholder)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Contacts Pills */}
              {suggestions.length > 0 && !verifiedRecipient && (
                <div className="mt-3 pt-2.5 border-t border-[var(--border-nav)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Suggested Contacts:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAddRecipient) onOpenAddRecipient(recipient);
                        else handleQuickAddRecipient();
                      }}
                      className="text-[10px] text-[var(--gpay-blue-light)] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <UserPlus className="w-2.5 h-2.5" />
                      + Add New
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectRecipient(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs transition-colors cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#1b6ef3] text-[9px] font-bold text-white flex items-center justify-center">
                          {s.name.charAt(0)}
                        </span>
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Google Pay Giant Currency Input */}
            <div className="py-4 text-center">
              <span className="text-xs text-[var(--text-tertiary)] block mb-1">Enter Amount</span>
              <div className="flex items-center justify-center">
                <span className={`text-3xl font-bold mr-1.5 transition-colors ${isInsufficient ? "text-[#EA4335]" : "text-[var(--text-tertiary)]"}`}>₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  autoFocus
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="0"
                  className={`text-4xl sm:text-5xl font-extrabold text-center bg-transparent border-b-2 focus:outline-none w-48 sm:w-56 pb-1 font-mono transition-colors ${
                    isInsufficient
                      ? "text-[#EA4335] border-[#EA4335]"
                      : "text-[var(--text-primary)] border-[#1b6ef3] placeholder-[var(--text-muted)]"
                  }`}
                />
              </div>

              {/* Insufficient balance explicit reason notification */}
              {isInsufficient ? (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EA4335]/15 border border-[#EA4335]/35 text-rose-300 text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-[#EA4335] shrink-0" />
                  <span>
                    Insufficient account balance: Available <strong>₹{effectiveBalance.toLocaleString()}</strong> (Shortfall: <strong>₹{shortfall.toLocaleString()}</strong>)
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-[var(--text-tertiary)] mt-2 block">
                  Available in Selected Account: ₹{effectiveBalance.toLocaleString()}
                </span>
              )}
            </div>

            {/* Payment Account Source Selector (Multi-Bank) */}
            <div className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <BankLogo
                  code={activeAccount ? activeAccount.bankCode : "UPI"}
                  name={activeAccount?.bankName || "Wallet"}
                  brandColor={activeAccount?.brandColor || "#1b6ef3"}
                  size="sm"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                    Paying From
                  </span>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer pr-2"
                  >
                    <option value="WALLET" className="bg-[var(--surface)] text-[var(--text-primary)]">
                      FinGuard Virtual Wallet (₹{Number(currentBalance || 0).toLocaleString()})
                    </option>
                    {bankAccounts.map((acc) => (
                      <option
                        key={acc.id}
                        value={`bank-${acc.id}`}
                        className="bg-[var(--surface)] text-[var(--text-primary)]"
                      >
                        {acc.bankName} {acc.accountNumber} {acc.isPrimary ? "• Primary" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-right pl-2">
                <span className="text-[10px] text-[var(--text-tertiary)] block">Balance</span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  ₹{effectiveBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Note / Memo Input */}
            <div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note (e.g. dinner, rent, groceries)"
                className="w-full px-4 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[#1b6ef3] transition-colors"
              />
            </div>

            {/* AI Risk Radar Indicator */}
            {(isLargeAmount || isDrainRisk) && (
              <div className="p-3 rounded-2xl bg-[#FBBC04]/10 border border-[#FBBC04]/30 text-amber-200 text-xs flex items-start gap-2">
                <Cpu className="w-4 h-4 text-[#FBBC04] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#fdd663] block">AI Shield Verification:</span>
                  <span className="text-[11px] opacity-90">
                    {isLargeAmount && "Amount ≥ ₹50,000 runs enhanced neural evaluation. "}
                    {isDrainRisk && "Transferring high balance ratio triggers heuristic anomaly screening."}
                  </span>
                </div>
              </div>
            )}

            {/* GPay Primary Action Pill Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || effectiveBalance <= 0 || isInsufficient}
                className={`w-full py-3.5 rounded-full font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isInsufficient
                    ? "bg-[#EA4335]/85 hover:bg-[#EA4335] text-white shadow-rose-900/25 cursor-not-allowed opacity-90"
                    : "bg-[#1b6ef3] hover:bg-[#185abc] text-white disabled:opacity-50 shadow-blue-500/25"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Screening via AI Shield & Processing...
                  </>
                ) : isInsufficient ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Insufficient Balance (Need ₹{shortfall.toLocaleString()} More)
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Pay {amount ? `₹${Number(amount).toLocaleString()}` : "Now"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Step-Up Transaction PIN Modal */}
      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Enter UPI PIN"
        description="Enter your 6-digit Transaction PIN to authorize this payment."
      />

      {/* Explainable AI Drill-down Modal */}
      <FraudExplanationModal
        isOpen={Boolean(selectedExplTx)}
        onClose={() => setSelectedExplTx(null)}
        transaction={selectedExplTx}
      />
    </div>
  );
};
