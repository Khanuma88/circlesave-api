const Redis = require('ioredis');
const { env } = require('./env');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const closeRedis = async () => {
  await redis.quit();
};

module.exports = { redis, closeRedis };