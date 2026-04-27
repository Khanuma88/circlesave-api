const { app } = require('./app');
const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { prisma } = require('./config/database');
const { redis } = require('./config/redis');

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await redis.ping();
    logger.info('Redis connected');

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Swagger UI: http://localhost:${env.PORT}/docs`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();