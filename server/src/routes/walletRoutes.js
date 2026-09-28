const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
  getWallet,
  deposit,
  transfer,
  withdraw,
  lookupRecipient,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", authenticateToken, getWallet);
router.get("/lookup", authenticateToken, lookupRecipient);
router.post("/deposit", authenticateToken, deposit);
router.post("/transfer", authenticateToken, transfer);
router.post("/withdraw", authenticateToken, withdraw);

module.exports = router;