import { type NextFunction, type Request, type Response } from "express";
import { validationResult } from "express-validator";

export const validation = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    res.status(422).json({ errors: errors.array() });
  }
};
