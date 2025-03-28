const Users = require("../models/userModel");
const customError = require("../utils/customError");
const generateToken = require("../utils/generateToken");
const { validateUserInfo } = require("../utils/validate");

// @desc login user
// POST /api/users/login
// @access Public

const loginUser = async (req, res, next) => {
  try {
    const { emailOrMobileNumber, pin } = req.body;

    if (!emailOrMobileNumber) {
      throw customError(400, "Email or mobile number is required");
    } else if (!pin) {
      throw customError(400, "Pin is required");
    }

    const isEmail = /\S+@\S+\.\S+/.test(emailOrMobileNumber);

    const user = await Users.findOne(
      isEmail
        ? { email: emailOrMobileNumber }
        : { mobileNumber: emailOrMobileNumber }
    );

    if (user && (await user.matchPin(pin))) {
      if (!user?.isActive) {
        throw customError(
          401,
          "Your account has been disabled. Please contact support team."
        );
      }

      const userWithoutPin = user?.toObject();
      delete userWithoutPin.pin;

      res.status(200).send({
        message: "Login succesful",
        data: {
          ...userWithoutPin,
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

    const { error, value: userInfo } = validateUserInfo(req.body);

    if (error) {
      throw customError(400, error.message);
    }

    const existingUser = await Users.findOne({
      $or: [{ email }, { mobileNumber }, { nid }],
    });

    if (existingUser?.email === email) {
      throw customError(400, "An account with this email already exists");
    } else if (existingUser?.nid === nid) {
      throw customError(400, "An account with this NID already exists");
    } else if (existingUser?.mobileNumber === mobileNumber) {
      throw customError(
        400,
        "An account with this mobile number already exists"
      );
    }

    const newUser = await Users.create(userInfo);
    const userWithoutPin = newUser?.toObject();
    delete userWithoutPin.pin;

    const response = {
      ...userWithoutPin,
      token: generateToken(userWithoutPin._id),
    };

    res.status(200).send({ message: "User registered", data: response });
  } catch (error) {
    next(error);
  }
};

//@desc  get all users
// GET /api/users
// @access Private
const getUsers = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "admin";

    // if (!isAdmin) {
    //   throw customError(401, "Unauthorized action");
    // }

    const { role, activeonly, status } = req.query;

    const page = req.query.page || 1;
    const limit = req.query.limit || 15;

    const allowedRoleFilters = ["user", "agent"];
    const filter = {
      role: { $in: allowedRoleFilters },
    };
    if (role && allowedRoleFilters.includes(role)) {
      filter.role = role;
    }

    if (activeonly) {
      filter.isActive = true;
    }

    if (status) {
      filter.status = status;
    }
    const allUsers = await Users.find(filter);
    const totalUsers = allUsers.length;
    const totalPage = Math.ceil(totalUsers / limit);

    const paginatedUsers = await Users.find(filter)
      .select("-pin")
      .limit(limit)
      .skip((page - 1) * limit)
      .sort("-1");

    const response = {
      message: "User retrieval successful",
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        totalPage,
        totalUsers,
      },
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      throw customError(400, "User id is required");
    }

    const user = await Users.findById(userId).select("-pin");

    if (!user) {
      throw customError(404, "User not found");
    }

    res
      .status(200)
      .send({ message: "User data retrieval successful", data: user });
  } catch (error) {
    next(error);
  }
};

//@desc update user
// PUT /api/users/:id
// @access Private
const updateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.params.id;

    const updatedUser = await Users.findOneAndUpdate(
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
// PUT /api/users/:id/changepin
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

//@desc approve agent and block or unblock user
// PUT /api/users/:id/approveagent
// @access Private - admin only

const updateUserStatusAndIsActive = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const isAdmin = req.user.role === "admin";
    const { status, isActive } = req.body;

    if (!isAdmin) {
      throw customError(401, "Unauthorized action");
    }

    const user = await Users.findById(userId).select("-pin");
    if (!user) {
      throw customError(404, "User not found");
    }

    if (user?.role === "agent" && status) {
      user.status = status || user.status;
    }
    if (typeof isActive !== undefined) {
      user.isActive = isActive;
    }
    await user.save();

    res.status(200).send({
      message:
        user?.role === "agent" && status
          ? "Agent approved"
          : "User active status updated",
    });
  } catch (error) {
    next(error);
  }
};

//@desc search user
// PUT /api/users/search?q=''
// @access Private
const searchUser = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q) {
      throw customError(400, "Search query is required.");
    }

    const isEmail = /\S+@\S+\.\S+/.test(q);

    const user = await Users.find({
      ...(isEmail
        ? { email: q }
        : { mobileNumber: { $regex: new RegExp(q.slice(1), "i") } }),
      _id: { $ne: userId },
    }).select("-pin");

    if (!user) {
      throw customError(404, "User not found");
    }

    res.status(200).send({ message: "User found", data: user });
  } catch (error) {
    next(error);
  }
};

// @desc get the total balance of system
// GET /api/users/systembalance
// @access Private - admin only
const getSystemBalance = async (req, res, next) => {
  try {
    // Ensure user is an admin
    // if (req.user.role !== "admin") {
    //   throw customError(401, "Unauthorized balance query");
    // }

    // Aggregate total balance
    const result = await Users.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
        },
      },
    ]);

    const totalBalance = result[0]?.totalBalance || 0;

    res.status(200).json({ totalBalance });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  loginUser,
  registerUser,
  updateUser,
  updateUserStatusAndIsActive,
  changePin,
  searchUser,
  getSystemBalance,
  getUser,
};
