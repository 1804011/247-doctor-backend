import { body } from "express-validator";

export const createMedicineValidation = [
  body("generic_name")
    .exists()
    .withMessage("generic name is required")
    .isString()
    .withMessage("generic name  must be a string")
    .isLength({ min: 1 })
    .withMessage("generic name is required"),
  body("brand_name")
    .exists()
    .withMessage("brand name is required")
    .isString()
    .withMessage("brand name  must be a string")
    .isLength({ min: 1 })
    .withMessage("brand name is required"),

  body("medicineType")
    .exists()
    .withMessage("medicine type is required")
    .isString()
    .withMessage("medicine type must be a string")
    .isLength({ min: 1 })
    .withMessage("medicine type is required"),
];
