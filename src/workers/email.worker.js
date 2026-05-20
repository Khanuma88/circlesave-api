const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { emailService } = require('../services/email.service');
const { logger } = require('../config/logger');

const emailWorker = new Worker('emails', async (job) => {
  const { type, to, data } = job.data;
  
  logger.info(`Processing email job: ${type} to ${to}`, { jobId: job.id });
  
  try {
    switch(type) {
      case 'verification':
        await emailService.sendVerificationEmail(to, data.name, data.code);
        break;
        
      case 'password_reset':
        await emailService.sendPasswordResetEmail(to, data.name, data.code);
        break;
        
      case 'payout':
        await emailService.sendPayoutNotification(to, data.name, data.amount, data.circleId);
        break;
        
      case 'circle_join':
        await emailService.sendCircleJoinNotification(to, data.name, data.circleName, data.position);
        break;
        
      case 'payment_reminder':
        await emailService.sendPaymentReminder(to, data.name, data.circleName, data.amount);
        break;
        
      default:
        logger.warn(`Unknown email type: ${type}`);
    }
    
    logger.info(`Email sent successfully: ${type} to ${to}`);
    return { success: true, type, to };
    
  } catch (error) {
    logger.error(`Failed to send email: ${type} to ${to}`, { error: error.message });
    throw error;
  }
}, {
  connection: redis,
  concurrency: 5,
});

emailWorker.on('completed', (job) => {
  logger.info(`Email job completed: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job failed: ${job.id}`, { error: err.message });
});

emailWorker.on('error', (err) => {
  logger.error('Email worker error:', err);
});

logger.info('Email worker started');

module.exports = { emailWorker };