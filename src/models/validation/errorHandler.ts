import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
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
