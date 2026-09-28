import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const socketRef = useRef(null);

  // Callbacks registry
  const balanceListeners = useRef(new Set());
  const transactionListeners = useRef(new Set());
  const fraudListeners = useRef(new Set());

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[Socket.IO] Connected to FinGuard real-time server:", socket.id);
      socket.emit("join_fraud_monitoring");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[Socket.IO] Disconnected from real-time server");
    });

    socket.on("BALANCE_UPDATED", (data) => {
      setLiveEvents((prev) => [
        {
          id: `bal-${Date.now()}-${Math.random()}`,
          type: "BALANCE_UPDATED",
          title: "Wallet Balance Updated",
          data,
          time: new Date(),
        },
        ...prev.slice(0, 49),
      ]);
      balanceListeners.current.forEach((fn) => fn(data));
    });

    socket.on("TRANSACTION_CREATED", (data) => {
      setLiveEvents((prev) => [
        {
          id: `tx-${Date.now()}-${Math.random()}`,
          type: "TRANSACTION_CREATED",
          title: `Transaction ${data.transaction.status}`,
          data,
          time: new Date(),
        },
        ...prev.slice(0, 49),
      ]);
      transactionListeners.current.forEach((fn) => fn(data));
    });

    socket.on("FRAUD_ALERT", (alertData) => {
      const newAlert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        ...alertData,
        read: false,
        receivedAt: new Date(),
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setLiveEvents((prev) => [
        {
          id: newAlert.id,
          type: "FRAUD_ALERT",
          title: `Fraud Risk Alert: ${alertData.decision}`,
          data: alertData,
          time: new Date(),
        },
        ...prev.slice(0, 49),
      ]);
      fraudListeners.current.forEach((fn) => fn(newAlert));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, accessToken]);

  const addBalanceListener = (fn) => {
    balanceListeners.current.add(fn);
    return () => balanceListeners.current.delete(fn);
  };

  const addTransactionListener = (fn) => {
    transactionListeners.current.add(fn);
    return () => transactionListeners.current.delete(fn);
  };

  const addFraudListener = (fn) => {
    fraudListeners.current.add(fn);
    return () => fraudListeners.current.delete(fn);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        alerts,
        unreadAlertsCount: alerts.filter((a) => !a.read).length,
        liveEvents,
        dismissAlert,
        markAllAlertsRead,
        clearAlerts,
        addBalanceListener,
        addTransactionListener,
        addFraudListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
