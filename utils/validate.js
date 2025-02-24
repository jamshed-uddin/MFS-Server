const joi = require("joi");

const validateUserInfo = (userInfo) => {
  const schema = joi.object({
    name: joi.string().required().message({
      "string.empty": "Name is required",
    }),
    email: joi.string().email().required().message({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),

    mobileNumber: joi.string().required().message({
      "string.empty": "Mobile number is required",
    }),

    nid: joi.number().required().message({
      "number.empty": "NID is required",
    }),
    pin: joi.number().min(5).max(5).required().message({
      "number.empty": "Pin is required",
      "number.min": "Minimum pin length is 5",
      "number.max": "Maximum pin length is 5",
    }),
    role: joi.string().valid("user", "agent").required().message({
      "string.empty": "Role is required",
    }),
  });
  return schema.validate(userInfo);
};

const validateLoginCredentials = (credentials) => {
  const schema = joi.object({
    mobileNumber: joi.string().required().message({
      "string.empty": "Mobile number is required",
    }),
    pin: joi.number().min(5).max(5).required().message({
      "number.empty": "Pin is required",
      "number.min": "Minimum pin length is 5",
      "number.max": "Maximum pin length is 5",
    }),
  });

  return schema.validate(credentials);
};

module.exports = {
  validateUserInfo,
  validateLoginCredentials,
};
