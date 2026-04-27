const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const authRateLimit = env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      message: { status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = { authRateLimit };