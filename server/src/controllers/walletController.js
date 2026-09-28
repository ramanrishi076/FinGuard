const prisma = require("../lib/prisma");
const { calculateFraudRisk } = require("../services/fraudEngine");
const redisManager = require("../lib/redis");
const {
  notifyFraudAlert,
  notifyBalanceUpdate,
  notifyTransactionCreated,
} = require("../lib/socket");

const getWallet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `wallet:${userId}`;

    // Try Redis cache first
    const cachedWallet = await redisManager.get(cacheKey);
    if (cachedWallet) {
      try {
        return res.status(200).json({
          wallet: JSON.parse(cachedWallet),
        });
      } catch {}
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    const walletPayload = {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance.toString(),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    // Cache wallet for 60 seconds
    await redisManager.set(cacheKey, walletPayload, 60);

    return res.status(200).json({
      wallet: walletPayload,
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deposit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const depositAmount = BigInt(amount);

    if (depositAmount <= 0n) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: depositAmount,
          },
        },
      });

      const newTransaction = await tx.transaction.create({
        data: {
          receiverWalletId: wallet.id,
          amount: depositAmount,
          type: "DEPOSIT",
          status: "APPROVED",
          description: "Wallet deposit",
        },
      });

      return {
        wallet: updatedWallet,
        transaction: newTransaction,
      };
    });

    // Invalidate Redis cache for user's wallet
    await redisManager.del(`wallet:${userId}`);

    // Real-time notification: Balance update
    notifyBalanceUpdate(userId, transaction.wallet.balance);

    // Real-time notification: Transaction created
    notifyTransactionCreated({
      receiverUserId: userId,
      transaction: transaction.transaction,
    });

    return res.status(200).json({
      message: "Deposit successful",
      wallet: {
        id: transaction.wallet.id,
        balance: transaction.wallet.balance.toString(),
      },
      transaction: {
        id: transaction.transaction.id,
        amount: transaction.transaction.amount.toString(),
        type: transaction.transaction.type,
        status: transaction.transaction.status,
        description: transaction.transaction.description,
        createdAt: transaction.transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Deposit error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


const resolveReceiver = async (identifier) => {
  if (!identifier) return null;
  const raw = String(identifier).trim();

  // 1. If numeric user ID
  if (/^\d+$/.test(raw)) {
    const user = await prisma.user.findUnique({
      where: { id: Number(raw) },
      include: { wallet: true },
    });
    if (user) return user;
  }

  // 2. If UPI ID like alice@finguard or email alice@finguard.com
  const clean = raw.toLowerCase();
  const username = clean.replace(/@.*$/, "");
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: clean },
        { email: `${username}@finguard.com` },
        { email: { startsWith: username + "@" } },
        { name: { equals: raw, mode: "insensitive" } },
      ],
    },
    include: { wallet: true },
  });
  return user;
};

const lookupRecipient = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query || !query.trim()) {
      const suggestions = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        select: { id: true, name: true, email: true },
        take: 5,
        orderBy: { id: "asc" },
      });
      return res.status(200).json({
        recipients: suggestions.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          upiId: `${u.email.split("@")[0]}@finguard`,
        })),
      });
    }

    const clean = query.trim().toLowerCase();
    const isNum = /^\d+$/.test(clean);

    const matches = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          ...(isNum ? [{ id: Number(clean) }] : []),
          { name: { contains: clean, mode: "insensitive" } },
          { email: { contains: clean.replace(/@finguard.*$/, ""), mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 6,
    });

    return res.status(200).json({
      recipients: matches.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        upiId: `${u.email.split("@")[0]}@finguard`,
      })),
    });
  } catch (error) {
    console.error("Lookup recipient error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const transfer = async (req, res) => {
  try {
    const senderUserId = req.user.userId;
    const { receiverUserId, recipient, amount, description } = req.body;
    const targetIdentifier = recipient || receiverUserId;

    if (!targetIdentifier || !amount) {
      return res.status(400).json({
        message: "Recipient (UPI ID or User ID) and amount are required",
      });
    }

    const transferAmount = BigInt(amount);

    if (transferAmount <= 0n) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const receiverUser = await resolveReceiver(targetIdentifier);

    if (!receiverUser) {
      return res.status(404).json({
        message: `Recipient "${targetIdentifier}" not found. Please verify the UPI ID or User ID.`,
      });
    }

    if (receiverUser.id === senderUserId) {
      return res.status(400).json({
        message: "Self-transfer is not allowed",
      });
    }

    const senderWallet = await prisma.wallet.findUnique({
      where: {
        userId: senderUserId,
      },
    });

    if (!senderWallet) {
      return res.status(404).json({
        message: "Sender wallet not found",
      });
    }

    let receiverWallet = receiverUser.wallet;
    if (!receiverWallet) {
      receiverWallet = await prisma.wallet.findUnique({
        where: {
          userId: receiverUser.id,
        },
      });
    }

    if (!receiverWallet) {
      return res.status(404).json({
        message: "Receiver wallet not found",
      });
    }

    if (senderWallet.balance < transferAmount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    const balanceAfterTransaction =
  senderWallet.balance - transferAmount;

const recentTransactionCount = await prisma.transaction.count({
  where: {
    OR: [
      { senderWalletId: senderWallet.id },
      { receiverWalletId: senderWallet.id },
    ],
    createdAt: {
      gte: new Date(Date.now() - 10 * 60 * 1000),
    },
  },
});

const fraudResult = calculateFraudRisk({
  amount: transferAmount,
  recentTransactionCount,
  balanceAfterTransaction,
  balanceBefore: senderWallet.balance,
});

if (fraudResult.decision === "BLOCKED") {
  const blockedTransaction = await prisma.transaction.create({
    data: {
      senderWalletId: senderWallet.id,
      receiverWalletId: receiverWallet.id,
      amount: transferAmount,
      type: "TRANSFER",
      status: "BLOCKED",
      description: description || "Blocked wallet transfer",
    },
  });

  // Real-time alert: notify sender and broadcast to fraud monitoring room
  notifyFraudAlert({
    userId: senderUserId,
    transactionId: blockedTransaction.id,
    amount: transferAmount,
    riskScore: fraudResult.riskScore,
    decision: fraudResult.decision,
    reasons: fraudResult.reasons,
    ruleScore: fraudResult.ruleScore,
    ml: fraudResult.ml,
  });

  return res.status(403).json({
    message: "Transaction blocked due to fraud risk",
    transaction: {
      id: blockedTransaction.id,
      amount: blockedTransaction.amount.toString(),
      type: blockedTransaction.type,
      status: blockedTransaction.status,
      description: blockedTransaction.description,
      createdAt: blockedTransaction.createdAt,
    },
    fraud: {
      riskScore: fraudResult.riskScore,
      decision: fraudResult.decision,
      reasons: fraudResult.reasons,
      ruleScore: fraudResult.ruleScore,
      ml: fraudResult.ml,
    },
  });
}

    const result = await prisma.$transaction(async (tx) => {
      const updatedSenderWallet = await tx.wallet.update({
        where: {
          id: senderWallet.id,
        },
        data: {
          balance: {
            decrement: transferAmount,
          },
        },
      });

      const updatedReceiverWallet = await tx.wallet.update({
        where: {
          id: receiverWallet.id,
        },
        data: {
          balance: {
            increment: transferAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          amount: transferAmount,
          type: "TRANSFER",
          status: fraudResult.decision,
          description: description || "Wallet transfer",
        },
      });

      return {
        senderWallet: updatedSenderWallet,
        receiverWallet: updatedReceiverWallet,
        transaction,
      };
    });

    // Invalidate Redis caches for both wallets
    await redisManager.del(`wallet:${senderUserId}`);
    await redisManager.del(`wallet:${receiverUser.id}`);

    // Real-time notifications: Balance updates
    notifyBalanceUpdate(senderUserId, result.senderWallet.balance);
    notifyBalanceUpdate(receiverUser.id, result.receiverWallet.balance);

    // Real-time notifications: Transaction created
    notifyTransactionCreated({
      senderUserId,
      receiverUserId: receiverUser.id,
      transaction: result.transaction,
    });

    // If FLAGGED or REVIEW, broadcast fraud alert to user and monitoring room
    if (fraudResult.decision === "FLAGGED" || fraudResult.decision === "REVIEW") {
      notifyFraudAlert({
        userId: senderUserId,
        transactionId: result.transaction.id,
        amount: transferAmount,
        riskScore: fraudResult.riskScore,
        decision: fraudResult.decision,
        reasons: fraudResult.reasons,
        ruleScore: fraudResult.ruleScore,
        ml: fraudResult.ml,
      });
    }

    return res.status(200).json({
      message: "Transfer successful",
      recipient: {
        id: receiverUser.id,
        name: receiverUser.name,
        email: receiverUser.email,
        upiId: `${receiverUser.email.split("@")[0]}@finguard`,
      },
      senderWallet: {
        id: result.senderWallet.id,
        balance: result.senderWallet.balance.toString(),
      },
      receiverWallet: {
        id: result.receiverWallet.id,
        balance: result.receiverWallet.balance.toString(),
      },
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount.toString(),
        type: result.transaction.type,
        status: result.transaction.status,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt,
      },
      fraud: {
        riskScore: fraudResult.riskScore,
        decision: fraudResult.decision,
        reasons: fraudResult.reasons,
        ruleScore: fraudResult.ruleScore,
        ml: fraudResult.ml,
      },
    });
  } catch (error) {
    console.error("Transfer error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const withdraw = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const withdrawalAmount = BigInt(amount);

    if (withdrawalAmount <= 0n) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    if (wallet.balance < withdrawalAmount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            decrement: withdrawalAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          senderWalletId: wallet.id,
          amount: withdrawalAmount,
          type: "WITHDRAWAL",
          status: "APPROVED",
          description: "Wallet withdrawal",
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });

    // Invalidate Redis cache for user's wallet
    await redisManager.del(`wallet:${userId}`);

    // Real-time notification: Balance update
    notifyBalanceUpdate(userId, result.wallet.balance);

    // Real-time notification: Transaction created
    notifyTransactionCreated({
      senderUserId: userId,
      transaction: result.transaction,
    });

    return res.status(200).json({
      message: "Withdrawal successful",
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance.toString(),
      },
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount.toString(),
        type: result.transaction.type,
        status: result.transaction.status,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getWallet,
  deposit,
  transfer,
  withdraw,
  lookupRecipient,
};