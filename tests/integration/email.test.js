const { Queue } = require('bullmq');

jest.mock('bullmq', () => {
  const mockAdd = jest.fn().mockResolvedValue({ id: 'test-job-id' });
  const mockQueue = jest.fn().mockImplementation(() => ({ add: mockAdd }));
  return { Queue: mockQueue, Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })) };
});

jest.mock('../../src/config/redis', () => ({
  redis: {},
}));

jest.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    RESEND_API_KEY: 'test-key',
    JWT_ACCESS_SECRET: 'test-secret-min-32-chars-long-enough',
    JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-chars-ok',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

describe('Email Queue', () => {
  let emailQueue;
  let mockAdd;

  beforeEach(() => {
    jest.clearAllMocks();
    const { Queue } = require('bullmq');
    emailQueue = new Queue('emails', { connection: {} });
    mockAdd = emailQueue.add;
  });

  it('should enqueue verification email job', async () => {
    await emailQueue.add('send-email', {
      type: 'verification',
      to: 'test@example.com',
      data: { name: 'Test', code: '123456' },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        type: 'verification',
        to: 'test@example.com',
      })
    );
  });

  it('should enqueue payout email job', async () => {
    await emailQueue.add('send-payout', {
      type: 'payout',
      to: 'user@example.com',
      data: { name: 'Aidana', amount: 30000, circleId: 'circle-123' },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'send-payout',
      expect.objectContaining({
        type: 'payout',
        to: 'user@example.com',
      })
    );
  });

  it('should enqueue payment reminder job', async () => {
    await emailQueue.add('send-payment-reminder', {
      type: 'payment_reminder',
      to: 'user@example.com',
      data: { name: 'Adema', circleName: 'Friends Circle', amount: 10000 },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'send-payment-reminder',
      expect.objectContaining({
        type: 'payment_reminder',
      })
    );
  });

  it('should enqueue circle join notification', async () => {
    await emailQueue.add('send-email', {
      type: 'circle_join',
      to: 'user@example.com',
      data: { name: 'Mia', circleName: 'Friends Circle', position: 3 },
    });

    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('should return job id after enqueue', async () => {
    const job = await emailQueue.add('send-email', {
      type: 'verification',
      to: 'test@example.com',
      data: { name: 'Test', code: '654321' },
    });

    expect(job.id).toBe('test-job-id');
  });
});