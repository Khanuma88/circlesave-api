const { Router } = require('express');
const { circleController } = require('../controllers/circle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createCircleSchema } = require('../models/dto');
const { UserRole } = require('../models/enums');

const router = Router();

router.use(authenticate);

router.post('/', requireRole(UserRole.ORGANIZER, UserRole.ADMIN), validate(createCircleSchema), circleController.create);
router.get('/', circleController.list);
router.get('/:circleId', circleController.getById);
router.post('/:circleId/join', circleController.join);

module.exports = router;