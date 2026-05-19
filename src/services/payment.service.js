const { prisma } = require('../config/database');
const { PaymentStatus, LedgerAccount } = require('../models/enums');
const { ledgerService } = require('./ledger.service');
const { emailService } = require('./email.service');
const { logger } = require('../config/logger');
const { randomUUID } = require('crypto');
const { createAuditLog } = require('../utils/audit');

class PaymentService {
  async createPaymentSchedule(circleId) {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { memberships: { include: { user: true } } },
    });

    if (!circle) {
      const error = new Error('Circle not found');
      error.status = 404;
      error.code = 'CIRCLE_NOT_FOUND';
      throw error;
    }

    const payments = [];

    for (const membership of circle.memberships) {
      for (let cycle = 1; cycle <= circle.memberCount; cycle++) {
        const dueDate = new Date(circle.startDate);
        dueDate.setDate(dueDate.getDate() + (cycle - 1) * circle.cycleLengthDays);

        const payment = await prisma.payment.create({
          data: {
            circleId,
            userId: membership.userId,
            cycleNumber: cycle,
            amountDue: circle.contributionAmount,
            dueDate,
            idempotencyKey: `circle:${circleId}:user:${membership.userId}:cycle:${cycle}:payment`,
          },
        });

        payments.push(payment);
      }
    }

    logger.info('Payment schedule created', { circleId, count: payments.length });
    return payments;
  }

  async makePayment(circleId, userId, cycleNumber, amount) {
    const payment = await prisma.payment.findUnique({
      where: {
        circleId_userId_cycleNumber: { circleId, userId, cycleNumber },
      },
      include: {
        user: { select: { email: true, firstName: true } },
        circle: { select: { name: true, contributionAmount: true } },
      },
    });

    if (!payment) {
      const error = new Error('Payment not found');
      error.status = 404;
      error.code = 'PAYMENT_NOT_FOUND';
      throw error;
    }

    if (payment.status === PaymentStatus.PAID) {
      const error = new Error('Payment already completed');
      error.status = 409;
      error.code = 'ALREADY_PAID';
      throw error;
    }

    const totalPaid = Number(payment.amountPaid) + amount;
    const amountDue = Number(payment.amountDue);

    let newStatus;
    if (totalPaid >= amountDue) {
      newStatus = PaymentStatus.PAID;
    } else if (totalPaid / amountDue >= 0.7) {
      newStatus = PaymentStatus.PARTIAL_70;
    } else {
      newStatus = PaymentStatus.PARTIAL_50;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        amountPaid: totalPaid,
        status: newStatus,
        paidAt: newStatus === PaymentStatus.PAID ? new Date() : null,
      },
    });

    await ledgerService.recordMemberContribution(circleId, userId, amount, cycleNumber);

    if (newStatus === PaymentStatus.PAID && payment.user.email) {
      await emailService.sendPayoutNotification(
        payment.user.email,
        payment.user.firstName || 'User',
        amount,
        circleId
      );
    }

    await createAuditLog(
  'payments',
  updatedPayment.id,
  'PAYMENT_MADE',
  { status: newStatus, amountPaid: totalPaid },
  userId,
  { status: payment.status, amountPaid: Number(payment.amountPaid) }
);

    logger.info('Payment made', { circleId, userId, cycleNumber, amount, status: newStatus });
    return updatedPayment;
  }

  async getPaymentSchedule(circleId, userId) {
    const payments = await prisma.payment.findMany({
      where: { circleId, userId },
      orderBy: { cycleNumber: 'asc' },
    });

    return payments;
  }

  async calculatePayout(circleId, cycleNumber) {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        memberships: {
          orderBy: { positionInRotation: 'asc' },
          include: { user: { select: { email: true, firstName: true } } },
        },
      },
    });

    if (!circle) {
      const error = new Error('Circle not found');
      error.status = 404;
      error.code = 'CIRCLE_NOT_FOUND';
      throw error;
    }

    const payments = await prisma.payment.findMany({
      where: { circleId, cycleNumber },
    });

    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const recipient = circle.memberships[cycleNumber - 1];

    if (!recipient) {
      const error = new Error('No recipient for this cycle');
      error.status = 404;
      error.code = 'NO_RECIPIENT';
      throw error;
    }

    await ledgerService.recordPayout(
      circleId,
      recipient.userId,
      totalCollected,
      cycleNumber
    );

    if (recipient.user.email) {
      await emailService.sendPayoutNotification(
        recipient.user.email,
        recipient.user.firstName || 'User',
        totalCollected,
        circleId
      );
    }
    
    await createAuditLog(
  'payments',
  circleId,
  'PAYOUT_PROCESSED',
  { cycleNumber, totalCollected, recipientId: recipient.userId },
  'SYSTEM'
);

    logger.info('Payout calculated', { circleId, cycleNumber, totalCollected, recipientId: recipient.userId });

    return {
      cycleNumber,
      totalCollected,
      recipientId: recipient.userId,
      recipientPosition: cycleNumber,
    };
  }
}

const paymentService = new PaymentService();
module.exports = { paymentService };