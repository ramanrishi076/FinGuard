/**
 * FinGuard Socket.IO Real-Time Engine
 * Phase 6: Real-time fraud alerts, transaction notifications, and balance updates
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const redisManager = require("./redis");

let io = null;

const REDIS_EVENT_CHANNEL = "finguard:realtime_events";

/**
 * Initializes the Socket.IO server attached to HTTP server.
 *
 * @param {import("http").Server} httpServer
 * @returns {Server}
 */
const initSocket = (httpServer) => {
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: [allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const bearerToken =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;
      const token = socket.handshake.auth?.token || bearerToken;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { userId, email }
      next();
    } catch (err) {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  // Client Connection Handler
  io.on("connection", (socket) => {
    const userId = socket.user?.userId;
    console.log(`[Socket.IO] Client connected: socketId=${socket.id}, userId=${userId}`);

    // Automatically join the user's private room
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined private room 'user:${userId}'`);
    }

    // Client can join fraud alerts monitoring room (e.g. for dashboard live feed)
    socket.on("join_fraud_monitoring", () => {
      socket.join("fraud:monitoring");
      console.log(`[Socket.IO] Socket ${socket.id} joined 'fraud:monitoring' room`);
    });

    socket.on("leave_fraud_monitoring", () => {
      socket.leave("fraud:monitoring");
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: socketId=${socket.id}, reason=${reason}`);
    });
  });

  // Subscribe to Redis Pub/Sub for cross-instance or in-memory real-time broadcasts
  redisManager.subscribe(REDIS_EVENT_CHANNEL, (event) => {
    if (!io) return;

    const { type, payload, targetUser, room, broadcast } = event;

    if (targetUser) {
      io.to(`user:${targetUser}`).emit(type, payload);
    } else if (room) {
      io.to(room).emit(type, payload);
    } else if (broadcast) {
      io.emit(type, payload);
    }
  });

  return io;
};

/**
 * Returns current Socket.IO instance
 */
const getIO = () => {
  return io;
};

/**
 * Dispatches real-time event to a specific user
 */
const emitToUser = (userId, type, payload) => {
  redisManager.publish(REDIS_EVENT_CHANNEL, {
    targetUser: userId,
    type,
    payload,
  });
};

/**
 * Dispatches real-time event to a specific room
 */
const emitToRoom = (room, type, payload) => {
  redisManager.publish(REDIS_EVENT_CHANNEL, {
    room,
    type,
    payload,
  });
};

/**
 * Broadcasts a fraud alert both to the affected user and the fraud monitoring channel
 */
const notifyFraudAlert = ({
  userId,
  transactionId,
  amount,
  riskScore,
  decision,
  reasons,
  ruleScore,
  ml,
}) => {
  const alertPayload = {
    userId,
    transactionId,
    amount: amount.toString(),
    riskScore,
    decision,
    reasons,
    ruleScore,
    ml,
    timestamp: new Date().toISOString(),
  };

  // 1. Send direct to the affected user
  if (userId) {
    emitToUser(userId, "FRAUD_ALERT", alertPayload);
  }

  // 2. Broadcast to fraud monitoring room for live feeds
  emitToRoom("fraud:monitoring", "FRAUD_ALERT", alertPayload);
};

/**
 * Dispatches balance update to user's wallet
 */
const notifyBalanceUpdate = (userId, balance) => {
  emitToUser(userId, "BALANCE_UPDATED", {
    userId,
    balance: balance.toString(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Dispatches transaction creation notifications
 */
const notifyTransactionCreated = ({
  senderUserId,
  receiverUserId,
  transaction,
}) => {
  const payload = {
    transaction: {
      id: transaction.id,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
    },
    timestamp: new Date().toISOString(),
  };

  if (senderUserId) {
    emitToUser(senderUserId, "TRANSACTION_CREATED", {
      ...payload,
      role: "SENDER",
    });
  }

  if (receiverUserId) {
    emitToUser(receiverUserId, "TRANSACTION_CREATED", {
      ...payload,
      role: "RECEIVER",
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRoom,
  notifyFraudAlert,
  notifyBalanceUpdate,
  notifyTransactionCreated,
};
