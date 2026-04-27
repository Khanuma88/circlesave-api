const { Prisma } = require('@prisma/client');
const { logger } = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', { error: err.message, path: req.path });

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ status: 409, code: 'CONFLICT', message: 'Resource already exists' });
    if (err.code === 'P2025') return res.status(404).json({ status: 404, code: 'NOT_FOUND', message: 'Resource not found' });
  }

  if (err.name === 'JsonWebTokenError') return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'Token expired' });

  res.status(err.status || 500).json({
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

module.exports = { errorHandler };