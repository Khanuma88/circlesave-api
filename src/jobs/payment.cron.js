const { Queue, Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { paymentService } = require('../services/payment.service');
const { prisma } = require('../config/database');
const { logger } = require('../config/logger');

const paymentQueue = new Queue('payments', {
  connection: redis,
});

const worker = new Worker('payments', async (job) => {
  logger.info(`Processing job: ${job.name}`, { jobId: job.id });

  if (job.name === 'process-daily-payments') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const duePayments = await prisma.payment.findMany({
      where: {
        status: 'UNPAID',
        dueDate: { gte: today, lt: tomorrow },
      },
      include: {
        circle: true,
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    logger.info(`Found ${duePayments.length} due payments`);

    for (const payment of duePayments) {
      logger.info('Processing payment', {
        paymentId: payment.id,
        userId: payment.userId,
        circleId: payment.circleId,
        amount: payment.amountDue,
      });
    }

    return { processed: duePayments.length };
  }
}, { connection: redis });

worker.on('completed', (job) => {
  logger.info(`Job completed: ${job.name}`, { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.name}`, { jobId: job.id, error: err.message });
});

const schedulePaymentJobs = async () => {
  await paymentQueue.add(
    'process-daily-payments',
    {},
    {
      repeat: { cron: '0 9 * * *' },
      jobId: 'daily-payments',
    }
  );
  logger.info('Payment cron jobs scheduled');
};

module.exports = { paymentQueue, schedulePaymentJobs };