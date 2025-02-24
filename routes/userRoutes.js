const express = require("express");
const {
  loginUser,
  registerUser,
  updateUser,
  approveAgent,
} = require("../controllers/userControllers");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.put("/", authenticate, updateUser);
router.put("/agentApproval", authenticate, approveAgent);

module.exports = router;
