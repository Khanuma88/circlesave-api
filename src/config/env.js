const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.development' });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().regex(/^postgresql:\/\//, 'Must be postgresql://'),
  REDIS_URL: z.string().regex(/^redis:\/\//, 'Must be redis://'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('5').transform(Number),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const env = envSchema.parse(process.env);

module.exports = { env };