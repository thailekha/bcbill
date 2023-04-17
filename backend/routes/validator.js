const Joi = require('joi');
const auth = require("../services/auth");

function walletRequired(req, res, next) {
  if (!auth.isLoggedIn(req)) {
    req.flash('danger', 'Please login first');
    res.redirect(PREFIX + '/login');
  } else {
    next();
  }
}

function validator(schema) {
  return (req, res, next) => {
    const { error, value } = Joi.object(schema).validate(req.body);
    if (error) {
      req.flash('danger', error.details.map(detail => detail.message).join('\n'));
      res.redirect('/ui' + req.route.path);
    } else {
      req.body = value;
      next();
    }
  };
}

module.exports = {
  walletRequired,
  validator
};