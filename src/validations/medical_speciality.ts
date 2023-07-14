import { body } from "express-validator";

export const addMedicalSpecialityValidation = [
  body("speciality")
    .exists()
    .withMessage("required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("required"),
];
