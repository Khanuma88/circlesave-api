const { Resend } = require('resend');
const { env } = require('../config/env');
const { logger } = require('../config/logger');

const resend = new Resend(env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';
const TEST_EMAIL = 'zamirovahanuma20@gmail.com';

const getRecipient = (to) => {
  if (env.NODE_ENV === 'development') return TEST_EMAIL;
  return to;
};

class EmailService {
  async sendVerificationEmail(to, firstName, code) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: getRecipient(to),
        subject: 'CircleSave — Verify your email',
        html: `
          <h2>Hello, ${firstName}!</h2>
          <p>Your verification code:</p>
          <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
          <p>This code expires in 15 minutes.</p>
          <p>If you did not register, please ignore this email.</p>
        `,
      });
      logger.info('Verification email sent', { to });
    } catch (error) {
      logger.error('Failed to send verification email', { error: error.message });
      throw error;
    }
  }

  async sendPasswordResetEmail(to, firstName, code) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: getRecipient(to),
        subject: 'CircleSave — Password Reset',
        html: `
          <h2>Hello, ${firstName}!</h2>
          <p>Your password reset code:</p>
          <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
          <p>This code expires in 15 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        `,
      });
      logger.info('Password reset email sent', { to });
    } catch (error) {
      logger.error('Failed to send password reset email', { error: error.message });
      throw error;
    }
  }

  async sendPayoutNotification(to, firstName, amount, circleId) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: getRecipient(to),
        subject: 'CircleSave — Your Payout is Ready!',
        html: `
          <h2>Congratulations, ${firstName}!</h2>
          <p>Your payout from the savings circle is ready.</p>
          <h2 style="color: #10B981;">${amount} KZT</h2>
          <p>Circle ID: ${circleId}</p>
          <p>Thank you for being part of CircleSave!</p>
        `,
      });
      logger.info('Payout notification sent', { to, amount });
    } catch (error) {
      logger.error('Failed to send payout notification', { error: error.message });
      throw error;
    }
  }

  async sendCircleJoinNotification(to, firstName, circleName, position) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: getRecipient(to),
        subject: 'CircleSave — You joined a circle!',
        html: `
          <h2>Welcome, ${firstName}!</h2>
          <p>You have successfully joined the savings circle <strong>${circleName}</strong>.</p>
          <p>Your position in the rotation: <strong>#${position}</strong></p>
          <p>Good luck and happy saving!</p>
        `,
      });
      logger.info('Circle join notification sent', { to, circleName });
    } catch (error) {
      logger.error('Failed to send circle join notification', { error: error.message });
      throw error;
    }
  }

  async sendPaymentReminder(to, firstName, circleName, amount) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: getRecipient(to),
        subject: 'CircleSave — Payment Reminder',
        html: `
          <h2>Hello, ${firstName}!</h2>
          <p>This is a reminder that your payment for the savings circle <strong>${circleName}</strong> is due.</p>
          <h2 style="color: #EF4444;">${amount} KZT</h2>
          <p>Please make your payment as soon as possible to avoid late fees.</p>
          <p>Thank you for being part of CircleSave!</p>
        `,
      });
      logger.info('Payment reminder sent', { to, circleName, amount });
    } catch (error) {
      logger.error('Failed to send payment reminder', { error: error.message });
      throw error;
    }
  }
}

const emailService = new EmailService();
module.exports = { emailService };