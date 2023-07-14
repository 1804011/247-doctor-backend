import { body } from "express-validator";

export const createDygnosesValidation = [
  body("dygnoses")
    .exists()
    .withMessage("dygnoses is required")
    .isString()
    .withMessage("dygnoses must be a string")
    .isLength({ min: 1 })
    .withMessage("dygnoses is required"),
];
