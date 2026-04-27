const { ledgerService } = require('../../src/services/ledger.service');
const { LedgerAccount } = require('../../src/models/enums');
const { prisma } = require('../../src/config/database');
const { redis } = require('../../src/config/redis');

describe('LedgerService', () => {
  let testCircleId;
  let testUserId;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { phone: '+77000000000', passwordHash: 'test', firstName: 'Test', lastName: 'User' },
    });
    testUserId = user.id;

    const circle = await prisma.circle.create({
      data: { name: 'Test Circle', contributionAmount: 10000, memberCount: 5, organizerId: user.id, status: 'FORMING' },
    });
    testCircleId = circle.id;
  });

  afterAll(async () => {
    await prisma.ledgerEntry.deleteMany();
    await prisma.circle.deleteMany({ where: { id: testCircleId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await redis.quit();
  });

  beforeEach(async () => {
    await prisma.ledgerEntry.deleteMany();
    await redis.flushdb();
  });

  it('should create balanced double-entry transaction', async () => {
    const result = await ledgerService.createDoubleEntry({
      circleId: testCircleId,
      userId: testUserId,
      amount: 10000,
      debitAccount: LedgerAccount.MEMBER_RECEIVABLE,
      creditAccount: LedgerAccount.CIRCLE_POT,
      description: 'Test contribution',
      idempotencyKey: 'test-key-1',
    });

    expect(Number(result.debitEntry.amount)).toBe(Number(result.creditEntry.amount));
    expect(result.transactionId).toBeDefined();
  });

  it('should reject duplicate idempotency key', async () => {
    await ledgerService.createDoubleEntry({
      circleId: testCircleId,
      userId: testUserId,
      amount: 5000,
      debitAccount: LedgerAccount.MEMBER_RECEIVABLE,
      creditAccount: LedgerAccount.CIRCLE_POT,
      description: 'Test',
      idempotencyKey: 'duplicate-key',
    });

    await expect(
      ledgerService.createDoubleEntry({
        circleId: testCircleId,
        userId: testUserId,
        amount: 5000,
        debitAccount: LedgerAccount.MEMBER_RECEIVABLE,
        creditAccount: LedgerAccount.CIRCLE_POT,
        description: 'Duplicate',
        idempotencyKey: 'duplicate-key',
      })
    ).rejects.toThrow('Duplicate transaction');
  });

  it('should verify transaction integrity', async () => {
    const { transactionId } = await ledgerService.createDoubleEntry({
      circleId: testCircleId,
      userId: testUserId,
      amount: 15000,
      debitAccount: LedgerAccount.MEMBER_RECEIVABLE,
      creditAccount: LedgerAccount.CIRCLE_POT,
      description: 'Integrity test',
      idempotencyKey: 'integrity-key',
    });

    const isValid = await ledgerService.verifyTransactionIntegrity(transactionId);
    expect(isValid).toBe(true);
  });
});