const { redis } = require('../config/redis');

const IDEMPOTENCY_TTL = 86400;

const generateIdempotencyKey = (parts) => {
  return parts.join(':');
};

const checkIdempotency = async (key) => {
  const exists = await redis.get(`idempotency:${key}`);
  return exists !== null;
};

const storeIdempotency = async (key, transactionId) => {
  await redis.setex(`idempotency:${key}`, IDEMPOTENCY_TTL, transactionId);
};

module.exports = {
  generateIdempotencyKey,
  checkIdempotency,
  storeIdempotency,
};