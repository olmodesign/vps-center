import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({ field: err.path.join('.'), message: err.message }));
      return res.status(400).json({ success: false, error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors });
    }
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({ field: err.path.join('.'), message: err.message }));
      return res.status(400).json({ success: false, error: 'Invalid query parameters', code: 'QUERY_VALIDATION_ERROR', details: errors });
    }
    next(error);
  }
};
