const { ledgerService } = require('../services/ledger.service');
const { LedgerAccount } = require('../models/enums');
const { prisma } = require('../config/database');

const ledgerController = {
  async getCircleLedger(req, res, next) {
    try {
      const { circleId } = req.params;
      const { cursor, limit = '20' } = req.query;

      const entries = await prisma.ledgerEntry.findMany({
        where: { circleId },
        take: parseInt(limit) + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, phone: true, firstName: true } } },
      });

      let nextCursor;
      if (entries.length > parseInt(limit)) {
        const nextItem = entries.pop();
        nextCursor = nextItem?.id;
      }

      res.status(200).json({ status: 200, data: { entries, nextCursor } });
    } catch (error) { next(error); }
  },

  async getBalance(req, res, next) {
    try {
      const balance = await ledgerService.getCircleBalance(req.params.circleId, LedgerAccount.CIRCLE_POT);
      res.status(200).json({ status: 200, data: balance });
    } catch (error) { next(error); }
  },
};

module.exports = { ledgerController };