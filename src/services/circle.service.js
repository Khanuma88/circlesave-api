const { prisma } = require('../config/database');
const { CircleStatus } = require('../models/enums');
const { logger } = require('../config/logger');
const { emailService } = require('./email.service');

class CircleService {
  async createCircle(dto, organizerId) {
    const startDate = new Date(dto.startDate);
    const minStartDate = new Date();
    minStartDate.setDate(minStartDate.getDate() + 7);

    if (startDate < minStartDate) {
      const error = new Error('Start date must be at least 7 days in the future');
      error.status = 400;
      error.code = 'INVALID_START_DATE';
      throw error;
    }

    const circle = await prisma.circle.create({
      data: {
        name: dto.name,
        contributionAmount: dto.contributionAmount,
        memberCount: dto.memberCount,
        startDate,
        cycleLengthDays: dto.cycleLengthDays,
        organizerId,
        status: CircleStatus.FORMING,
      },
      include: {
        organizer: {
          select: { id: true, phone: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Circle created', { circleId: circle.id, organizerId });
    return circle;
  }

  async getCircleById(circleId, userId) {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        organizer: { select: { id: true, phone: true, firstName: true } },
        memberships: {
          include: {
            user: { select: { id: true, phone: true, firstName: true, trustScore: true } },
          },
        },
      },
    });

    if (!circle) {
      const error = new Error('Circle not found');
      error.status = 404;
      error.code = 'CIRCLE_NOT_FOUND';
      throw error;
    }

    const isMember = circle.memberships.some(m => m.userId === userId);
    const isOrganizer = circle.organizerId === userId;

    if (!isMember && !isOrganizer) {
      const error = new Error('Access denied');
      error.status = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return circle;
  }

  async listCircles(cursor, limit = 20, status) {
    const where = status ? { status } : {};

    const circles = await prisma.circle.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'desc' },
      include: {
        organizer: { select: { id: true, phone: true, firstName: true } },
        _count: { select: { memberships: true } },
      },
    });

    let nextCursor;
    if (circles.length > limit) {
      const nextItem = circles.pop();
      nextCursor = nextItem?.id;
    }

    return { data: circles, nextCursor };
  }

  async joinCircle(circleId, userId) {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { memberships: true },
    });

    if (!circle) {
      const error = new Error('Circle not found');
      error.status = 404;
      error.code = 'CIRCLE_NOT_FOUND';
      throw error;
    }

    if (circle.status !== CircleStatus.FORMING) {
      const error = new Error('Circle is not accepting members');
      error.status = 403;
      error.code = 'CIRCLE_NOT_FORMING';
      throw error;
    }

    if (circle.memberships.length >= circle.memberCount) {
      const error = new Error('Circle is full');
      error.status = 409;
      error.code = 'CIRCLE_FULL';
      throw error;
    }

    if (circle.memberships.some(m => m.userId === userId)) {
      const error = new Error('Already a member');
      error.status = 409;
      error.code = 'ALREADY_MEMBER';
      throw error;
    }

    if (circle.organizerId === userId) {
      const error = new Error('Organizer cannot join their own circle');
      error.status = 403;
      error.code = 'ORGANIZER_CANNOT_JOIN';
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true, email: true, firstName: true },
    });

    if (!user || Number(user.trustScore) < 0.4) {
      const error = new Error('Trust score too low');
      error.status = 403;
      error.code = 'TRUST_SCORE_LOW';
      throw error;
    }

    const position = circle.memberships.length + 1;

    const membership = await prisma.circleMembership.create({
      data: {
        circleId,
        userId,
        positionInRotation: position,
      },
      include: {
        user: { select: { id: true, phone: true, firstName: true } },
      },
    });

    if (circle.memberships.length + 1 >= circle.memberCount) {
      await prisma.circle.update({
        where: { id: circleId },
        data: { status: CircleStatus.ACTIVE },
      });
    }

    if (user.email) {
      await emailService.sendCircleJoinNotification(
        user.email,
        user.firstName || 'User',
        circle.name,
        position
      );
    }

    logger.info('User joined circle', { circleId, userId });
    return membership;
  }
}

const circleService = new CircleService();
module.exports = { circleService };