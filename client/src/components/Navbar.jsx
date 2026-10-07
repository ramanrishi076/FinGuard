import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldAlert,
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Bell,
  LogOut,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Sun,
  Moon,
  QrCode,
  KeyRound,
  Building2,
} from "lucide-react";

export const Navbar = ({ currentTab, setCurrentTab, onOpenReceiveQr, onOpenManagePin }) => {
  const { user, logout } = useAuth();
  const { isConnected, alerts, unreadAlertsCount, markAllAlertsRead, dismissAlert } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const alertsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setShowAlertsDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = () => {
    markAllAlertsRead();
    setShowAlertsDropdown(false);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "wallet", label: "Wallet & Transfer", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "analytics", label: "Fraud & Analytics", icon: BarChart3 },
    { id: "compliance", label: "Compliance Hub", icon: ShieldAlert },
  ];

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "BLOCKED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case "FLAGGED":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> FLAGGED
          </span>
        );
      case "REVIEW":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Google Pay Inspired */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-2 flex items-center justify-center shadow-md relative group">
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC04]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
              </div>
              <ShieldAlert className="w-5 h-5 text-[#4285F4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                  Fin<span className="text-[#4285F4]">Guard</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1b6ef3]/20 text-[var(--gpay-blue-muted)] border border-[#1b6ef3]/30">
                  Pay
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] hidden sm:block font-medium">
                Google Pay Theme • AI Fraud Shield
              </p>
            </div>
          </div>

          {/* Navigation Links - Material 3 Rounded Pills */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-[var(--surface-dim)] p-1 rounded-full border border-[var(--border-nav)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[var(--nav-active-bg)] text-[var(--gpay-blue-muted)] shadow-sm border border-[var(--border-nav-active)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--nav-inactive-hover)]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--gpay-blue-muted)]" : "text-[var(--text-tertiary)]"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Receive QR Button */}
            {onOpenReceiveQr && (
              <button
                onClick={onOpenReceiveQr}
                className="p-2.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] transition-all cursor-pointer"
                title="Receive Money / My QR Code"
              >
                <QrCode className="w-4 h-4 text-[var(--gpay-blue-light)]" />
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] transition-all cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Live Real-time Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                  : "bg-rose-950/40 text-rose-400 border-rose-800/40"
              }`}
              title={isConnected ? "Real-time Socket.IO connected" : "Connecting to Socket.IO..."}
            >
              <Radio className={`w-3 h-3 ${isConnected ? "animate-pulse text-emerald-400" : "text-rose-400"}`} />
              <span>{isConnected ? "Live Online" : "Offline"}</span>
            </div>

            {/* Fraud Alerts Notification Bell */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => {
                  setShowAlertsDropdown(!showAlertsDropdown);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] transition-colors cursor-pointer"
                title="Security & Fraud Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#EA4335] text-[10px] font-bold text-white shadow-sm shadow-rose-500/50">
                    {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Panel */}
              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-strong)]">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#4285F4]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Fraud Risk Alerts</span>
                    </div>
                    {alerts.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[var(--gpay-blue-muted)] hover:underline font-semibold cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-strong)]/60 mt-2">
                    {alerts.length === 0 ? (
                      <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                        No active security or fraud alerts. All systems normal.
                      </div>
                    ) : (
                      alerts.slice(0, 10).map((alert) => (
                        <div key={alert.id} className="py-2.5 px-1 hover:bg-[var(--surface)]/80 rounded-xl transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">
                              Amount: ₹{Number(alert.amount).toLocaleString()}
                            </span>
                            {getDecisionBadge(alert.decision)}
                          </div>
                          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-1">
                            Risk Score: <strong className="text-[var(--text-secondary)]">{alert.riskScore}/100</strong>
                            {alert.reasons?.length > 0 && ` • ${alert.reasons.join(", ")}`}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            <span>{new Date(alert.receivedAt || alert.timestamp).toLocaleTimeString()}</span>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="text-[var(--text-tertiary)] hover:text-[#EA4335] transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Google Profile Circular Avatar & Account Popover */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowAlertsDropdown(false);
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#8ab4f8] p-0.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                title={user?.name || "Account"}
              >
                <div className="w-full h-full rounded-full bg-[#1b6ef3] flex items-center justify-center text-sm font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              </button>

              {/* Profile Dropdown - Google Pay Account Card */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-strong)]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1b6ef3] to-[#8ab4f8] p-0.5 shrink-0">
                      <div className="w-full h-full rounded-full bg-[#1b6ef3] flex items-center justify-center text-lg font-bold text-white">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-[var(--gpay-blue-muted)] bg-[#1b6ef3]/20 px-2 py-0.5 rounded-full border border-[#1b6ef3]/30">
                        {user?.email ? `${user.email.split("@")[0]}@finguard` : "demo@finguard"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setCurrentTab("wallet");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#4285F4]" />
                      Linked Bank Accounts
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenManagePin) onOpenManagePin();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[var(--gpay-blue-muted)] hover:bg-[#1b6ef3]/15 border border-[#1b6ef3]/30 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Set / Manage Transaction PIN
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#f28b82] hover:bg-[#EA4335]/15 border border-[#EA4335]/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out of FinGuard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-[var(--border-nav)] gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[var(--nav-active-bg)] text-[var(--gpay-blue-muted)] border border-[var(--border-nav-active)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--nav-inactive-hover)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
