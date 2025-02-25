const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    senderMobile: {
      type: String,
      required: [true, "Sender mobile number is required"],
    },
    receiverMobile: {
      type: String,
      required: [true, "Receiver mobile number is required"],
    },
    type: {
      type: String,
      enum: [
        "send_money",
        "cash_in",
        "cash_out",
        "withdrawal",
        "balance_recharge",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },

    agentFee: {
      type: Number,
      default: function () {
        if (this.type === "cash_out") {
          return +(this.amount * (1 / 100)).toFixed(2);
        } else {
          return 0;
        }
      },
    },
    adminFee: {
      type: Number,
      default: function () {
        if (this.type === "cash_out") {
          return +(this.amount * (0.5 / 100)).toFixed(2);
        } else if (this.type === "send_money" && this.amount >= 100) {
          return 5;
        } else {
          return 0;
        }
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: function () {
        if (this.type === "withdrawal" || this.type === "balance_recharge") {
          return "pending";
        } else {
          return "completed";
        }
      },
    },
  },
  { timestamps: true }
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
