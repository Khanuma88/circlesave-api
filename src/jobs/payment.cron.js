const { logger } = require('../config/logger');

// Заглушка для cron-задач (будет реализовано позже)
const schedulePaymentJobs = () => {
  logger.info('Payment cron jobs scheduled (stub)');
};

module.exports = { schedulePaymentJobs };