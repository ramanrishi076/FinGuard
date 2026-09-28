import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
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
} from "lucide-react";

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { isConnected, alerts, unreadAlertsCount, markAllAlertsRead, dismissAlert } = useSocket();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "wallet", label: "Wallet & Transfer", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "analytics", label: "Fraud & Analytics", icon: BarChart3 },
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FinGuard
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI Shield
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Secure Digital Wallet
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Live Real-time Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                  : "bg-rose-950/40 text-rose-400 border-rose-800/40"
              }`}
              title={isConnected ? "Real-time Socket.IO connected" : "Connecting to Socket.IO..."}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "animate-pulse text-emerald-400" : "text-rose-400"}`} />
              <span>{isConnected ? "Live Online" : "Connecting..."}</span>
            </div>

            {/* Fraud Alerts Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAlertsDropdown(!showAlertsDropdown);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                title="Security & Fraud Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50 animate-pulse">
                    {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Panel */}
              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel-elevated bg-slate-900/95 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-white">Fraud Risk Alerts</span>
                    </div>
                    {alerts.length > 0 && (
                      <button
                        onClick={markAllAlertsRead}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50 mt-2">
                    {alerts.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No active security or fraud alerts. All systems normal.
                      </div>
                    ) : (
                      alerts.slice(0, 10).map((alert) => (
                        <div key={alert.id} className="py-2.5 px-1 hover:bg-slate-800/30 rounded-lg transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-200">
                              Amount: ₹{Number(alert.amount).toLocaleString()}
                            </span>
                            {getDecisionBadge(alert.decision)}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                            Risk Score: <strong className="text-slate-200">{alert.riskScore}/100</strong>
                            {alert.reasons?.length > 0 && ` • ${alert.reasons.join(", ")}`}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{new Date(alert.receivedAt || alert.timestamp).toLocaleTimeString()}</span>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="text-slate-400 hover:text-rose-400 transition-colors"
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

            {/* User Profile & Logout */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowAlertsDropdown(false);
                }}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800/80 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user?.name || "User"}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">
                    ID #{user?.id}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel-elevated bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-800/60 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700/60"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
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
