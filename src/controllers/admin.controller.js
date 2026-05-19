const { prisma } = require('../config/database');
const { logger } = require('../config/logger');
const { CircleStatus } = require('../models/enums');

const adminController = {
  async getAllUsers(req, res, next) {
    try {
      const { cursor, limit = '20' } = req.query;

      const users = await prisma.user.findMany({
        take: parseInt(limit) + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          trustScore: true,
          verifiedEmail: true,
          createdAt: true,
        },
      });

      let nextCursor;
      if (users.length > parseInt(limit)) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      res.status(200).json({ status: 200, data: { users, nextCursor } });
    } catch (error) { next(error); }
  },

  async getAllCircles(req, res, next) {
    try {
      const circles = await prisma.circle.findMany({
        orderBy: { id: 'desc' },
        include: {
          organizer: { select: { id: true, phone: true, firstName: true } },
          _count: { select: { memberships: true } },
        },
      });

      res.status(200).json({ status: 200, data: circles });
    } catch (error) { next(error); }
  },

  async freezeCircle(req, res, next) {
    try {
      const { circleId } = req.params;

      const circle = await prisma.circle.update({
        where: { id: circleId },
        data: { status: CircleStatus.FROZEN },
      });

      logger.info('Circle frozen by admin', { circleId, adminId: req.user.userId });
      res.status(200).json({ status: 200, data: circle });
    } catch (error) { next(error); }
  },

  async unfreezeCircle(req, res, next) {
    try {
      const { circleId } = req.params;

      const circle = await prisma.circle.update({
        where: { id: circleId },
        data: { status: CircleStatus.ACTIVE },
      });

      logger.info('Circle unfrozen by admin', { circleId, adminId: req.user.userId });
      res.status(200).json({ status: 200, data: circle });
    } catch (error) { next(error); }
  },

  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          phone: true,
          email: true,
          role: true,
        },
      });

      logger.info('User role updated by admin', { userId, role, adminId: req.user.userId });
      res.status(200).json({ status: 200, data: user });
    } catch (error) { next(error); }
  },


  async getLedgerEntries(req, res, next) {
    try {
      const { cursor, limit = '20' } = req.query;

      const entries = await prisma.ledgerEntry.findMany({
        take: parseInt(limit) + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, phone: true, firstName: true } },
          circle: { select: { id: true, name: true } },
        },
      });

      let nextCursor;
      if (entries.length > parseInt(limit)) {
        const nextItem = entries.pop();
        nextCursor = nextItem?.id;
      }

      res.status(200).json({ status: 200, data: { entries, nextCursor } });
    } catch (error) { next(error); }
  },

  async getAuditLogs(req, res, next) {
  try {
    const { cursor, limit = '20' } = req.query;

    const logs = await prisma.auditLog.findMany({
      take: parseInt(limit) + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { changedAt: 'desc' },
    });

    let nextCursor;
    if (logs.length > parseInt(limit)) {
      const nextItem = logs.pop();
      nextCursor = nextItem?.id;
    }

    res.status(200).json({ status: 200, data: { logs, nextCursor } });
  } catch (error) { next(error); }
},

  async getDashboard(req, res, next) {
    try {
      const totalUsers = await prisma.user.count();
      const totalCircles = await prisma.circle.count();
      const activeCircles = await prisma.circle.count({ where: { status: 'ACTIVE' } });
      const totalPayments = await prisma.payment.count();
      const totalLedgerEntries = await prisma.ledgerEntry.count();

      res.status(200).json({
        status: 200,
        data: {
          totalUsers,
          totalCircles,
          activeCircles,
          totalPayments,
          totalLedgerEntries,
        },
      });
    } catch (error) { next(error); }
  },
};

module.exports = { adminController };