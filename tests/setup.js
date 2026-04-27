const { prisma } = require('../src/config/database');

beforeAll(async () => {
  await prisma.$transaction([
    prisma.ledgerEntry.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.circleMembership.deleteMany(),
    prisma.circle.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});