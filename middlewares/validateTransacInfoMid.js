const customError = require("../utils/customError");
const { validateTransactionInfo } = require("../utils/validate");

const validateTransacInfoMid = (req, res, next) => {
  try {
    const transacInfo = req.body;

    const { error, value: validatedTransacInfo } =
      validateTransactionInfo(transacInfo);

    if (error) {
      throw customError(400, error.message);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateTransacInfoMid;
