const { Router } = require('express');
const { authController } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authRateLimit } = require('../middleware/rateLimit.middleware');
const { registerSchema, loginSchema, refreshSchema } = require('../models/dto');

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

module.exports = router;