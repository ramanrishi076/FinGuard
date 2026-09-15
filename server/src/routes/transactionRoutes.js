const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
  getTransactions,
  getTransactionById,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", authenticateToken, getTransactions);
router.get("/:id", authenticateToken, getTransactionById);

module.exports = router;