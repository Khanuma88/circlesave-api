const { Router } = require('express');
const authRoutes = require('./auth.routes');
const circleRoutes = require('./circle.routes');
const ledgerRoutes = require('./ledger.routes');
const paymentRoutes = require('./payment.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/circles', circleRoutes);
router.use('/circles', ledgerRoutes);
router.use('/circles', paymentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;