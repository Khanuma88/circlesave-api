const { Router } = require('express');
const { paymentController } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { UserRole } = require('../models/enums');
const { makePaymentSchema, calculatePayoutSchema } = require('../models/dto');

const router = Router();

router.use(authenticate);

router.post('/:circleId/payments/schedule', requireRole(UserRole.ORGANIZER, UserRole.ADMIN), paymentController.createSchedule);
router.get('/:circleId/payments', paymentController.getSchedule);
router.post('/:circleId/payments/pay', validate(makePaymentSchema), paymentController.makePayment);
router.post('/:circleId/payments/payout', requireRole(UserRole.ORGANIZER, UserRole.ADMIN), validate(calculatePayoutSchema), paymentController.calculatePayout);

module.exports = router;