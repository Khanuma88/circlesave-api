const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');

const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };