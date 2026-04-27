const { prisma } = require('../config/database');
const { redis } = require('../config/redis');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/crypto');
const { logger } = require('../config/logger');

const REFRESH_TOKEN_PREFIX = 'refresh:';

class AuthService {
  async register(dto) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      const error = new Error('Phone already registered');
      error.status = 409;
      error.code = 'PHONE_EXISTS';
      throw error;
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        phone: true,
        role: true,
        trustScore: true,
        createdAt: true,
      },
    });

    logger.info('User registered', { userId: user.id });
    return user;
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
        role: user.role,
        trustScore: user.trustScore,
      },
    };
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