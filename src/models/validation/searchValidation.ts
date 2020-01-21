import { query, ValidationChain } from 'express-validator';

const playerRegex = /^[_A-z0-9]*((-|\s)*[_A-z0-9])*$/;

const searchQueryValidationRules = (): ValidationChain[] => {
  return [
    query('player').exists(),
    query('player')
      .matches(playerRegex)
      .withMessage('A player does not have any numbers or special characters.')
  ];
};

export { searchQueryValidationRules };
