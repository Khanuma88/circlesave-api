const { circleService } = require('../services/circle.service');

const circleController = {
  async create(req, res, next) {
    try {
      const circle = await circleService.createCircle(req.body, req.user.userId);
      res.status(201).json({ status: 201, data: circle });
    } catch (error) { next(error); }
  },

  async getById(req, res, next) {
    try {
      const circle = await circleService.getCircleById(req.params.circleId, req.user.userId);
      res.status(200).json({ status: 200, data: circle });
    } catch (error) { next(error); }
  },

  async list(req, res, next) {
    try {
      const { cursor, limit, status } = req.query;
      const result = await circleService.listCircles(cursor, limit ? parseInt(limit) : 20, status);
      res.status(200).json({ status: 200, data: result });
    } catch (error) { next(error); }
  },

  async join(req, res, next) {
    try {
      const membership = await circleService.joinCircle(req.params.circleId, req.user.userId);
      res.status(201).json({ status: 201, data: membership });
    } catch (error) { next(error); }
  },

  async update(req, res, next) {
    try {
      const circle = await circleService.updateCircle(req.params.circleId, req.body, req.user.userId);
      res.status(200).json({ status: 200, data: circle });
    } catch (error) { next(error); }
  },
};

module.exports = { circleController };