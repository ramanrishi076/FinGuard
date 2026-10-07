const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const { INDIAN_BANKS } = require("../constants/indianBanks");

// 1. Directory of all 35+ Indian Banks with Search & Filters
const getBanksDirectory = async (req, res) => {
  try {
    const { query, category } = req.query;
    let banks = [...INDIAN_BANKS];

    if (category && category !== "ALL") {
      banks = banks.filter((b) => b.category.toUpperCase() === category.toUpperCase());
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      banks = banks.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.ifscPrefix.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      total: banks.length,
      banks,
    });
  } catch (error) {
    console.error("Get banks directory error:", error);
    return res.status(500).json({ message: "Failed to fetch banks directory" });
  }
};

// 2. Fetch User's Linked Bank Accounts
const getMyBankAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    const payload = accounts.map((acc) => {
      const bankMeta = INDIAN_BANKS.find((b) => b.code === acc.bankCode) || {
        brandColor: "#006699",
        accentColor: "#280071",
        upiHandle: "oksbi",
      };

      return {
        id: acc.id,
        bankName: acc.bankName,
        bankCode: acc.bankCode,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        ifscCode: acc.ifscCode,
        branchName: acc.branchName,
        isPrimary: acc.isPrimary,
        balance: acc.balance.toString(),
        brandColor: bankMeta.brandColor,
        accentColor: bankMeta.accentColor,
        upiHandle: bankMeta.upiHandle,
        createdAt: acc.createdAt,
      };
    });

    return res.status(200).json({
      accounts: payload,
    });
  } catch (error) {
    console.error("Get my bank accounts error:", error);
    return res.status(500).json({ message: "Failed to fetch linked bank accounts" });
  }
};

// 3. Link a New Indian Bank Account (NPCI / Account Aggregator Simulation)
const linkBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankCode, accountType = "SAVINGS" } = req.body;

    if (!bankCode) {
      return res.status(400).json({ message: "Bank selection code is required" });
    }

    const bank = INDIAN_BANKS.find((b) => b.code.toUpperCase() === bankCode.toUpperCase());
    if (!bank) {
      return res.status(404).json({ message: "Invalid or unsupported bank" });
    }

    // Check count of accounts already linked for this bank
    const existingForBank = await prisma.bankAccount.count({
      where: { userId, bankCode: bank.code },
    });

    if (existingForBank >= 3) {
      return res.status(400).json({
        message: `Maximum linked accounts limit (3) reached for ${bank.name}`,
      });
    }

    const randomLast4 = Math.floor(1000 + Math.random() * 9000);
    const randomBranchNum = Math.floor(1000 + Math.random() * 9000);
    const branchNames = [
      "Connaught Place Branch",
      "Indiranagar Central Branch",
      "Nariman Point Branch",
      "MG Road Premier Branch",
      "Sector 18 Cyber Branch",
      "Bandra West Hub",
    ];
    const branchName = branchNames[Math.floor(Math.random() * branchNames.length)];
    const mockBalance = BigInt(Math.floor(20000 + Math.random() * 90000));

    // If user has no existing bank accounts, make this primary
    const totalExisting = await prisma.bankAccount.count({ where: { userId } });
    const isPrimary = totalExisting === 0;

    const newAccount = await prisma.bankAccount.create({
      data: {
        userId,
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: `•••• ${randomLast4}`,
        accountType: accountType.toUpperCase() === "CURRENT" ? "CURRENT" : "SAVINGS",
        ifscCode: `${bank.ifscPrefix}000${randomBranchNum}`,
        branchName,
        isPrimary,
        balance: mockBalance,
      },
    });

    return res.status(201).json({
      message: `${bank.name} account (${newAccount.accountNumber}) linked successfully!`,
      account: {
        id: newAccount.id,
        bankName: newAccount.bankName,
        bankCode: newAccount.bankCode,
        accountNumber: newAccount.accountNumber,
        accountType: newAccount.accountType,
        ifscCode: newAccount.ifscCode,
        branchName: newAccount.branchName,
        isPrimary: newAccount.isPrimary,
        balance: newAccount.balance.toString(),
        brandColor: bank.brandColor,
        accentColor: bank.accentColor,
        upiHandle: bank.upiHandle,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Link bank account error:", error);
    return res.status(500).json({ message: "Failed to link bank account" });
  }
};

// 4. Set Account as Primary (Receiving & Default Debits)
const setPrimaryAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const accountId = Number(req.params.id);

    const targetAccount = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!targetAccount) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.bankAccount.update({
        where: { id: accountId },
        data: { isPrimary: true },
      }),
    ]);

    return res.status(200).json({
      message: `${targetAccount.bankName} (${targetAccount.accountNumber}) is now your Primary UPI Account`,
      primaryId: accountId,
    });
  } catch (error) {
    console.error("Set primary account error:", error);
    return res.status(500).json({ message: "Failed to set primary bank account" });
  }
};

// 5. Unlink a Bank Account
const unlinkBankAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const accountId = Number(req.params.id);

    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    await prisma.bankAccount.delete({
      where: { id: accountId },
    });

    // If the deleted account was primary, nominate another account
    if (account.isPrimary) {
      const nextAccount = await prisma.bankAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (nextAccount) {
        await prisma.bankAccount.update({
          where: { id: nextAccount.id },
          data: { isPrimary: true },
        });
      }
    }

    return res.status(200).json({
      message: `Unlinked ${account.bankName} (${account.accountNumber}) successfully`,
    });
  } catch (error) {
    console.error("Unlink bank account error:", error);
    return res.status(500).json({ message: "Failed to unlink bank account" });
  }
};

// 6. Check Balance with 6-Digit PIN Authorization
const checkAccountBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const accountId = Number(req.params.id);
    const { pin } = req.body;

    if (!pin) {
      return res.status(403).json({
        requiresPin: true,
        message: "6-Digit UPI PIN is required to check account balance",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPin: true },
    });

    if (!user || !user.transactionPin) {
      return res.status(403).json({
        requiresPin: true,
        hasPin: false,
        message: "Please configure your 6-digit Transaction PIN before viewing balance.",
      });
    }

    const isValid = await bcrypt.compare(String(pin), user.transactionPin);
    if (!isValid) {
      return res.status(401).json({
        requiresPin: true,
        message: "Incorrect 6-digit UPI PIN. Balance request declined.",
      });
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    return res.status(200).json({
      id: account.id,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      balance: account.balance.toString(),
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check bank account balance error:", error);
    return res.status(500).json({ message: "Failed to check account balance" });
  }
};

module.exports = {
  getBanksDirectory,
  getMyBankAccounts,
  linkBankAccount,
  setPrimaryAccount,
  unlinkBankAccount,
  checkAccountBalance,
};
