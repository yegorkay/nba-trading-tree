import { query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const playerRegex = /^[_A-z0-9]*((-|\s)*[_A-z0-9])*$/;

const searchQueryValidationRules = (): ValidationChain[] => {
  return [
    query('player').isString(),
    query('player').exists(),
    query('player')
      .matches(playerRegex)
      .withMessage('A player does not have any numbers or special characters.')
  ];
};

const validateSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
};

export { searchQueryValidationRules, validateSearchQuery };
