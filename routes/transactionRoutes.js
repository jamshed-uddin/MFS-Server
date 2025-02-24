const express = require("express");
const {
  sendMoneyHandler,
  cashOutHandler,
  cashInHandler,
  cashWithdrawalHandler,
  cashRechargeHandler,
} = require("../controllers/transactionController");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

router.use(authenticate);

router.post("/sendmoney", sendMoneyHandler);
router.post("/cashout", cashOutHandler);
router.post("/cashin", cashInHandler);
router.post("/withdrawal", cashWithdrawalHandler);
router.post("/recharge", cashRechargeHandler);

module.exports = router;
