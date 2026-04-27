const { verifyAccessToken } = require('../utils/crypto');
const { prisma } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, phone: true },
    });

    if (!user) {
      return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'User not found' });
    }

    req.user = { userId: user.id, role: user.role, phone: user.phone };
    next();
  } catch {
    return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };