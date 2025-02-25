const Users = require("../models/userModel");
const Transactions = require("../models/transactionModel");

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
    const { senderMobile, receiverMobile, type, amount } = req.body;
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
