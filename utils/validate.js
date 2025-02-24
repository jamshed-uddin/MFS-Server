const joi = require("joi");

const validateUserInfo = (userInfo) => {
  const schema = joi.object({
    name: joi.string().required().messages({
      "string.empty": "Name is required",
    }),
    email: joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),

    mobileNumber: joi.string().required().messages({
      "string.empty": "Mobile number is required",
    }),

    nid: joi.number().required().messages({
      "number.empty": "NID is required",
    }),
    pin: joi.string().length(5).required().messages({
      "string.empty": "Pin is required",
      "string.length": "Pin length must be 5 digit",
    }),
    role: joi.string().valid("user", "agent").required().messages({
      "string.empty": "Role is required",
    }),
  });
  return schema.validate(userInfo);
};

const validateLoginCredentials = (credentials) => {
  const schema = joi.object({
    mobileNumber: joi.string().required().messages({
      "string.empty": "Mobile number is required",
    }),
    pin: joi.string().length(5).required().messages({
      "number.empty": "Pin is required",
      "string.length": "Pin length must be 5 digit",
    }),
  });

  return schema.validate(credentials);
};

module.exports = {
  validateUserInfo,
  validateLoginCredentials,
};
