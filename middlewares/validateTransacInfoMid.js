const customError = require("../utils/customError");
const { validateTransactionInfo } = require("../utils/validate");
const Users = require("../models/userModel");

const validateTransacInfoMid = async (req, res, next) => {
  try {
    // excluding the get all transaction and update transaction routes cause they do initiate any transaction.so they don't need to verify transaction info

    if (
      (req.method === "GET" && req.path === "/") ||
      (req.method === "PUT" && req.path.startsWith("/"))
    ) {
      return next();
    }

    // let transacInfo = req.body;
    const { _id, balance, mobileNumber: senderMobile } = req.user;

    // for withdrawal and balance_recharge getting admin mobile number and adding it to the body as it not available in request body

    if (
      req.body.type === "withdrawal" ||
      req.body.type === "balance_recharge"
    ) {
      const admin = await Users.findOne({ role: "admin" }).select("-pin");

      if (admin) {
        if (req.body.type === "withdrawal") {
          // if it's cash withdrawal for agent the admin is receiver
          req.body.senderMobile = senderMobile;
          req.body.receiverMobile = admin.mobileNumber;
        } else if (req.body.type === "balance_recharge") {
          // when it's balance recharge for agent  admin is the sender
          req.body.senderMobile = admin.mobileNumber;
          req.body.receiverMobile = senderMobile;
        }
      }
    } else {
      req.body.senderMobile = senderMobile;
    }

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
    } else if (transactionType === "cash_out") {
      fee = validatedTransacInfo.amount * (1.5 / 100);
    } else if (transactionType === "withdrawal") {
      // withdrawal initiated by agent and will cost agent only admin fee which is 0.5%
      fee = validatedTransacInfo.amount * (0.5 / 100);
    }
    const totalAmount = validatedTransacInfo.amount + fee;

    if (balance < totalAmount) {
      throw customError(400, "Insufficient balance");
    }

    // check for valid pin
    const user = await Users.findById(_id);

    if (!user || !(await user.matchPin(req.body.pin))) {
      throw customError(403, "Invalid pin");
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateTransacInfoMid;
