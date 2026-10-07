const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  getBanksDirectory,
  getMyBankAccounts,
  linkBankAccount,
  setPrimaryAccount,
  unlinkBankAccount,
  checkAccountBalance,
} = require("../controllers/bankController");

// Public directory of banks
router.get("/directory", getBanksDirectory);

// Protected routes (require user login)
router.get("/my-accounts", authenticateToken, getMyBankAccounts);
router.post("/link", authenticateToken, linkBankAccount);
router.patch("/:id/primary", authenticateToken, setPrimaryAccount);
router.delete("/:id", authenticateToken, unlinkBankAccount);
router.post("/:id/balance", authenticateToken, checkAccountBalance);

module.exports = router;
