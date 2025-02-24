const express = require("express");
const {
  loginUser,
  registerUser,
  updateUser,
  changePin,
  updateUserStatusAndIsActive,
  getUsers,
} = require("../controllers/userControllers");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
router.get("/", authenticate, getUsers);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.put("/:id", authenticate, updateUser);
router.put("/:id/changepin", authenticate, changePin);
router.put(
  "/:id/adminonlyuserupdates",
  authenticate,
  updateUserStatusAndIsActive
);

module.exports = router;
