const Users = require("../models/userModel");
const Transactions = require("../models/transactionModel");

const getTransactions = async (req, res, next) => {
  try {
    res.status(200).send({ message: "Transaction retrieval successful" });
  } catch (error) {
    console.log("error from controller", error);
    next(error);
  }
};

const sendMoney = async (req, res, next) => {
  try {
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
