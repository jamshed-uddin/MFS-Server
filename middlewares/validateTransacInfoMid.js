const customError = require("../utils/customError");
const { validateTransactionInfo } = require("../utils/validate");

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

    const transacInfo = req.body;
    const { balance, role: senderRole } = req.user;

    const { error, value: validatedTransacInfo } =
      validateTransactionInfo(transacInfo);

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

    // check for right participent in transaction
    const receiver = await Users.findOne({
      mobileNumber: validatedTransacInfo.receiverMobile,
    }).select("-pin");

    if (!receiver) {
      throw customError(404, "Receiver not found");
    }
    const receiverRole = receiver?.role;

    if (
      transactionType === "send_money" &&
      senderRole !== "user" &&
      receiverRole !== "user"
    ) {
      throw customError(401, "Send money only allowed from user to user");
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateTransacInfoMid;
