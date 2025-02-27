const customError = require("../utils/customError");
const { validateTransactionInfo } = require("../utils/validate");
const Users = require("../models/userModel");

const validateTransacInfoMid = async (req, res, next) => {
  try {
    // excluding the get all transaction and update transaction routes cause they do initiate any transaction.so they don't need to verify transaction info
    console.log("path", req.path, "method", req.method);
    if (
      (req.method === "GET" && req.path === "/") ||
      (req.method === "PUT" && req.path.startsWith("/"))
    ) {
      return next();
    }

    // let transacInfo = req.body;
    const { balance, mobileNumber: senderMobile } = req.user;

    // for withdrawal and balance_recharge getting admin mobile number and adding it to the body as it not available in request body

    if (
      req.body.type === "withdrawal" ||
      req.body.type === "balance_recharge"
    ) {
      const admin = await Users.findOne({ role: "admin" }).select("-pin");

      console.log("admin from mid", admin);

      if (admin) {
        if (req.body.type === "withdrawal") {
          // if it's cash withdrawal for agent the admin is receiver
          req.body.senderMobile = senderMobile;
          req.body.receiverMobile = admin.mobileNumber;
        } else if (req.body.type === "balance_recharge") {
          // when it's balance recharge for agent the admin is sender
          req.body.senderMobile = admin.mobileNumber;
          req.body.receiverMobile = senderMobile;
        }
      }
    } else {
      req.body.senderMobile = senderMobile;
    }

    console.log(req.body);
    // check if required field is available in request body
    const { error, value: validatedTransacInfo } = validateTransactionInfo(
      req.body
    );

    if (error) {
      throw customError(400, error.message);
    }

    // check for sufficient balance
    let fee = 0;
    const transactionType = validatedTransacInfo.type;
    if (transactionType === "send_money") {
      fee = 5;
    } else if (
      transactionType === "cash_out" ||
      transactionType === "withdrawal"
    ) {
      fee = validatedTransacInfo.amount * (1.5 / 100);
    }
    const totalAmount = validatedTransacInfo.amount + fee;

    if (balance < totalAmount) {
      throw customError(400, "Insufficient balance");
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateTransacInfoMid;
