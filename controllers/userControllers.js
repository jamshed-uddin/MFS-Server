const Users = require("../models/userModel");
const customError = require("../utils/customError");
const generateToken = require("../utils/generateToken");
const {
  validateUserInfo,
  validateLoginCredentials,
} = require("../utils/validate");

// @desc login user
// POST /api/users/login
// @access Public

const loginUser = async (req, res, next) => {
  try {
    const userCredentials = req.body;

    const { error, value: credentials } =
      validateLoginCredentials(userCredentials);

    if (error) {
      throw customError(400, error?.message);
    }

    const user = await Users.findOne({
      mobileNumber: credentials.mobileNumber,
    }).select("-pin");

    if (user && (await user.matchPin(credentials.mobileNumber))) {
      res.status(200).send({
        message: "Login succesful",
        data: {
          ...user,
          token: generateToken(user?._id),
        },
      });
    } else {
      throw customError(400, "Invalid credentials");
    }
  } catch (error) {
    next(error);
  }
};

//@desc register user
// POST /api/users/register
// @access Public
const registerUser = async (req, res, next) => {
  try {
    const { email, nid, mobileNumber } = req.body;

    const existingUser = await Users.findOne({
      $or: [{ email }, { mobileNumber }, { nid }],
    });

    if (existingUser.email === email) {
      throw customError(400, "An account with this email already exists");
    } else if (existingUser.nid === nid) {
      throw customError(400, "An account with this NID already exists");
    } else if (existingUser.mobileNumber === mobileNumber) {
      throw customError(
        400,
        "An account with this mobile number already exists"
      );
    }

    const { error, value: userInfo } = validateUserInfo(req.body);

    if (error) {
      throw customError(400, error.message);
    }

    const newUser = await Users.create(userInfo);
    const userWithoutPin = newUser.toObject();
    delete userWithoutPin.pin;

    const response = {
      ...userWithoutPin,
      token: generateToken(userWithoutPin._id),
    };

    res.status(200).send({ message: "User registered", data: response });

    console.log(userInfo);
  } catch (error) {
    next(error);
  }
};

//@desc update user
// POST /api/users/:id
// @access Private
const updateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.params.id;

    if (!name) {
      throw customError(400, "Name is required");
    } else if (!email) {
      throw customError(400, "Email is required");
    }

    const updatedUser = Users.updateOne(
      { _id: userId },
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      throw customError(404, "User not found");
    }

    res.status(200).send({ message: "User info updated" });
  } catch (error) {
    next(error);
  }
};

//@desc update user password
// POST /api/users/:id/changepin
// @access Private

const changePin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { currentPin, newPin } = req.body;

    if (!currentPin) {
      throw customError(400, "Current password is required");
    } else if (!newPin) {
      throw customError(400, "New password is required");
    }

    const user = await Users.findOne({ _id: userId });

    if (user && (await user.matchPin(currentPin))) {
      user.pin = newPin;
      await user.save();
      return res.status(200).send({ message: "Pin changed" });
    } else {
      throw customError(400, "Invalid pin");
    }
  } catch (error) {
    next(error);
  }
};

//@desc approve agent
// POST /api/users/:id/approveagent
// @access Private - admin only

const approveAgent = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const isAdmin = req.user.role === "admin";
    const { status } = req.body;

    if (!isAdmin) {
      throw customError(400, "Unauthorized action");
    }
    const user = await Users.findOne({ _id: userId });
    if (!user) {
      throw customError(404, "User not found");
    }

    user.status = status;
    await user.save();

    res.status(200).send({ message: "Agent approved" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  registerUser,
  updateUser,
  approveAgent,
  changePin,
};
