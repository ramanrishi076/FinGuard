const prisma = require("../lib/prisma");
const redisManager = require("../lib/redis");
const { getIo } = require("../lib/socket");

const formatUpi = (user) => {
  if (!user || !user.email) return null;
  return `${user.email.split("@")[0]}@finguard`;
};

const getFlaggedTransactions = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const whereClause = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    } else {
      whereClause.OR = [
        { status: "FLAGGED" },
        { status: "REVIEW" },
        { status: "BLOCKED" },
        { riskScore: { gte: 30 } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        senderWallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        receiverWallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });

    const parsed = transactions.map((tx) => {
      let parsedFactors = [];
      try {
        if (tx.riskFactors) {
          parsedFactors = JSON.parse(tx.riskFactors);
        }
      } catch {
        parsedFactors = tx.riskFactors ? [tx.riskFactors] : [];
      }

      return {
        id: tx.id,
        amount: tx.amount.toString(),
        type: tx.type,
        status: tx.status,
        description: tx.description,
        riskScore: tx.riskScore ?? 0,
        ruleScore: tx.ruleScore ?? 0,
        mlProbability: tx.mlProbability ?? 0,
        riskFactors: parsedFactors,
        resolutionNotes: tx.resolutionNotes,
        resolvedBy: tx.resolvedBy,
        resolvedAt: tx.resolvedAt,
        createdAt: tx.createdAt,
        sender: tx.senderWallet?.user
          ? {
              id: tx.senderWallet.user.id,
              name: tx.senderWallet.user.name,
              email: tx.senderWallet.user.email,
              upiId: formatUpi(tx.senderWallet.user),
            }
          : null,
        receiver: tx.receiverWallet?.user
          ? {
              id: tx.receiverWallet.user.id,
              name: tx.receiverWallet.user.name,
              email: tx.receiverWallet.user.email,
              upiId: formatUpi(tx.receiverWallet.user),
            }
          : null,
      };
    });

    return res.status(200).json({ transactions: parsed });
  } catch (error) {
    console.error("Get flagged transactions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getComplianceStats = async (req, res) => {
  try {
    const [flagged, review, blocked, approved, total] = await Promise.all([
      prisma.transaction.count({ where: { status: "FLAGGED" } }),
      prisma.transaction.count({ where: { status: "REVIEW" } }),
      prisma.transaction.count({ where: { status: "BLOCKED" } }),
      prisma.transaction.count({ where: { status: "APPROVED" } }),
      prisma.transaction.count(),
    ]);

    const resolved = await prisma.transaction.count({
      where: { resolvedAt: { not: null } },
    });

    return res.status(200).json({
      stats: {
        flagged,
        review,
        blocked,
        approved,
        total,
        resolved,
      },
    });
  } catch (error) {
    console.error("Compliance stats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const resolveTransaction = async (req, res) => {
  try {
    const transactionId = Number(req.params.id);
    const { action, notes } = req.body; // action: "APPROVE" | "REJECT"
    const officerUserId = req.user.userId;

    if (!transactionId || isNaN(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ message: "Action must be APPROVE or REJECT" });
    }

    const officer = await prisma.user.findUnique({
      where: { id: officerUserId },
      select: { name: true, email: true },
    });

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        senderWallet: true,
        receiverWallet: true,
      },
    });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const officerName = officer?.name || `Officer #${officerUserId}`;
    const newStatus = action === "APPROVE" ? "APPROVED" : "BLOCKED";

    // If REJECTING a transaction that already deducted funds in FLAGGED/REVIEW status, refund sender
    const updatedTx = await prisma.$transaction(async (prismaTx) => {
      if (
        action === "REJECT" &&
        (tx.status === "FLAGGED" || tx.status === "REVIEW") &&
        tx.senderWalletId &&
        tx.receiverWalletId
      ) {
        // Rollback balances: increment senderWallet, decrement receiverWallet
        await prismaTx.wallet.update({
          where: { id: tx.senderWalletId },
          data: { balance: { increment: tx.amount } },
        });

        await prismaTx.wallet.update({
          where: { id: tx.receiverWalletId },
          data: { balance: { decrement: tx.amount } },
        });
      }

      return await prismaTx.transaction.update({
        where: { id: transactionId },
        data: {
          status: newStatus,
          resolutionNotes: notes || `Compliance officer ${action.toLowerCase()}d this transaction.`,
          resolvedBy: officerName,
          resolvedAt: new Date(),
        },
        include: {
          senderWallet: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          receiverWallet: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });

    // Invalidate Redis caches
    if (tx.senderWallet?.userId) {
      await redisManager.del(`wallet:${tx.senderWallet.userId}`);
    }
    if (tx.receiverWallet?.userId) {
      await redisManager.del(`wallet:${tx.receiverWallet.userId}`);
    }

    // Real-time broadcast
    try {
      const io = getIo();
      if (io) {
        io.emit("transaction:resolved", {
          transactionId: updatedTx.id,
          status: updatedTx.status,
          resolvedBy: updatedTx.resolvedBy,
          resolvedAt: updatedTx.resolvedAt,
          resolutionNotes: updatedTx.resolutionNotes,
          amount: updatedTx.amount.toString(),
        });
      }
    } catch (socketErr) {
      console.warn("Socket broadcast error:", socketErr);
    }

    return res.status(200).json({
      message: `Transaction successfully ${action === "APPROVE" ? "approved & cleared" : "blocked & rolled back"}`,
      transaction: {
        id: updatedTx.id,
        status: updatedTx.status,
        resolutionNotes: updatedTx.resolutionNotes,
        resolvedBy: updatedTx.resolvedBy,
        resolvedAt: updatedTx.resolvedAt,
      },
    });
  } catch (error) {
    console.error("Resolve transaction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getFlaggedTransactions,
  getComplianceStats,
  resolveTransaction,
};
