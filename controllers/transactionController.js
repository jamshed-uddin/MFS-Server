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
      // add the amount to receiver balance
      {
        updateOne: {
          filter: { mobileNumber: receiverMobile },
          update: { $inc: { balance: amount } },
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
        },
        // adding agent fee
        {
          updateOne: {
            filter: { mobileNumber: receiverMobile },
            update: { $inc: { balance: agentFee } },
          },
        }
      );
    }

    await Users.bulkWrite(bulkOps, { session: mongooseSession });
    await mongooseSession.commitTransaction();
    return createdTransaction;
  } catch (error) {
    await mongooseSession.abortTransaction();
    throw customError(400, "Transation failed");
  } finally {
    await mongooseSession.endSession();
  }
};

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

const sendMoney = async (req, res, next) => {
  try {
    const { role: senderRole } = req.user;
    const { type: transactionType, receiverMobile, amount } = req.body;

    // check for minimum send money amount

    if (amount < 50) {
      throw customError(400, "Minimum send money amount is 50 taka");
    }

    // check for right participent in transaction
    const receiver = await Users.findOne({
      mobileNumber: receiverMobile,
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

    const newTransaction = await handleTransacAndBalance(req.body);
    res
      .status(200)
      .send({ message: "Send money successful", data: newTransaction });
  } catch (error) {
    next(error);
  }
};

const cashOut = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
const cashIn = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
const cashWithdrawal = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
const cashRecharge = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    console.log(req.params.id);
    res.send({ message: "Updated" });
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
