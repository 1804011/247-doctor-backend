import { body } from "express-validator";

export const createComplainValidation = [
  body("complain")
    .exists()
    .withMessage("complain is required")
    .isString()
    .withMessage("complain must be a string")
    .isLength({ min: 1 })
    .withMessage("complain is required"),
];
