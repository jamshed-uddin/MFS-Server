const jwt = require("jsonwebtoken");
const Users = require("../models/userModel");
const authenticate = async (req, res, next) => {
  let token;

  token = req.header("Authorization").split(" ")[1];

  if (!token) {
    res.status(401).send({ message: "Unauthorized action" });
  }

  try {
    const decode = jwt.verify(token, process.env.SECRET);

    const user = await Users.find(decode._id).select("-pin");

    if (!user) {
      res.status(401).send({ message: "Unauthorized action" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ message: "Unauthorized action" });
  }
};

module.exports = authenticate;
