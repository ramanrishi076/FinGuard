import React, { useState, useEffect, useRef } from "react";
import { pinService } from "../../services/api";
import {
  ShieldCheck,
  Lock,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Keyboard,
} from "lucide-react";

export const TransactionPinModal = ({
  isOpen,
  onClose,
  onSuccess,
  isSettingPin = false,
  title = "Enter Transaction PIN",
  description = "Please enter your 6-digit PIN to authorize this high-value transaction.",
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [mode, setMode] = useState(isSettingPin ? "SETUP" : "VERIFY"); // "VERIFY" | "SETUP" | "FORGOT"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Forgot / Reset PIN state
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setConfirmPin("");
      setAccountPassword("");
      setResetNewPin("");
      setResetConfirmPin("");
      setError(null);
      setSuccessMsg(null);

      if (isSettingPin) {
        setMode("SETUP");
      } else {
        // Automatically check if PIN has been configured
        pinService
          .getPinStatus()
          .then((status) => {
            if (!status?.hasPin) {
              setMode("SETUP");
            } else {
              setMode("VERIFY");
            }
          })
          .catch(() => {
            setMode("VERIFY");
          });
      }
    }
  }, [isOpen, isSettingPin]);

  // Keyboard typing support for physical keyboards & numpads
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept typing when user is focused inside input elements (such as in FORGOT mode)
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (mode === "FORGOT") return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "VERIFY" && pin.length === 6) {
          handleVerify(pin);
        } else if (mode === "SETUP" && pin.length === 6 && confirmPin.length === 6) {
          handleSetup();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, mode, pin, confirmPin, loading]);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (loading) return;
    setError(null);

    if (mode === "SETUP" && pin.length === 6) {
      if (confirmPin.length < 6) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
      }
    } else if (mode === "SETUP") {
      if (pin.length < 6) {
        setPin((prev) => prev + num);
      }
    } else {
      if (pin.length < 6) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 6) {
          setTimeout(() => handleVerify(nextPin), 150);
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setError(null);
    if (mode === "SETUP" && confirmPin.length > 0) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (loading) return;
    setError(null);
    setPin("");
    setConfirmPin("");
  };

  const handleVerify = async (pinToVerify = pin) => {
    if (pinToVerify.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await pinService.verifyPin(pinToVerify);
      if (res.valid) {
        setSuccessMsg("PIN verified successfully");
        setTimeout(() => {
          if (onSuccess) onSuccess(pinToVerify);
          onClose();
        }, 350);
      } else {
        setError(res.message || "Invalid PIN");
        setPin("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid 6-digit PIN. Please try again or use Forgot PIN.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }
    if (confirmPin.length !== 6) {
      setError("Please confirm your 6-digit PIN");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match. Please re-enter.");
      setConfirmPin("");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await pinService.setPin(pin);
      setSuccessMsg("6-Digit Transaction PIN set successfully!");
      setTimeout(() => {
        if (onSuccess) onSuccess(pin);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    if (!accountPassword) {
      setError("Please enter your account password");
      return;
    }
    if (!/^\d{6}$/.test(resetNewPin)) {
      setError("New PIN must be exactly 6 digits");
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      setError("New PIN and Confirm PIN do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await pinService.resetPin(accountPassword, resetNewPin);
      setSuccessMsg("PIN reset successfully! You can now use your new PIN.");
      setTimeout(() => {
        if (onSuccess) onSuccess(resetNewPin);
        onClose();
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset PIN. Check your account password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center mb-3">
            {mode === "FORGOT" ? (
              <Lock className="w-6 h-6 text-[#EA4335]" />
            ) : mode === "SETUP" ? (
              <KeyRound className="w-6 h-6 text-[#4285F4]" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#4285F4]" />
            )}
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {mode === "FORGOT"
              ? "Reset Transaction PIN"
              : mode === "SETUP"
              ? "Setup Transaction PIN"
              : title}
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs">
            {mode === "FORGOT"
              ? "Verify your account password to create a new 6-digit PIN."
              : mode === "SETUP"
              ? pin.length === 6
                ? "Re-enter your 6-digit PIN to confirm"
                : "Choose a 6-digit PIN to secure transfers"
              : description}
          </p>
        </div>

        {/* Global Error & Success Alerts */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center flex items-center justify-center gap-1.5 animate-in shake">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: FORGOT / RESET PIN FORM */}
        {mode === "FORGOT" ? (
          <form onSubmit={handleResetPinSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Account Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter login password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#4285F4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                New 6-Digit PIN:
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={resetNewPin}
                onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digits (e.g. 123456)"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--border)] text-xs font-mono tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[#4285F4]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Confirm New PIN:
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={resetConfirmPin}
                onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Re-enter 6 digits"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--border)] text-xs font-mono tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[#4285F4]"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading || !accountPassword || resetNewPin.length !== 6 || resetConfirmPin.length !== 6}
                className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1557b0] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verify & Reset PIN
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("VERIFY");
                  setError(null);
                }}
                className="w-full py-2 text-center text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to PIN verification
              </button>
            </div>
          </form>
        ) : (
          /* MODE: VERIFY & SETUP (With keyboard typing + numeric buttons) */
          <>
            {/* PIN Indicators */}
            <div className="mb-5">
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const currentVal = mode === "SETUP" && pin.length === 6 ? confirmPin : pin;
                  const isFilled = idx < currentVal.length;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        isFilled
                          ? "bg-[#4285F4] scale-110 shadow-sm shadow-[#4285F4]/50"
                          : "border-2 border-[var(--border-strong)] bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Keyboard Helper Tag */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                <Keyboard className="w-3 h-3 text-[#4285F4]" />
                <span>Type directly using keyboard, numpad, or keypad below</span>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(String(num))}
                  disabled={loading}
                  className="h-11 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--border-nav)] border border-[var(--border)] text-base font-semibold text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="h-11 rounded-2xl bg-[var(--surface-dim)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text-tertiary)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                disabled={loading}
                className="h-11 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--border-nav)] border border-[var(--border)] text-base font-semibold text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="h-11 rounded-2xl bg-[var(--surface-dim)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text-tertiary)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Del
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-4">
              {mode === "SETUP" ? (
                <button
                  onClick={handleSetup}
                  disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                  className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1557b0] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save & Authorize
                </button>
              ) : (
                <button
                  onClick={() => handleVerify(pin)}
                  disabled={loading || pin.length !== 6}
                  className="w-full py-3 rounded-full bg-[#1b6ef3] hover:bg-[#1557b0] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm PIN
                </button>
              )}

              {mode === "VERIFY" && (
                <div className="flex items-center justify-between px-2 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("FORGOT");
                      setError(null);
                    }}
                    className="text-[#EA4335] hover:underline cursor-pointer font-medium"
                  >
                    Forgot PIN?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("SETUP");
                      setPin("");
                      setConfirmPin("");
                      setError(null);
                    }}
                    className="text-[var(--gpay-blue-muted)] hover:underline cursor-pointer font-medium"
                  >
                    Change PIN
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
