const { prisma } = require('../config/database');
const { LedgerAccount, LedgerType } = require('../models/enums');
const { generateIdempotencyKey, checkIdempotency, storeIdempotency } = require('../utils/idempotency');
const { logger } = require('../config/logger');
const { randomUUID } = require('crypto');

class LedgerService {
  async createDoubleEntry(params) {
    const { circleId, userId, amount, debitAccount, creditAccount, description, idempotencyKey } = params;

    const isDuplicate = await checkIdempotency(idempotencyKey);
    if (isDuplicate) {
      const error = new Error('Duplicate transaction');
      error.status = 409;
      error.code = 'DUPLICATE_TRANSACTION';
      throw error;
    }

    const transactionId = randomUUID();

    const [debitEntry, creditEntry] = await prisma.$transaction(async (tx) => {
      const debit = await tx.ledgerEntry.create({
        data: {
          transactionId,
          circleId,
          userId,
          entryType: LedgerType.DEBIT,
          account: debitAccount,
          amount,
          description: `${description} (DEBIT)`,
          idempotencyKey: `${idempotencyKey}:debit`,
        },
      });

      const credit = await tx.ledgerEntry.create({
        data: {
          transactionId,
          circleId,
          userId,
          entryType: LedgerType.CREDIT,
          account: creditAccount,
          amount,
          description: `${description} (CREDIT)`,
          idempotencyKey: `${idempotencyKey}:credit`,
        },
      });

      return [debit, credit];
    }, { isolationLevel: 'Serializable' });

    await storeIdempotency(idempotencyKey, transactionId);

    logger.info('Double-entry recorded', { transactionId, circleId, amount });

    return { transactionId, debitEntry, creditEntry };
  }

  async recordMemberContribution(circleId, userId, amount, cycleNumber) {
    const idempotencyKey = generateIdempotencyKey([
      'circle', circleId, 'user', userId, 'cycle', cycleNumber.toString(), 'action', 'contribution'
    ]);

    return this.createDoubleEntry({
      circleId, userId, amount,
      debitAccount: LedgerAccount.MEMBER_RECEIVABLE,
      creditAccount: LedgerAccount.CIRCLE_POT,
      description: `Member contribution cycle ${cycleNumber}`,
      idempotencyKey,
    });
  }

  async getCircleBalance(circleId, account) {
    const result = await prisma.ledgerEntry.groupBy({
      by: ['entryType'],
      where: { circleId, account },
      _sum: { amount: true },
    });

    const debits = result.find(r => r.entryType === LedgerType.DEBIT)?._sum.amount || 0;
    const credits = result.find(r => r.entryType === LedgerType.CREDIT)?._sum.amount || 0;

    return { debits, credits, net: Number(debits) - Number(credits) };
  }

  async verifyTransactionIntegrity(transactionId) {
    const entries = await prisma.ledgerEntry.findMany({ where: { transactionId } });
    if (entries.length !== 2) return false;

    const debit = entries.find(e => e.entryType === LedgerType.DEBIT);
    const credit = entries.find(e => e.entryType === LedgerType.CREDIT);

    if (!debit || !credit) return false;
    return Number(debit.amount) === Number(credit.amount);
  }
}

const ledgerService = new LedgerService();
module.exports = { ledgerService };