const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const { calculateFraudRisk } = require("../services/fraudEngine");
const redisManager = require("../lib/redis");
const {
  checkIdempotency,
  saveIdempotency,
  clearIdempotency,
} = require("../lib/idempotency");
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
  const userId = req.user.userId;
  const idempotencyKey = req.headers["x-idempotency-key"] || req.headers["idempotency-key"];

  try {
    if (idempotencyKey) {
      const idem = await checkIdempotency(idempotencyKey, userId);
      if (idem.isDuplicate) {
        return res.status(200).json({ ...idem.response, _idempotent: true });
      }
      if (idem.inProgress) {
        return res.status(409).json({ message: "Deposit is already processing" });
      }
    }

    const { amount, pin } = req.body;

    if (!amount) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const depositAmount = BigInt(amount);

    if (depositAmount <= 0n) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true },
    });

    if (userRecord?.transactionPin) {
      if (!pin) {
        if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
        return res.status(403).json({
          requiresPin: true,
          hasPin: true,
          message: "Transaction PIN is required to complete this deposit.",
        });
      }

      const isPinValid = await bcrypt.compare(String(pin), userRecord.transactionPin);
      if (!isPinValid) {
        if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
        return res.status(401).json({
          requiresPin: true,
          hasPin: true,
          message: "Incorrect 6-digit Transaction PIN. Deposit aborted.",
        });
      }
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
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
          description: req.body.description?.trim() || "Wallet deposit",
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

    const responsePayload = {
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
    };

    if (idempotencyKey) {
      await saveIdempotency(idempotencyKey, userId, responsePayload);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (idempotencyKey) await clearIdempotency(idempotencyKey, userId);
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

  // 2. If UPI ID like oliver@okicici, alice@finguard or email alice@finguard.com
  const clean = raw.toLowerCase();
  const username = clean.replace(/@.*$/, "");
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: clean, mode: "insensitive" } },
        { email: { equals: `${username}@finguard.com`, mode: "insensitive" } },
        { email: { equals: `${clean}@finguard.com`, mode: "insensitive" } },
        { email: { startsWith: username + "@", mode: "insensitive" } },
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

    const formatUpi = (email) => {
      if (email.includes("@") && !email.endsWith("@finguard.com")) {
        return email;
      }
      return `${email.split("@")[0]}@finguard`;
    };

    if (!query || !query.trim()) {
      const suggestions = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        select: { id: true, name: true, email: true },
        take: 12,
        orderBy: { id: "desc" },
      });
      return res.status(200).json({
        recipients: suggestions.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          upiId: formatUpi(u.email),
        })),
      });
    }

    const clean = query.trim().toLowerCase();
    const cleanUsername = clean.replace(/@.*$/, "");
    const isNum = /^\d+$/.test(clean);

    const matches = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          ...(isNum ? [{ id: Number(clean) }] : []),
          { name: { contains: clean, mode: "insensitive" } },
          { email: { contains: clean, mode: "insensitive" } },
          { email: { contains: cleanUsername, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    return res.status(200).json({
      recipients: matches.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        upiId: formatUpi(u.email),
      })),
    });
  } catch (error) {
    console.error("Lookup recipient error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const addRecipient = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    let { name, upiId, email, initialBalance } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Recipient name is required" });
    }

    const trimmedName = name.trim();
    let rawUpi = (upiId || email || "").trim();

    if (!rawUpi) {
      const cleanName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "");
      rawUpi = `${cleanName || "user"}@finguard`;
    }

    let targetUpi = rawUpi.toLowerCase();
    if (!targetUpi.includes("@")) {
      targetUpi = `${targetUpi}@finguard`;
    }

    const formatUpi = (em) => {
      if (em.includes("@") && !em.endsWith("@finguard.com")) {
        return em;
      }
      return `${em.split("@")[0]}@finguard`;
    };

    let targetEmail = targetUpi;

    // Check if user already exists
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: targetEmail, mode: "insensitive" } },
          { email: { equals: targetUpi, mode: "insensitive" } },
          { email: { equals: `${targetUpi.split("@")[0]}@finguard.com`, mode: "insensitive" } },
          { name: { equals: trimmedName, mode: "insensitive" } },
        ],
      },
      include: { wallet: true },
    });

    if (existingUser) {
      if (existingUser.id === currentUserId) {
        return res.status(400).json({ message: "You cannot add yourself as a recipient" });
      }

      if (!existingUser.wallet) {
        await prisma.wallet.create({
          data: {
            userId: existingUser.id,
            balance: 50000n,
          },
        });
      }

      return res.status(200).json({
        message: "Recipient is available for payments",
        recipient: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          upiId: formatUpi(existingUser.email),
        },
      });
    }

    // Check for email conflict
    const emailConflict = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (emailConflict) {
      targetEmail = `${targetUpi.split("@")[0]}.${Date.now()}@${targetUpi.split("@")[1] || "finguard"}`;
    }

    const defaultPassword = await bcrypt.hash("Recipient@123", 10);
    const startingBalance = initialBalance ? BigInt(initialBalance) : 50000n;

    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: targetEmail,
        password: defaultPassword,
        wallet: {
          create: {
            balance: startingBalance,
          },
        },
      },
      include: { wallet: true },
    });

    return res.status(201).json({
      message: `Recipient "${trimmedName}" added successfully`,
      recipient: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        upiId: targetUpi,
      },
    });
  } catch (error) {
    console.error("Add recipient error:", error);
    return res.status(500).json({ message: error.message || "Failed to add recipient" });
  }
};

const updateRecipient = async (req, res) => {
  try {
    const recipientId = Number(req.params.id);
    const currentUserId = req.user.userId;
    let { name, upiId } = req.body;

    if (!recipientId || isNaN(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID" });
    }

    if (recipientId === currentUserId) {
      return res.status(400).json({ message: "Cannot edit your own account as a recipient" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (upiId && upiId.trim()) {
      let targetUpi = upiId.trim().toLowerCase();
      if (!targetUpi.includes("@")) {
        targetUpi = `${targetUpi}@finguard`;
      }

      const conflict = await prisma.user.findFirst({
        where: {
          email: { equals: targetUpi, mode: "insensitive" },
          id: { not: recipientId },
        },
      });

      if (conflict) {
        return res.status(400).json({
          message: `UPI ID "${targetUpi}" is already used by another contact (${conflict.name})`,
        });
      }

      updateData.email = targetUpi;
    }

    const updatedUser = await prisma.user.update({
      where: { id: recipientId },
      data: updateData,
    });

    const formatUpi = (em) => {
      if (em.includes("@") && !em.endsWith("@finguard.com")) {
        return em;
      }
      return `${em.split("@")[0]}@finguard`;
    };

    return res.status(200).json({
      message: `Recipient "${updatedUser.name}" updated successfully`,
      recipient: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        upiId: formatUpi(updatedUser.email),
      },
    });
  } catch (error) {
    console.error("Update recipient error:", error);
    return res.status(500).json({ message: error.message || "Failed to update recipient" });
  }
};

const deleteRecipient = async (req, res) => {
  try {
    const recipientId = Number(req.params.id);
    const currentUserId = req.user.userId;

    if (!recipientId || isNaN(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID" });
    }

    if (recipientId === currentUserId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { wallet: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (targetUser.wallet) {
      await prisma.transaction.updateMany({
        where: {
          OR: [
            { senderWalletId: targetUser.wallet.id },
            { receiverWalletId: targetUser.wallet.id },
          ],
        },
        data: {
          senderWalletId: null,
          receiverWalletId: null,
        },
      });

      await prisma.wallet.delete({
        where: { id: targetUser.wallet.id },
      });
    }

    await prisma.session.deleteMany({
      where: { userId: recipientId },
    });

    await prisma.user.delete({
      where: { id: recipientId },
    });

    return res.status(200).json({
      message: `Recipient "${targetUser.name}" deleted successfully`,
      deletedId: recipientId,
    });
  } catch (error) {
    console.error("Delete recipient error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete recipient" });
  }
};

const transfer = async (req, res) => {
  const senderUserId = req.user.userId;
  const idempotencyKey = req.headers["x-idempotency-key"] || req.headers["idempotency-key"];

  try {
    if (idempotencyKey) {
      const idem = await checkIdempotency(idempotencyKey, senderUserId);
      if (idem.isDuplicate) {
        return res.status(200).json({ ...idem.response, _idempotent: true });
      }
      if (idem.inProgress) {
        return res.status(409).json({ message: "Transfer is already processing. Please wait." });
      }
    }

    const { receiverUserId, recipient, amount, description, pin } = req.body;
    const targetIdentifier = recipient || receiverUserId;

    if (!targetIdentifier || !amount) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(400).json({
        message: "Recipient (UPI ID or User ID) and amount are required",
      });
    }

    const transferAmount = BigInt(amount);

    if (transferAmount <= 0n) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const receiverUser = await resolveReceiver(targetIdentifier);

    if (!receiverUser) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(404).json({
        message: `Recipient "${targetIdentifier}" not found. Please verify the UPI ID or User ID.`,
      });
    }

    if (receiverUser.id === senderUserId) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
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
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
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
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(404).json({
        message: "Receiver wallet not found",
      });
    }

    if (senderWallet.balance < transferAmount) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      const shortfall = transferAmount - senderWallet.balance;
      return res.status(400).json({
        message: `Insufficient balance in account. Available balance is ₹${senderWallet.balance.toString()}, but requested transfer is ₹${transferAmount.toString()} (shortfall: ₹${shortfall.toString()}).`,
        availableBalance: senderWallet.balance.toString(),
        requestedAmount: transferAmount.toString(),
        shortfall: shortfall.toString(),
      });
    }

    // Mandatory Transaction PIN Verification for Every Transaction
    const senderUserRecord = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { transactionPin: true },
    });

    if (!senderUserRecord?.transactionPin) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(403).json({
        requiresPin: true,
        hasPin: false,
        message: "A 6-digit Transaction PIN is required for all transfers. Please set up your PIN to proceed.",
      });
    }

    if (!pin) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(403).json({
        requiresPin: true,
        hasPin: true,
        message: "Transaction PIN is required to complete this transfer.",
      });
    }

    const isPinValid = await bcrypt.compare(String(pin), senderUserRecord.transactionPin);
    if (!isPinValid) {
      if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
      return res.status(401).json({
        requiresPin: true,
        hasPin: true,
        message: "Incorrect 6-digit Transaction PIN. Transfer aborted.",
      });
    }

    const balanceAfterTransaction = senderWallet.balance - transferAmount;

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
          riskScore: fraudResult.riskScore,
          ruleScore: fraudResult.ruleScore,
          riskFactors: JSON.stringify(fraudResult.reasons || []),
          mlProbability: fraudResult.ml?.probability ?? null,
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

      const blockedResponse = {
        message: "Transaction blocked due to fraud risk",
        transaction: {
          id: blockedTransaction.id,
          amount: blockedTransaction.amount.toString(),
          type: blockedTransaction.type,
          status: blockedTransaction.status,
          description: blockedTransaction.description,
          riskScore: blockedTransaction.riskScore,
          ruleScore: blockedTransaction.ruleScore,
          riskFactors: fraudResult.reasons,
          mlProbability: blockedTransaction.mlProbability,
          createdAt: blockedTransaction.createdAt,
        },
        fraud: {
          riskScore: fraudResult.riskScore,
          decision: fraudResult.decision,
          reasons: fraudResult.reasons,
          ruleScore: fraudResult.ruleScore,
          ml: fraudResult.ml,
        },
      };

      if (idempotencyKey) {
        await saveIdempotency(idempotencyKey, senderUserId, blockedResponse);
      }

      return res.status(403).json(blockedResponse);
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
          riskScore: fraudResult.riskScore,
          ruleScore: fraudResult.ruleScore,
          riskFactors: JSON.stringify(fraudResult.reasons || []),
          mlProbability: fraudResult.ml?.probability ?? null,
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

    const responsePayload = {
      message: "Transfer successful",
      recipient: {
        id: receiverUser.id,
        name: receiverUser.name,
        email: receiverUser.email,
        upiId: receiverUser.email.includes("@") && !receiverUser.email.endsWith("@finguard.com")
          ? receiverUser.email
          : `${receiverUser.email.split("@")[0]}@finguard`,
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
        riskScore: result.transaction.riskScore,
        ruleScore: result.transaction.ruleScore,
        riskFactors: fraudResult.reasons,
        mlProbability: result.transaction.mlProbability,
        createdAt: result.transaction.createdAt,
      },
      fraud: {
        riskScore: fraudResult.riskScore,
        decision: fraudResult.decision,
        reasons: fraudResult.reasons,
        ruleScore: fraudResult.ruleScore,
        ml: fraudResult.ml,
      },
    };

    if (idempotencyKey) {
      await saveIdempotency(idempotencyKey, senderUserId, responsePayload);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (idempotencyKey) await clearIdempotency(idempotencyKey, senderUserId);
    console.error("Transfer error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const withdraw = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, pin } = req.body;

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

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true },
    });

    if (!userRecord?.transactionPin) {
      return res.status(403).json({
        requiresPin: true,
        hasPin: false,
        message: "A 6-digit Transaction PIN is required for withdrawals. Please set up your PIN first.",
      });
    }

    if (!pin) {
      return res.status(403).json({
        requiresPin: true,
        hasPin: true,
        message: "Transaction PIN is required to authorize this withdrawal.",
      });
    }

    const isPinValid = await bcrypt.compare(String(pin), userRecord.transactionPin);
    if (!isPinValid) {
      return res.status(401).json({
        requiresPin: true,
        hasPin: true,
        message: "Incorrect 6-digit Transaction PIN. Withdrawal aborted.",
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
      const shortfall = withdrawalAmount - wallet.balance;
      return res.status(400).json({
        message: `Insufficient balance in account. Available balance is ₹${wallet.balance.toString()}, but requested withdrawal is ₹${withdrawalAmount.toString()} (shortfall: ₹${shortfall.toString()}).`,
        availableBalance: wallet.balance.toString(),
        requestedAmount: withdrawalAmount.toString(),
        shortfall: shortfall.toString(),
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
  addRecipient,
  updateRecipient,
  deleteRecipient,
};