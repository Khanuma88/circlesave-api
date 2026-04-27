const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return bcryptjs.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};