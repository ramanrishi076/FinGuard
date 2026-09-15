const prisma = require("../lib/prisma");

const getWallet = async (req, res) => {
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

    return res.status(200).json({
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance.toString(),
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
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


const transfer = async (req, res) => {
  try {
    const senderUserId = req.user.userId;
    const { receiverUserId, amount, description } = req.body;

    if (!receiverUserId || !amount) {
      return res.status(400).json({
        message: "Receiver user ID and amount are required",
      });
    }

    const transferAmount = BigInt(amount);

    if (transferAmount <= 0n) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    if (Number(receiverUserId) === senderUserId) {
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

    const receiverWallet = await prisma.wallet.findUnique({
      where: {
        userId: Number(receiverUserId),
      },
    });

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
          status: "APPROVED",
          description: description || "Wallet transfer",
        },
      });

      return {
        senderWallet: updatedSenderWallet,
        receiverWallet: updatedReceiverWallet,
        transaction,
      };
    });

    return res.status(200).json({
      message: "Transfer successful",
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
};