import { body } from "express-validator";

export const requestAppointmentValidation = [
  body("doctor_id")
    .exists()
    .withMessage("doctor id is required")
    .isMongoId()
    .withMessage("invalid id format"),
  body("slot_id")
    .exists()
    .isMongoId()
    .withMessage("slot id is required")
    .withMessage("invalid id format"),
  // body("appointment_day").exists().withMessage("appointment day is required"),
  // body("appointment_date")
  //   .exists()
  //   .withMessage("appointment date is required")
  //   .isISO8601({ strict: true, strictSeparator: true })
  //   .withMessage("format should be yyyy-mm-dd"),
  // body("from_slot_time")
  //   .exists()
  //   .withMessage("required")
  //   .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
  //   .withMessage("invalid value, format must be HH:MM AM|PM"),
  // body("to_slot_time")
  //   .exists()
  //   .withMessage("required")
  //   .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
  //   .withMessage("invalid value, format must be HH:MM AM|PM"),
  body("is_relative").isBoolean().exists().withMessage("required"),
];

export const acceptAppointmentRequestValidation = [
  body("appointment_id")
    .exists()
    .withMessage("doctor id is required")
    .isMongoId()
    .withMessage("invalid id format"),
  // body("appointment_date")
  //   .exists()
  //   .withMessage("appointment date is required")
  //   .isISO8601({ strict: false, strictSeparator: false })
  //   .withMessage("date format should be yyyy-mm-dd"),
  // body("from_slot_time")
  //   .exists()
  //   .withMessage("required")
  //   .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
  //   .withMessage("invalid value, format must be HH:MM AM|PM"),
  // body("to_slot_time")
  //   .exists()
  //   .withMessage("required")
  //   .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
  //   .withMessage("invalid value, format must be HH:MM AM|PM"),
];

export const rejectAppointmentRequestValidation = [
  body("appointment_id")
    .exists()
    .withMessage("id is required")
    .isMongoId()
    .withMessage("invalid id format"),
];
export const cancelAppointmentValidation = [
  body("appointment_id")
    .exists()
    .withMessage("id is required")
    .isMongoId()
    .withMessage("invalid id format"),
];

export const writePrescriptionValidation = [
  body("appointment_id", "required")
    .exists()
    .withMessage("id is required")
    .isMongoId()
    .withMessage("invalid id format"),

  body("patient_id")
    .exists()
    .withMessage("id is required")
    .isMongoId()
    .withMessage("invalid id format"),
  body("need_follow_up_consultation")
    .exists()
    .withMessage("is required")
    .isBoolean()
    .withMessage("must be a boolean")
    .isIn([true, false])
    .withMessage("value must be true or false"),
  body("complains")
    .exists()
    .withMessage("is required")
    .isArray({ min: 1 })
    .withMessage("must be  array of string"),
  body("dygnoses")
    .exists()
    .withMessage("is required")
    .isArray({ min: 1 })
    .withMessage("must be array of string"),
  body("medicines")
    .isArray({ min: 1 })
    .withMessage("medicines must be a array"),
  body("medicines.*._id")
    .exists()
    .withMessage("id is required")
    .isMongoId()
    .withMessage("invalid id format")
    .isLength({ min: 1 })
    .withMessage("is required"),
  body("medicines.*.dose_frequency")
    .exists()
    .withMessage("is required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("required"),
  body("medicines.*.instructions")
    .exists()
    .withMessage("is required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("required"),
  body("advice")
    .exists()
    .withMessage("is required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("required"),
  body("investigation")
    .exists()
    .withMessage("is required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("required"),
  body("medicines.*.duration_unit")
    .exists()
    .withMessage("is required")
    .isIn(["once", "days", "weeks", "months", "continue", "not required"]),
  body("medicines.*.dose_duration")
    .exists()
    .withMessage("is required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 1 })
    .withMessage("is required"),
];

export const finishAppointmentValidation = [
  body("appointment_id")
    .exists()
    .withMessage("doctor id is required")
    .isMongoId()
    .withMessage("invalid id format"),
];
