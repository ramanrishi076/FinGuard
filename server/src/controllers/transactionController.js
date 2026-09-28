const prisma = require("../lib/prisma");

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

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

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            senderWalletId: wallet.id,
          },
          {
            receiverWalletId: wallet.id,
          },
        ],
      },
      include: {
        senderWallet: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        receiverWallet: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatUpi = (user) => {
      if (!user || !user.email) return null;
      return `${user.email.split("@")[0]}@finguard`;
    };

    return res.status(200).json({
      transactions: transactions.map((transaction) => {
        const senderUser = transaction.senderWallet?.user;
        const receiverUser = transaction.receiverWallet?.user;

        return {
          id: transaction.id,
          senderWalletId: transaction.senderWalletId,
          senderUserId: senderUser?.id || null,
          senderName: senderUser?.name || (transaction.type === "DEPOSIT" ? "Banking Deposit" : null),
          senderUpiId: formatUpi(senderUser),
          receiverWalletId: transaction.receiverWalletId,
          receiverUserId: receiverUser?.id || null,
          receiverName: receiverUser?.name || (transaction.type === "WITHDRAWAL" ? "Bank Account Payout" : null),
          receiverUpiId: formatUpi(receiverUser),
          amount: transaction.amount.toString(),
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        message: "Invalid transaction ID",
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          {
            senderWalletId: wallet.id,
          },
          {
            receiverWalletId: wallet.id,
          },
        ],
      },
      include: {
        senderWallet: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        receiverWallet: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const formatUpi = (user) => {
      if (!user || !user.email) return null;
      return `${user.email.split("@")[0]}@finguard`;
    };

    const senderUser = transaction.senderWallet?.user;
    const receiverUser = transaction.receiverWallet?.user;

    return res.status(200).json({
      transaction: {
        id: transaction.id,
        senderWalletId: transaction.senderWalletId,
        senderUserId: senderUser?.id || null,
        senderName: senderUser?.name || (transaction.type === "DEPOSIT" ? "Banking Deposit" : null),
        senderUpiId: formatUpi(senderUser),
        receiverWalletId: transaction.receiverWalletId,
        receiverUserId: receiverUser?.id || null,
        receiverName: receiverUser?.name || (transaction.type === "WITHDRAWAL" ? "Bank Account Payout" : null),
        receiverUpiId: formatUpi(receiverUser),
        amount: transaction.amount.toString(),
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Get transaction error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
};