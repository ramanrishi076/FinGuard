const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const {
  getFlaggedTransactions,
  getComplianceStats,
  resolveTransaction,
} = require("../controllers/complianceController");

const router = express.Router();

router.get("/flagged", authenticateToken, getFlaggedTransactions);
router.get("/stats", authenticateToken, getComplianceStats);
router.post("/resolve/:id", authenticateToken, resolveTransaction);

module.exports = router;
