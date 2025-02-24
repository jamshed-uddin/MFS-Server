const express = require("express");
const {
  sendMoney,
  cashOut,
  cashIn,
  cashWithdrawal,
  cashRecharge,
  getTransactions,
  updateTransaction,
} = require("../controllers/transactionController");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const validateTransacInfoMid = require("../middlewares/validateTransacInfoMid");

// router.use(authenticate);
router.use(validateTransacInfoMid);

router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.post("/sendmoney", sendMoney);
router.post("/cashout", cashOut);
router.post("/cashin", cashIn);
router.post("/withdrawal", cashWithdrawal);
router.post("/recharge", cashRecharge);

module.exports = router;
