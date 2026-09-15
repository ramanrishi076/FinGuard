const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const authenticateToken = require("./middleware/authMiddleware");
const transactionRoutes = require("./routes/transactionRoutes");


const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "FinGuard API is running!",
  });
});

// Frontend-backend connection test
app.get("/api/test", (req, res) => {
  res.json({
    message: "Connection between frontend and backend successful!",
  });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      message: "Database connection successful!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed!",
    });
  }
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);

module.exports = app;