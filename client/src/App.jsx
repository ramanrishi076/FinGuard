import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { walletService, transactionService, systemService } from "./services/api";
import { Navbar } from "./components/Navbar";
import { FraudAlertToast } from "./components/FraudAlertToast";
import { AuthView } from "./views/AuthView";
import { DashboardView } from "./views/DashboardView";
import { WalletView } from "./views/WalletView";
import { TransactionsView } from "./views/TransactionsView";
import { AnalyticsView } from "./views/AnalyticsView";
import { DepositModal } from "./components/modals/DepositModal";
import { WithdrawModal } from "./components/modals/WithdrawModal";
import { TransferModal } from "./components/modals/TransferModal";
import { TransactionDetailModal } from "./components/modals/TransactionDetailModal";
import { Shield, Radio, Database, Cpu, Loader2 } from "lucide-react";

const MainApp = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { addBalanceListener, addTransactionListener } = useSocket();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      const [walletData, txData, statusData] = await Promise.all([
        walletService.getWallet().catch(() => null),
        transactionService.getTransactions().catch(() => []),
        systemService.getRealtimeStatus().catch(() => null),
      ]);

      if (walletData) setWallet(walletData);
      if (txData) setTransactions(txData);
      if (statusData) setSystemStatus(statusData);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Balance update listener
    const unbindBalance = addBalanceListener((balancePayload) => {
      console.log("[RealTime] Balance update received:", balancePayload);
      setWallet((prev) => (prev ? { ...prev, balance: balancePayload.balance } : prev));
    });

    // 2. Transaction created listener
    const unbindTx = addTransactionListener((txPayload) => {
      console.log("[RealTime] Transaction created event received:", txPayload);
      setTransactions((prev) => [txPayload.transaction, ...prev]);
    });

    return () => {
      unbindBalance();
      unbindTx();
    };
  }, [isAuthenticated, addBalanceListener, addTransactionListener]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Real-time Notification Banner */}
      <FraudAlertToast />

      {/* Main Top Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === "dashboard" && (
          <DashboardView
            wallet={wallet}
            transactions={transactions}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "wallet" && (
          <WalletView
            wallet={wallet}
            transactions={transactions}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onRefresh={fetchData}
          />
        )}

        {currentTab === "transactions" && (
          <TransactionsView
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onRefresh={fetchData}
            loading={dataLoading}
          />
        )}

        {currentTab === "analytics" && (
          <AnalyticsView transactions={transactions} />
        )}
      </main>

      {/* Bottom Telemetry Footer */}
      <footer className="w-full glass-panel border-t border-slate-800/80 py-4 bg-slate-950/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-400">FinGuard AI Digital Wallet</span>
            <span>•</span>
            <span>Phase 7 Desktop UI</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>ML Model: Logistic Regression (100k txs)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Redis Status: {systemStatus?.redis?.status || "Active Fallback"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Socket.IO Engine: Connected</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={() => fetchData()}
        currentBalance={wallet?.balance}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={() => fetchData()}
        currentBalance={wallet?.balance}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={() => fetchData()}
        currentBalance={wallet?.balance}
        currentUserId={user?.id}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}