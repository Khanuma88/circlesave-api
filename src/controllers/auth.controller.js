const { authService } = require('../services/auth.service');

const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ status: 201, data: user });
    } catch (error) { next(error); }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ status: 200, data: result });
    } catch (error) { next(error); }
  },

  async refresh(req, res, next) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.status(200).json({ status: 200, data: result });
    } catch (error) { next(error); }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.userId, req.body.refreshToken);
      res.status(200).json({ status: 200, message: 'Logged out successfully' });
    } catch (error) { next(error); }
  },
};

module.exports = { authController };