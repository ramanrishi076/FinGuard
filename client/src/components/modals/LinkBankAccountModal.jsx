import React, { useState, useEffect, useMemo } from "react";
import { bankService } from "../../services/api";
import {
  Building2,
  Search,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { BankLogo } from "../BankLogo";

export const LinkBankAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [linkingBank, setLinkingBank] = useState(null);
  const [linkStep, setLinkStep] = useState(0); // 0: select, 1: connecting NPCI, 2: account discovered, 3: success
  const [error, setError] = useState(null);
  const [newLinkedAccount, setNewLinkedAccount] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setSelectedCategory("ALL");
    setLinkingBank(null);
    setLinkStep(0);
    setError(null);
    setNewLinkedAccount(null);

    const loadDirectory = async () => {
      setLoading(true);
      try {
        const list = await bankService.getDirectory();
        setBanks(list);
      } catch (err) {
        setError("Failed to load banks directory.");
      } finally {
        setLoading(false);
      }
    };

    loadDirectory();
  }, [isOpen]);

  const popularBanks = useMemo(() => {
    return banks.filter((b) => b.popular);
  }, [banks]);

  const filteredBanks = useMemo(() => {
    return banks.filter((b) => {
      const matchesCategory =
        selectedCategory === "ALL"
          ? true
          : selectedCategory === "POPULAR"
          ? b.popular
          : b.category === selectedCategory;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.ifscPrefix.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [banks, search, selectedCategory]);

  const handleSelectBank = async (bank) => {
    setLinkingBank(bank);
    setLinkStep(1); // Step 1: Connecting with NPCI UPI Switch
    setError(null);

    // Simulated NPCI Account Discovery Sequence
    setTimeout(() => {
      setLinkStep(2); // Step 2: Account Discovered
    }, 1200);

    setTimeout(async () => {
      try {
        const res = await bankService.linkAccount(bank.code, "SAVINGS");
        setNewLinkedAccount(res.account);
        setLinkStep(3); // Step 3: Success
        if (onSuccess) onSuccess(res.account);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to link bank account. Please try again.");
        setLinkStep(0);
        setLinkingBank(null);
      }
    }, 2400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Google Colors Bar */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#4285F4]" />
          <div className="flex-1 bg-[#EA4335]" />
          <div className="flex-1 bg-[#FBBC05]" />
          <div className="flex-1 bg-[#34A853]" />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Add Bank Account
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Connect via NPCI UPI Account Aggregator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1, 2, 3: NPCI DISCOVERY ANIMATION */}
        {linkStep > 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            {linkStep === 1 && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[#4285F4]/20 border-t-[#4285F4] animate-spin" />
                  <Smartphone className="w-8 h-8 text-[#4285F4]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-primary)]">
                    Contacting {linkingBank?.name}...
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs mx-auto">
                    Sending encrypted secure verification via NPCI UPI switch linked to your registered mobile number...
                  </p>
                </div>
              </div>
            )}

            {linkStep === 2 && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-9 h-9 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-primary)]">
                    Account Discovered!
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Found Savings Account with IFSC Prefix {linkingBank?.ifscPrefix}... Binding secure UPI handle.
                  </p>
                </div>
              </div>
            )}

            {linkStep === 3 && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-400">
                    Bank Account Linked Successfully!
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {newLinkedAccount?.bankName} ({newLinkedAccount?.accountNumber}) is ready for instant UPI transfers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-left max-w-xs mx-auto space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Bank:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{newLinkedAccount?.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Account No:</span>
                    <span className="font-mono text-[var(--text-primary)]">{newLinkedAccount?.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">IFSC Code:</span>
                    <span className="font-mono text-[var(--text-primary)]">{newLinkedAccount?.ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">UPI ID:</span>
                    <span className="font-mono text-[#4285F4]">user@{newLinkedAccount?.upiHandle}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1558c7] text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        ) : (
          /* STEP 0: SEARCH & SELECT BANK */
          <>
            {/* Search Input */}
            <div className="p-4 sm:p-5 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search from 35+ supported banks (e.g. SBI, HDFC, ICICI, Kotak)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--surface-dim)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] outline-none focus:border-[#4285F4] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar text-xs">
                {[
                  { id: "ALL", label: "All Banks" },
                  { id: "POPULAR", label: "Popular" },
                  { id: "PUBLIC", label: "Public Sector" },
                  { id: "PRIVATE", label: "Private" },
                  { id: "PAYMENTS_SFB", label: "Payments & SFB" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-[#1b6ef3] text-white shadow-sm"
                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-nav)] border border-[var(--border)]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-5 mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Scrollable Bank Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 space-y-4">
              {/* Popular Banks Circle Grid (Only shown when not searching) */}
              {!search && selectedCategory === "ALL" && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2.5">
                    Popular Banks
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {popularBanks.slice(0, 7).map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => handleSelectBank(bank)}
                        className="flex flex-col items-center p-2 rounded-2xl hover:bg-[var(--surface-elevated)] border border-transparent hover:border-[var(--border)] transition-all group cursor-pointer"
                      >
                        <BankLogo
                          code={bank.code}
                          name={bank.name}
                          brandColor={bank.brandColor}
                          size="md"
                          className="group-hover:scale-105 transition-transform"
                        />
                        <span className="text-[10px] font-semibold text-[var(--text-primary)] mt-1.5 text-center truncate w-full">
                          {bank.shortName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Bank List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    All Banks ({filteredBanks.length})
                  </h4>
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#34A853]" /> NPCI 256-Bit Encrypted
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#4285F4] mb-2" />
                    <span className="text-xs">Loading banks directory...</span>
                  </div>
                ) : filteredBanks.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                    No banks found matching "{search}".
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => handleSelectBank(bank)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--surface-elevated)] border border-[var(--border)]/40 hover:border-[#4285F4]/40 transition-all group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <BankLogo
                            code={bank.code}
                            name={bank.name}
                            brandColor={bank.brandColor}
                            size="sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#4285F4] transition-colors">
                                {bank.name}
                              </span>
                              {bank.popular && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#4285F4]/15 text-[var(--gpay-blue-light)]">
                                  Top
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--text-tertiary)]">
                              IFSC Prefix: <span className="font-mono">{bank.ifscPrefix}</span> • UPI: @{bank.upiHandle}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[#4285F4] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
