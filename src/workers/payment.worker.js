const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { prisma } = require('../config/database');
const { emailService } = require('../services/email.service');
const { logger } = require('../config/logger');
const { emailQueue } = require('../services/auth.service');

const paymentWorker = new Worker('payments', async (job) => {
  logger.info(`Processing payment job: ${job.name}`, { jobId: job.id });

  if (job.name === 'process-daily-payments') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const duePayments = await prisma.payment.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL_50', 'PARTIAL_70'] },
        dueDate: { lt: tomorrow },
        paidAt: null,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
        circle: { select: { id: true, name: true } },
      },
    });

    logger.info(`Found ${duePayments.length} due payments`);

    for (const payment of duePayments) {
      if (payment.user.email) {
        await emailQueue.add('send-payment-reminder', {
          type: 'payment_reminder',
          to: payment.user.email,
          data: {
            name: payment.user.firstName || 'User',
            circleName: payment.circle.name,
            amount: payment.amountDue,
            dueDate: payment.dueDate,
          },
        }, {
          jobId: `reminder-${payment.id}-${Date.now()}`,
        });
      }
    }

    return { processed: duePayments.length };
  }

  if (job.name === 'process-payout') {
    const { circleId, cycleNumber, userId, amount } = job.data;
    
    logger.info(`Processing payout`, { circleId, cycleNumber, userId, amount });
    
    return { success: true, circleId, cycleNumber };
  }

}, { 
  connection: redis,
  concurrency: 3,
});

paymentWorker.on('completed', (job) => {
  logger.info(`Payment job completed: ${job.name}`, { jobId: job.id });
});

paymentWorker.on('failed', (job, err) => {
  logger.error(`Payment job failed: ${job.name}`, { jobId: job.id, error: err.message });
});

paymentWorker.on('error', (err) => {
  logger.error('Payment worker error:', err);
});

logger.info('Payment worker started');

module.exports = { paymentWorker };