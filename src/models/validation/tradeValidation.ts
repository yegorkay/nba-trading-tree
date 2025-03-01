import { query, ValidationChain } from 'express-validator';

const dateRegex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
const idRegex = /^[a-z0-9]+$/i;

const playerIDRules: ValidationChain[] = [
  query('id')
    .exists()
    .withMessage('Missing id.'),
  query('id')
    .isLength({ min: 7, max: 9 })
    .withMessage('Invalid id. Must be 7-9 characters long.'),
  query('id')
    .matches(idRegex)
    .withMessage('Invalid id. Must be alphanumeric.')
];

const dateRules: ValidationChain[] = [
  query('date').isString(),
  query('date').exists(),
  query('date')
    .isLength({ min: 10, max: 10 })
    .withMessage('Invalid date format. Must be 10 characters long.'),
  query('date')
    .matches(dateRegex)
    .withMessage('Invalid date format. Must be YYYY/MM/DD.')
];

const dateQueryValidationRules = (): ValidationChain[] => {
  return [...playerIDRules, ...dateRules];
};

export { dateQueryValidationRules };
