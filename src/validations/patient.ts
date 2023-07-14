import { body } from "express-validator";

export const patientProfileValidation = [
  body("full_name")
    .exists()
    .withMessage("required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 3 })
    .withMessage("minimum 3 characters required"),
  body("gender")
    .exists()
    .withMessage(" required")
    .isIn(["male", "female"])
    .withMessage("invalid value,  must be male or female"),
  body("city", "required").isString(),
  body("country", "required").isString().isLength({ min: 1 }),
  body("area", "required").isString().isLength({ min: 1 }),
  body("address", "required").isString().isLength({ min: 1 }),
  body("language", "required").isString().isLength({ min: 1 }),
  body("division", "required").isString().isLength({ min: 1 }),
  body("weight")
    .exists()
    .withMessage("required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greater than 0"),
  body("height_ft", "required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greate than 0"),
  body("height_inches")
    .exists()
    .withMessage("required")
    .isInt({
      min: 1,
      max: 11,
    })
    .withMessage("invalid value, must be less than 12 and greater than 0"),
  body("timezone_code").exists().withMessage("required"),
  body("timezone_utc").exists().withMessage("required"),
  body("dob")
    .exists()
    .withMessage("required")
    .isISO8601({ strict: false, strictSeparator: false })
    .withMessage("format should be yyyy-mm-dd")
    .toDate(),
];

export const patientInformationValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("invalid value,  must be a valid email"),
  body("isSkipedEmail").isBoolean().exists().withMessage("isSkiped required"),
  body("phone_number").exists().withMessage(" required"),
  body("gender")
    .exists()
    .withMessage(" required")
    .isIn(["male", "female"])
    .withMessage("invalid value,  must be male or female"),
  body("bloodGroup")
    .exists()
    .withMessage(" required")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("invalid value"),
  body("diseases_or_conditions")
    .exists()
    .withMessage("required")
    .isArray({ min: 0 })
    .withMessage("must be array of strings with atleast one element"),
  body("dob")
    .exists()
    .withMessage("required")
    .isISO8601({ strict: false, strictSeparator: false })
    .withMessage("format should be yyyy-mm-dd")
    .toDate(),
  body("timezone_code").exists().withMessage("required"),
  body("timezone_utc").exists().withMessage("required"),
  body("height_ft", "required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greate than 0"),
  body("height_inches")
    .exists()
    .withMessage("required")
    .isInt({
      min: 1,
      max: 11,
    })
    .withMessage("invalid value, must be less than 12 and greater than 0"),
  body("is_under_doctor_care")
    .exists()
    .withMessage("is required")
    .isBoolean()
    .withMessage("must be a boolean"),
  body("weight")
    .exists()
    .withMessage("required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greater than 0"),
  body("language", "required").isString().isLength({ min: 1 }),
];

export const addRelativePatientValidation = [
  body("full_name")
    .exists()
    .withMessage("required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 3 })
    .withMessage("minimum 3 characters required"),
  body("gender")
    .exists()
    .withMessage(" required")
    .isIn(["male", "female"])
    .withMessage("invalid value,  must be male or female"),
  body("bloodGroup")
    .exists()
    .withMessage(" required")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("invalid value"),
  body("diseases_or_conditions")
    .exists()
    .withMessage("required")
    .isArray({ min: 0 })
    .withMessage("must be array of strings with atleast one element"),
  body("dob")
    .exists()
    .withMessage("required")
    .isISO8601({ strict: false, strictSeparator: false })
    .withMessage("format should be yyyy-mm-dd")
    .toDate(),
  body("height_ft", "required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greate than 0"),
  body("height_inches")
    .exists()
    .withMessage("required")
    .isInt({
      min: 1,
      max: 11,
    })
    .withMessage("invalid value, must be less than 12 and greater than 0"),
  body("is_under_doctor_care")
    .exists()
    .withMessage("is required")
    .isBoolean()
    .withMessage("must be a boolean"),
  body("weight")
    .exists()
    .withMessage("required")
    .isInt({ min: 1 })
    .withMessage("invalid value, must be integer greater than 0"),
];
