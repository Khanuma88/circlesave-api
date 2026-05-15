const { z } = require('zod');

const registerSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, 'Phone must be +7XXXXXXXXXX format'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

const createCircleSchema = z.object({
  name: z.string().min(3).max(100),
  contributionAmount: z.number().positive().min(5000).max(500000),
  memberCount: z.number().int().min(3).max(20),
  startDate: z.string().datetime(),
  cycleLengthDays: z.number().int().default(30),
});

const makePaymentSchema = z.object({
  cycleNumber: z.number().int().positive(),
  amount: z.number().positive(),
});

const calculatePayoutSchema = z.object({
  cycleNumber: z.number().int().positive(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createCircleSchema,
  makePaymentSchema,
  calculatePayoutSchema,
};