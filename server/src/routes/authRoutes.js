const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const {
  register,
  login,
  refresh,
  logout,
  setTransactionPin,
  getTransactionPinStatus,
  verifyTransactionPin,
  resetTransactionPin,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post("/pin", authenticateToken, setTransactionPin);
router.get("/pin/status", authenticateToken, getTransactionPinStatus);
router.post("/pin/verify", authenticateToken, verifyTransactionPin);
router.post("/pin/reset", authenticateToken, resetTransactionPin);

module.exports = router;