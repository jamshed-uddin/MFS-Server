const Users = require("../models/userModel");
const Transactions = require("../models/transactionModel");
const mongoose = require("mongoose");
const customError = require("../utils/customError");

// function to handle transaction creation and balance update

const handleTransacAndBalance = async (transactionData) => {
  // wrapping the ops in transaction for rollback due to any failure
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();

  try {
    const [createdTransaction] = await Transactions.create([transactionData], {
      session: mongooseSession,
    });

    const { amount, senderMobile, receiverMobile, type, agentFee, adminFee } =
      createdTransaction;

    const admin = await Users.findOne({ role: "admin" })
      .select("-pin")
      .session(mongooseSession);

    // base ops.in every transaction there are addition and deduction in balance
    const bulkOps = [
      // deduct the amount + fee from sender's balance
      {
        updateOne: {
          filter: { mobileNumber: senderMobile },
          update: { $inc: { balance: -(amount + adminFee + agentFee) } },
        },
      },
      // add the amount to receiver balance (there is agent fee only for cash out. for other transactions it's 0)
      {
        updateOne: {
          filter: { mobileNumber: receiverMobile },
          update: { $inc: { balance: amount + agentFee } },
        },
      },
    ];
    // if it's send money adding 5 taka fee to admin for 100 or more send money
    if (type === "send_money") {
      bulkOps.push({
        updateOne: {
          filter: { mobileNumber: admin?.mobileNumber },
          update: { $inc: { balance: adminFee } },
        },
      });
    } else if (type === "cash_out") {
      bulkOps.push(
        // adding admin fee
        {
          updateOne: {
            filter: { mobileNumber: admin?.mobileNumber },
            update: { $inc: { balance: adminFee } },
          },
        }
      );
    }

    await Users.bulkWrite(bulkOps, { session: mongooseSession });
    await mongooseSession.commitTransaction();
    return createdTransaction;
  } catch (error) {
    await mongooseSession.abortTransaction();
    console.log(error);
    throw customError(400, "Transation failed");
  } finally {
    await mongooseSession.endSession();
  }
};

// @desc  get all transaction
// GET /api/transactions
// @access Private
const getTransactions = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const { role, mobileNumber } = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const filter = {};
    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    let transactions, totalPages, totalTransactions;

    if (role === "admin") {
      const allTransactions = await Transactions.find(filter);
      totalTransactions = allTransactions.length;
      totalPages = Math.ceil(totalTransactions / limit);
      transactions = await Transactions.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
    } else {
      const userAndAgentsFilter = {
        ...filter,
        $or: [{ senderMobile: mobileNumber }, { receiverMobile: mobileNumber }],
      };

      const userAndAgentsTransac = await Transactions.find(userAndAgentsFilter)
        .sort({ createdAt: -1 })
        .limit(100);

      transactions = userAndAgentsTransac.slice(
        (page - 1) * limit,
        page * limit
      );

      totalTransactions = userAndAgentsTransac.length;
      totalPages = totalTransactions / limit;
    }

    const response = {
      message: "Transactions retrieval successful",
      data: transactions,
      pagination: {
        page,
        limit,
        totalPages,
        totalTransactions,
      },
    };

    res.status(200).send(response);
  } catch (error) {
    console.log("error from controller", error);
    next(error);
  }
};

// @desc  send money
// POST /api/transactions/sendmoney
// @access Private
const sendMoney = async (req, res, next) => {
  try {
    const { role: senderRole } = req.user;
    const { receiverMobile, amount } = req.body;

    console.log(req.body);

    // check for minimum send money amount

    if (amount < 50) {
      throw customError(400, "Minimum send money amount is 50 taka");
    }

    // check for right participent in transaction
    const receiver = await Users.findOne({
      mobileNumber: receiverMobile,
    }).select("-pin");

    // check for receiver availability.
    if (!receiver) {
      throw customError(404, "Receiver not found");
    }
    const receiverRole = receiver?.role;

    console.log("role", senderRole, receiverRole);

    // check to make sure both participent in transaction is user
    if (senderRole !== "user" || receiverRole !== "user") {
      throw customError(401, "Send money only allowed from user to user");
    }

    // handling transaction creation and balance management
    const newTransaction = await handleTransacAndBalance(req.body);
    res
      .status(200)
      .send({ message: "Send money successful", data: newTransaction });
  } catch (error) {
    next(error);
  }
};

// @desc  cash in
// POST /api/transactions/cashin
// @access Private
const cashIn = async (req, res, next) => {
  try {
    const transactionInfo = req.body;
    const { role: senderRole } = req.user;

    if (senderRole !== "agent") {
      throw customError(401, "Cash in must be initiated by agent");
    }

    const cashInTransaction = await handleTransacAndBalance(transactionInfo);

    res.send({ message: "Cash in successful", data: cashInTransaction });
  } catch (error) {
    next(error);
  }
};
// @desc  cash out
// POST /api/transactions/cashout
// @access Private
const cashOut = async (req, res, next) => {
  try {
    const transactionInfo = req.body;
    const { role: senderRole } = req.user;
    const receiver = await Users.findOne({
      mobileNumber: transactionInfo.receiverMobile,
    }).select("-pin");

    if (senderRole !== "user") {
      throw customError(401, "Cash out must be initiated by user");
    }

    if (receiver?.role !== "agent") {
      throw customError(400, "Cash out to non-agent user is not allowed");
    }

    const cashOutTransaction = await handleTransacAndBalance(transactionInfo);

    res.status(200).send({
      message: "Cash out successful",
      data: cashOutTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  cash withdrawal request from agent
// POST /api/transactions/withdrawal
// @access Private
const cashWithdrawal = async (req, res, next) => {
  try {
    const transactionInfo = req.body;
    const { role: senderRole } = req.user;

    if (senderRole !== "agent") {
      throw customError(400, "Withdrawal must be initiated by agent");
    }

    const withdrawalTransac = await Transactions.create(transactionInfo);

    res.status(200).send({
      message:
        "Transaction under review. Agent will be notified about approval anytime soon.",
      data: withdrawalTransac,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  cash recharge request from agent
// POST /api/transactions/recharge
// @access Private
const cashRecharge = async (req, res, next) => {
  try {
    const transactionInfo = req.body;
    const { role: senderRole } = req.user;

    if (senderRole !== "agent") {
      throw customError(400, "Balance recharge must be initiated by agent");
    }

    if (transactionInfo.amount > 100000) {
      throw customError(400, "Maximum recharge amount is 100000");
    }

    const rechargeTransac = await Transactions.create(transactionInfo);

    res.status(200).send({
      message:
        "Transaction under review. Agent will be notified about approval anytime soon.",
      data: rechargeTransac,
    });
  } catch (error) {
    next(error);
  }
};

// @desc withdrawal or recharge approval from admin
// POST /api/transactions/:id
// @access Private
const updateTransaction = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const { status } = req.body;
    const { role } = req.user;
    const transactionId = req.params.id;

    if (role !== "admin") {
      throw customError(401, "Unauthorized transaction action");
    }

    if (!status) {
      throw customError(400, "Transaction status is required");
    } else if (!transactionId) {
      throw customError(400, "Transaction id is required");
    }

    const approvedTransaction = await Transactions.findOneAndUpdate(
      { _id: transactionId },
      { status },
      { new: true }
    );

    if (!approvedTransaction) {
      throw customError(404, "Transaction not found");
    }

    // do the balance addition and deduction
    const { amount, agentFee, adminFee } = approvedTransaction;

    const bulkOps = [
      // deduct the amount + fee from sender's balance
      {
        updateOne: {
          filter: { mobileNumber: senderMobile },
          update: { $inc: { balance: -(amount + adminFee) } },
        },
      },
      // add the amount to receiver balance (there is agent fee only for cash out. for other transactions it's 0)
      // In case of withdrawal admin will get the admin fee only
      {
        updateOne: {
          filter: { mobileNumber: receiverMobile },
          update: { $inc: { balance: amount + adminFee } },
        },
      },
    ];

    await Users.bulkWrite(bulkOps);

    res.status(200).send({ message: "Transaction status updated" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  sendMoney,
  cashOut,
  cashIn,
  cashWithdrawal,
  cashRecharge,
  updateTransaction,
};
