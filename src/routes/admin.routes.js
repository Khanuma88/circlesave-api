const { Router } = require('express');
const { adminController } = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { UserRole } = require('../models/enums');

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.get('/circles', adminController.getAllCircles);
router.patch('/circles/:circleId/freeze', adminController.freezeCircle);
router.patch('/circles/:circleId/unfreeze', adminController.unfreezeCircle);
router.get('/ledger', adminController.getLedgerEntries);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;