const { Router } = require('express');
const { ledgerController } = require('../controllers/ledger.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/:circleId/ledger', ledgerController.getCircleLedger);
router.get('/:circleId/balance', ledgerController.getBalance);

module.exports = router;