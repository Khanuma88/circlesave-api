// Экспортируем enums из Prisma
const { UserRole, CircleStatus, MembershipStatus, PaymentStatus, LedgerAccount, LedgerType } = require('@prisma/client');

module.exports = {
  UserRole,
  CircleStatus,
  MembershipStatus,
  PaymentStatus,
  LedgerAccount,
  LedgerType,
};