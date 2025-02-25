const joi = require("joi");

const validateUserInfo = (userInfo) => {
  const schema = joi.object({
    name: joi.string().required().messages({
      "any.required": "Name is required",
    }),
    email: joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    mobileNumber: joi.string().required().messages({
      "any.required": "Mobile number is required",
    }),

    nid: joi.number().required().messages({
      "number.empty": "NID is required",
    }),
    pin: joi.string().length(5).required().messages({
      "any.required": "Pin is required",
      "string.length": "Pin length must be 5 digit",
    }),
    role: joi.string().valid("user", "agent").required().messages({
      "any.required": "Role is required",
    }),
  });
  return schema.validate(userInfo);
};

const validateTransactionInfo = (transactionInfo) => {
  const schema = joi.object({
    senderMobile: joi.string().required().messages({
      "any.required": "Sender mobile number is required",
    }),
    receiverMobile: joi.string().required().messages({
      "any.required": "Receiver mobile number is required",
    }),
    type: joi
      .string()
      .valid(
        "send_money",
        "cash_in",
        "cash_out",
        "withdrawal",
        "balance_recharge"
      )
      .required()
      .messages({
        "any.required": "Type is required",
        "any.only": "Invalid type provided",
      }),
    amount: joi.number().min(1).required().messages({
      "any.required": "Amount is required",
      "number.min": "Amount must be greater than 0",
    }),
  });

  return schema.validate(transactionInfo);
};

module.exports = {
  validateUserInfo,
  validateTransactionInfo,
};
