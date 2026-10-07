const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
  getWallet,
  deposit,
  transfer,
  withdraw,
  lookupRecipient,
  addRecipient,
  updateRecipient,
  deleteRecipient,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", authenticateToken, getWallet);
router.get("/lookup", authenticateToken, lookupRecipient);
router.post("/recipients", authenticateToken, addRecipient);
router.put("/recipients/:id", authenticateToken, updateRecipient);
router.delete("/recipients/:id", authenticateToken, deleteRecipient);
router.post("/deposit", authenticateToken, deposit);
router.post("/transfer", authenticateToken, transfer);
router.post("/withdraw", authenticateToken, withdraw);

module.exports = router;