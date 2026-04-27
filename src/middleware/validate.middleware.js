const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error.errors) {
        return res.status(422).json({
          status: 422,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };