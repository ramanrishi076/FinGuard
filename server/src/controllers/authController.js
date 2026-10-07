const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const {
  generateRefreshToken,
  hashToken,
  generateAccessToken,
} = require("../utils/tokens");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   const user = await prisma.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    wallet: {
      create: {},
    },
  },
});

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Short-lived access token
    const accessToken = generateAccessToken(user);

    // Long-lived refresh token
    const refreshToken = generateRefreshToken();

    // Store only the hash in the database
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date(
      Date.now() +
        Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) *
          24 *
          60 *
          60 *
          1000
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "USER",
        hasPin: Boolean(user.transactionPin),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
      });
    }

    const tokenHash = hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    if (session.revokedAt) {
      return res.status(401).json({
        message: "Refresh token has been revoked",
      });
    }

    if (session.expiresAt <= new Date()) {
      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    // Revoke the old refresh-token session
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken(session.user);
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date(
      Date.now() +
        Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) *
          24 *
          60 *
          60 *
          1000
    );

    await prisma.session.create({
      data: {
        userId: session.user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token required",
      });
    }

    const tokenHash = hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.revokedAt) {
      return res.status(400).json({
        message: "Session already revoked",
      });
    }

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const setTransactionPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pin } = req.body;

    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({
        message: "Transaction PIN must be a 6-digit number",
      });
    }

    const hashedPin = await bcrypt.hash(String(pin), 10);
    await prisma.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin },
    });

    return res.status(200).json({
      message: "Transaction PIN configured successfully",
      hasPin: true,
    });
  } catch (error) {
    console.error("Set PIN error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTransactionPinStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true, role: true },
    });

    return res.status(200).json({
      hasPin: Boolean(user?.transactionPin),
      role: user?.role || "USER",
    });
  } catch (error) {
    console.error("Get PIN status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyTransactionPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: "PIN is required", valid: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true },
    });

    if (!user || !user.transactionPin) {
      return res.status(400).json({
        message: "No transaction PIN set for this account. Please set a 6-digit PIN in settings.",
        valid: false,
      });
    }

    const isValid = await bcrypt.compare(String(pin), user.transactionPin);
    if (!isValid) {
      return res.status(401).json({
        message: "Incorrect 6-digit Transaction PIN",
        valid: false,
      });
    }

    return res.status(200).json({
      message: "PIN verified",
      valid: true,
    });
  } catch (error) {
    console.error("Verify PIN error:", error);
    return res.status(500).json({ message: "Server error", valid: false });
  }
};

const resetTransactionPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password, newPin } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Account password is required to verify your identity" });
    }

    if (!newPin || !/^\d{6}$/.test(String(newPin))) {
      return res.status(400).json({ message: "New Transaction PIN must be a 6-digit number" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect account password. Verification failed." });
    }

    const hashedPin = await bcrypt.hash(String(newPin), 10);
    await prisma.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin },
    });

    return res.status(200).json({
      message: "Transaction PIN reset successfully. You can now authorize transfers with your new PIN.",
      hasPin: true,
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  setTransactionPin,
  getTransactionPinStatus,
  verifyTransactionPin,
  resetTransactionPin,
};