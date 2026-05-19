const { prisma } = require('../config/database');
const { logger } = require('../config/logger');

const createAuditLog = async (tableName, recordId, action, newValue, changedBy, oldValue = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        oldValue,
        newValue,
        changedBy,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error: error.message });
  }
};

module.exports = { createAuditLog };