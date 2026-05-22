const { prisma } = require('../config/database');
const { redis } = require('../config/redis');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/crypto');
const { logger } = require('../config/logger');
const { emailService } = require('./email.service');

const REFRESH_TOKEN_PREFIX = 'refresh:';

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class AuthService {
  async register(dto) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingPhone) {
      const error = new Error('Phone already registered');
      error.status = 409;
      error.code = 'PHONE_EXISTS';
      throw error;
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      const error = new Error('Email already registered');
      error.status = 409;
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    const passwordHash = await hashPassword(dto.password);
    const verificationCode = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: expiry,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        trustScore: true,
        verifiedEmail: true,
        createdAt: true,
      },
    });

    try {
      await emailService.sendVerificationEmail(dto.email, dto.firstName || 'User', verificationCode);
      logger.info('Verification email sent', { userId: user.id });
    } catch (emailError) {
      logger.error('Failed to send verification email', { error: emailError.message });
    }

    logger.info('User registered', { userId: user.id });
    return user;
  }

  async verifyEmail(dto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (user.verifiedEmail) {
      const error = new Error('Email already verified');
      error.status = 409;
      error.code = 'ALREADY_VERIFIED';
      throw error;
    }

    if (user.emailVerificationCode !== dto.code) {
      const error = new Error('Invalid verification code');
      error.status = 400;
      error.code = 'INVALID_CODE';
      throw error;
    }

    if (new Date() > user.emailVerificationExpiry) {
      const error = new Error('Verification code expired');
      error.status = 400;
      error.code = 'CODE_EXPIRED';
      throw error;
    }

    await prisma.user.update({
      where: { email: dto.email },
      data: {
        verifiedEmail: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    logger.info('Email verified', { userId: user.id });
    return { message: 'Email verified successfully' };
  }

  async login(dto) {
    const user = await prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.verifiedEmail) {
      const error = new Error('Please verify your email first');
      error.status = 403;
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${user.id}:${refreshToken}`,
      7 * 24 * 60 * 60,
      'valid'
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore,
      },
    };
  }

  async forgotPassword(dto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If email exists, reset code will be sent' };
    }

    const resetCode = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email: dto.email },
      data: {
        passwordResetCode: resetCode,
        passwordResetExpiry: expiry,
      },
    });

    try {
      await emailService.sendPasswordResetEmail(dto.email, user.firstName || 'User', resetCode);
      logger.info('Password reset email sent', { userId: user.id });
    } catch (emailError) {
      logger.error('Failed to send password reset email', { error: emailError.message });
    }

    logger.info('Password reset requested', { userId: user.id });
    return { message: 'If email exists, reset code will be sent' };
  }

  async resetPassword(dto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.passwordResetCode !== dto.code) {
      const error = new Error('Invalid reset code');
      error.status = 400;
      error.code = 'INVALID_CODE';
      throw error;
    }

    if (new Date() > user.passwordResetExpiry) {
      const error = new Error('Reset code expired');
      error.status = 400;
      error.code = 'CODE_EXPIRED';
      throw error;
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await prisma.user.update({
      where: { email: dto.email },
      data: {
        passwordHash,
        passwordResetCode: null,
        passwordResetExpiry: null,
      },
    });

    logger.info('Password reset successful', { userId: user.id });
    return { message: 'Password reset successfully' };
  }

  async refresh(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const keys = await redis.keys(`${REFRESH_TOKEN_PREFIX}${decoded.userId}:*`);
      const isValid = keys.some(k => k.includes(refreshToken));

      if (!isValid) throw new Error('Token revoked');

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) throw new Error('User not found');

      const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
      const newRefreshToken = generateRefreshToken({ userId: user.id });

      const oldKey = keys.find(k => k.includes(refreshToken));
      if (oldKey) await redis.del(oldKey);

      await redis.setex(
        `${REFRESH_TOKEN_PREFIX}${user.id}:${newRefreshToken}`,
        7 * 24 * 60 * 60,
        'valid'
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 };
    } catch {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }
  }

  async logout(userId, refreshToken) {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}:${refreshToken}`);
    logger.info('User logged out', { userId });
  }
}

const authService = new AuthService();
module.exports = { authService };