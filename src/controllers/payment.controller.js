const { paymentService } = require('../services/payment.service');

const paymentController = {
  async createSchedule(req, res, next) {
    try {
      const payments = await paymentService.createPaymentSchedule(req.params.circleId);
      res.status(201).json({ status: 201, data: payments });
    } catch (error) { next(error); }
  },

  async makePayment(req, res, next) {
    try {
      const { circleId } = req.params;
      const { cycleNumber, amount } = req.body;
      const userId = req.user.userId;

      const payment = await paymentService.makePayment(circleId, userId, cycleNumber, amount);
      res.status(200).json({ status: 200, data: payment });
    } catch (error) { next(error); }
  },

  async getSchedule(req, res, next) {
    try {
      const { circleId } = req.params;
      const userId = req.user.userId;

      const payments = await paymentService.getPaymentSchedule(circleId, userId);
      res.status(200).json({ status: 200, data: payments });
    } catch (error) { next(error); }
  },

  async calculatePayout(req, res, next) {
    try {
      const { circleId } = req.params;
      const { cycleNumber } = req.body;

      const result = await paymentService.calculatePayout(circleId, cycleNumber);
      res.status(200).json({ status: 200, data: result });
    } catch (error) { next(error); }
  },
};

module.exports = { paymentController };