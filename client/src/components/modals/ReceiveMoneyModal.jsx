import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  ShieldCheck,
  Sparkles,
  ArrowDownLeft,
  CheckCircle2,
  IndianRupee,
  RotateCcw,
  Zap,
  Loader2,
} from "lucide-react";
import { walletService } from "../../services/api";

export const ReceiveMoneyModal = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulatedTx, setSimulatedTx] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);

  const userName = currentUser?.name || "FinGuard Member";
  const userUpiId =
    currentUser?.upiId ||
    `${currentUser?.name?.toLowerCase().replace(/\s+/g, "") || "user"}@finguard`;

  // Standard UPI URI specification
  const upiUri = React.useMemo(() => {
    let uri = `upi://pay?pa=${encodeURIComponent(userUpiId)}&pn=${encodeURIComponent(
      userName
    )}&cu=INR`;
    if (amount && Number(amount) > 0) {
      uri += `&am=${encodeURIComponent(amount)}`;
    }
    if (note && note.trim()) {
      uri += `&tn=${encodeURIComponent(note.trim())}`;
    }
    return uri;
  }, [userUpiId, userName, amount, note]);

  // Generate QR Code data URL whenever URI changes
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H", // High tolerance so center logo works seamlessly
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
      });

    return () => {
      active = false;
    };
  }, [upiUri, isOpen]);

  // Reset state when closing/opening
  useEffect(() => {
    if (isOpen) {
      setSimulatedTx(null);
      setError(null);
      setCopiedUpi(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(userUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download high-resolution branded QR card
  const handleDownloadQr = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx || !qrDataUrl) return;

    // Card background
    ctx.fillStyle = "#ffffff";
    ctx.roundRect(0, 0, 600, 760, 32);
    ctx.fill();

    // Top Google 4-color accent bar
    const barWidth = 600 / 4;
    const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
    colors.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(idx * barWidth, 0, barWidth, 12);
    });

    // FinGuard Pay Header
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FinGuard Pay", 300, 65);

    ctx.fillStyle = "#64748b";
    ctx.font = "14px sans-serif";
    ctx.fillText("Google Pay UPI Network • NPCI Certified", 300, 92);

    // User Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(userName, 300, 140);

    // UPI ID pill
    ctx.fillStyle = "#f1f5f9";
    ctx.roundRect(160, 155, 280, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#1b6ef3";
    ctx.font = "bold 15px monospace";
    ctx.fillText(userUpiId, 300, 176);

    // Amount badge if set
    let qrTop = 205;
    if (amount && Number(amount) > 0) {
      ctx.fillStyle = "#e0f2fe";
      ctx.roundRect(200, 200, 200, 30, 15);
      ctx.fill();
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(`Requesting ₹${Number(amount).toLocaleString()}`, 300, 220);
      qrTop = 245;
    }

    // QR Image
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 150, qrTop, 300, 300);

      // Center Shield Logo
      ctx.fillStyle = "#1b6ef3";
      ctx.beginPath();
      ctx.arc(300, qrTop + 150, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("₹", 300, qrTop + 156);

      // Footer
      ctx.fillStyle = "#475569";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Scan with any UPI App", 300, qrTop + 340);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Google Pay • PhonePe • Paytm • BHIM • FinGuard", 300, qrTop + 365);

      // Trigger download
      const a = document.createElement("a");
      a.download = `finguard-qr-${userUpiId.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    qrImg.src = qrDataUrl;
  };

  // Share link / QR
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${userName} on FinGuard`,
          text: `Scan or click to pay ${userName} (${userUpiId}) using any UPI app`,
          url: upiUri,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    handleCopyLink();
  };

  // Simulate Instant Payment Receipt for interactive demo/testing
  const handleSimulatePayment = async () => {
    const payAmount = Number(amount) > 0 ? Number(amount) : 500;
    setSimulating(true);
    setError(null);
    try {
      const description = note?.trim()
        ? `QR Payment: ${note.trim()}`
        : "Received via FinGuard UPI QR";
      const res = await walletService.deposit(payAmount, description);
      setSimulatedTx({
        amount: payAmount,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        description,
        walletBalance: res.wallet?.balance,
      });
      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(err.response?.data?.message || "Payment simulation failed. Please try again.");
    } finally {
      setSimulating(false);
    }
  };

  const quickPresets = [200, 500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay)] animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden my-auto">
        {/* Google 4-color top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#4285F4]" />
          <div className="flex-1 bg-[#EA4335]" />
          <div className="flex-1 bg-[#FBBC05]" />
          <div className="flex-1 bg-[#34A853]" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 mt-1">
          <div className="w-11 h-11 rounded-2xl bg-[#1b6ef3]/15 text-[var(--gpay-blue-light)] flex items-center justify-center border border-[#1b6ef3]/30 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              Receive Money
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                UPI QR
              </span>
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Scan with any UPI app to deposit directly into your wallet
            </p>
          </div>
        </div>

        {/* Simulated Success State Celebration */}
        {simulatedTx ? (
          <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Payment Received Successfully!
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] font-mono">
                +₹{simulatedTx.amount.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {simulatedTx.description}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono mt-1">
                Credited at {simulatedTx.time}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">New Balance</span>
              <span className="font-bold font-mono text-[var(--text-primary)]">
                ₹{Number(simulatedTx.walletBalance || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSimulatedTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Back to QR
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#1b6ef3] hover:bg-[#1558c7] text-xs font-semibold text-white transition-all cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Profile & UPI Banner */}
            <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#4285F4] text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {userName}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <div className="text-[11px] font-mono text-[var(--gpay-blue-light)] truncate">
                    {userUpiId}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyUpi}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                title="Copy UPI ID"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Branded QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl relative my-2">
              {/* Optional Amount Overlay Tag */}
              {amount && Number(amount) > 0 && (
                <div className="mb-2 px-3 py-1 rounded-full bg-[#1b6ef3]/10 border border-[#1b6ef3]/30 text-[#1b6ef3] font-bold text-xs flex items-center gap-1 shadow-xs">
                  <span>Pay exactly:</span>
                  <span className="font-mono text-sm font-extrabold">₹{Number(amount).toLocaleString()}</span>
                </div>
              )}

              {/* QR Image with Center Brand Shield */}
              <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center bg-white rounded-2xl p-1">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="FinGuard UPI QR Code"
                    className="w-full h-full object-contain rounded-xl select-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1b6ef3]" />
                  </div>
                )}

                {/* Central FinGuard GPay Shield Badge */}
                {qrDataUrl && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-[#1b6ef3] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Supported Apps List */}
              <div className="mt-3 text-center">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Scan to Pay with any UPI App
                </span>
                <span className="text-[10px] text-slate-400 block tracking-tight mt-0.5">
                  Google Pay • PhonePe • Paytm • BHIM • FinGuard
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Set Custom Amount & Note Accordion */}
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => setShowCustomize(!showCustomize)}
                className="w-full text-xs font-semibold text-[var(--gpay-blue-light)] hover:underline flex items-center justify-between cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {showCustomize ? "Hide Custom Amount / Note" : "Set Amount or Purpose (Optional)"}
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {amount ? `₹${Number(amount).toLocaleString()}` : "Not set"}
                </span>
              </button>

              {showCustomize && (
                <div className="mt-3 space-y-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-in slide-in-from-top-2 duration-150">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Specific Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-tertiary)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-mono placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[#1b6ef3]"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {quickPresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(String(val))}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            amount === String(val)
                              ? "bg-[#1b6ef3] text-white border-[#1b6ef3]"
                              : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#1b6ef3]/50"
                          }`}
                        >
                          +₹{val}
                        </button>
                      ))}
                      {amount && (
                        <button
                          type="button"
                          onClick={() => setAmount("")}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-[var(--text-tertiary)] hover:text-rose-400 border border-transparent cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Note / Description (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="e.g. Dinner, Rent split, Freelance"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[#1b6ef3]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Download, Share, & Instant Test Simulator */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2.5 px-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--gpay-blue-light)]" />
                  Save QR Image
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      Share Link
                    </>
                  )}
                </button>
              </div>

              {/* Instant Simulator Button for Live Demonstration */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#1b6ef3] to-[#4285F4] hover:from-[#1558c7] hover:to-[#3367d6] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing UPI Transfer...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Simulate Scan & Pay {amount ? `₹${Number(amount).toLocaleString()}` : "₹500"}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
