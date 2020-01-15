import { query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const dateRegex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;

const dateQueryValidationRules = (): ValidationChain[] => {
  return [
    query('date').isString(),
    query('date').exists(),
    query('date')
      .isLength({ min: 10, max: 10 })
      .withMessage('Invalid date format. Too many characters.'),
    query('date')
      .matches(dateRegex)
      .withMessage('Invalid date format. Must be YYYY/MM/DD.')
  ];
};

const validateDateQuery = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
};

export { dateQueryValidationRules, validateDateQuery };
