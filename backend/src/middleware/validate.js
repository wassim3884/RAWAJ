const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    // `error` (singular) matches what the frontend reads for toast messages;
    // `errors` (full list) is kept for anything that wants per-field detail.
    return res.status(422).json({ error: details[0].message, errors: details });
  }
  next();
};
