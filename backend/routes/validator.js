const Joi = require('joi');

const email = Joi.string().email().required();
const username = Joi.string().alphanum().min(3).max(30).required();
const isProvider = Joi.boolean().default(false).truthy('on');
const wallet = Joi.string().custom((value, helpers) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return helpers.error('any.custom', { message: 'Invalid JSON Wallet' });
  }
});

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
  email,
  username,
  isProvider,
  wallet,
  validator
};