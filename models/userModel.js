const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
    },
    nid: { type: Number, required: [true, "NID is required"], unique: true },
    pin: {
      type: String,
      required: [true, "Password is required"],
      minlength: [5, "Pin must be 5 digit"],
      maxlength: [5, "Pin must be 5 digit"],
    },
    role: { type: String, enum: ["user", "agent", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "agent" ? "pending" : "approved";
      },
    },
    balance: {
      type: Number,
      default: function () {
        return this.role === "agent" ? 100000 : 40;
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
});

userSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
