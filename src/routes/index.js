const { Router } = require('express');
const authRoutes = require('./auth.routes');
const circleRoutes = require('./circle.routes');
const ledgerRoutes = require('./ledger.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/circles', circleRoutes);
router.use('/circles', ledgerRoutes);

module.exports = router;