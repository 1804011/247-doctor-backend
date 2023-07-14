import { body } from "express-validator";
const week_days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "satday",
  "sunday",
];
export const bankDetailsValidation = [
  body("bank_name")
    .exists()
    .withMessage("bank name is required")
    .isString()
    .withMessage("bank name must be a string")
    .isLength({ min: 1 })
    .withMessage("bank name is required"),
  body("bank_address")
    .exists()
    .withMessage("bank address is required")
    .isString()
    .withMessage("bank address must be a string")
    .isLength({ min: 1 })
    .withMessage("bank address is required"),
  body("swift_code")
    .exists()
    .withMessage("swift code is required")
    .isString()
    .withMessage("swift code must be a string")
    .isLength({ min: 1 })
    .withMessage("swift code is required")
    .isBIC()
    .withMessage("invalid swift code"),
  body("mobile_account", "mobile account is required")
    .exists()
    .withMessage("mobile account is required")
    .isString()
    .withMessage("mobile account must be a string")
    .isLength({ min: 1 })
    .withMessage("mobile account is required"),
  body("account_number", "account number is required")
    .exists()
    .withMessage("account number is required")
    .isString()
    .withMessage("account number must be a string")
    .isLength({ min: 1 })
    .withMessage("account number is required")
    .isIBAN()
    .withMessage("invalid account number"),
  body("branch", "branch is required")
    .exists()
    .withMessage("branch is required")
    .isString()
    .withMessage("branch must be a string")
    .isLength({ min: 1 })
    .withMessage("branch is required"),
  body("account_holder_name")
    .exists()
    .withMessage("account holder name is required")
    .isString()
    .withMessage("account holder name must be a string")
    .isLength({ min: 1 })
    .withMessage("account holder name is required"),
];

export const professionalProfileValidation = [
  body("about")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 250 })
    .withMessage("required"),
  body("degree")
    .exists()
    .withMessage("degree is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("degree is required"),
  body("institute")
    .exists()
    .withMessage("institute is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("degree is required"),
  body("is_24_7")
    .exists()
    .withMessage("is_24_7 is required")
    .isBoolean()
    .withMessage("is_24_7 must be a boolean value"),
  body("follow_up_fee")
    .exists()
    .withMessage("follow up fee is required")
    .isFloat()
    .withMessage("follow up fee must be a float type"),
  body("consultation_fee")
    .exists()
    .withMessage("consultation fee is required")
    .isFloat()
    .withMessage("cunsultation fee must be a float type"),

  body("chamber_or_hospital_address")
    .exists()
    .withMessage("chamber/Hospital Address is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("chamber/Hospital Address is required"),
  body("medical_field")
    .exists()
    .withMessage("medical field is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("medical field is required"),
  body("medical_category")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("required"),
  body("medical_speciality")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("required"),

  body("gov_id_number")
    .exists()
    .withMessage("gov id number is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("gov id number is required"),

  body("certificate_number")
    .exists()
    .withMessage("medical certificate number is required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("medical certificate number is required"),

  body("experience").exists().withMessage("experience is required").isInt(),
];

export const personalProfileValidation = [
  body("phone_number", "phone number is required"),
  body("email").exists().withMessage("email is required").isEmail(),
  body("title")
    .exists()
    .withMessage("is required")
    .isIn(["dr", "consultant", "professor"])
    .withMessage("invalid value, title must be dr,consultant or professor"),
  body("dob")
    .exists()
    .withMessage("is required")
    .isISO8601({ strict: false, strictSeparator: false })
    .withMessage("date format should be yyyy-mm-dd")
    .toDate(),
  body("gender")
    .exists()
    .withMessage("required")
    .isIn(["male", "female"])
    .withMessage("invalid value, gender must be male or female"),
  body("city", "required").isString(),
  body("country", "required").isString().isLength({ min: 1 }),
  body("area").isString().optional({ nullable: true }),
  body("address", "required").isString().isLength({ min: 1 }),
  body("language", "required").isString().isLength({ min: 1 }),
  body("division").isString().optional({ nullable: true }),
  body("timezone_code").exists().withMessage("required"),
  body("timezone_utc").exists().withMessage("required"),
  body("full_name")
    .exists()
    .withMessage("required")
    .isString()
    .withMessage("must be a string")
    .isLength({ min: 3 })
    .withMessage("minimum 3 characters required"),
];

// export const updateAvailabilitySlotsValidation = [
//   body("from_time")
//     .exists()
//     .withMessage("required")
//     .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
//     .withMessage("invalid value, format must be HH:MM AM|PM"),

//   body("to_time")
//     .exists()
//     .withMessage("required")
//     .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/),
//   body("available_days")
//     .exists()
//     .withMessage("are required")
//     .custom((weekDays: Array<string>) => {
//       if (weekDays.length === 0) {
//         return false;
//       }
//       return weekDays.every((item: string) => {
//         if (week_days.includes(item.toLowerCase()) && item.length > 0) {
//           return true;
//         } else {
//           return false;
//         }
//       });
//     })
//     .withMessage("invalid value, week days required"),
// ];

export const updateAvailabilitySlotsValidation = [
  body("from")
    .exists()
    .withMessage("required")
    .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/)
    .withMessage("invalid value, format must be HH:MM AM|PM"),

  body("to")
    .exists()
    .withMessage("required")
    .matches(/(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P)M)/),
  
  body('date')
    .exists()
    .withMessage('required')
    
];

export const doctorInformationValidation = [
  body("title")
    .exists()
    .withMessage("title required")
    .isIn(["dr", "consultant", "professor"])
    .withMessage("invalid value, title must be dr,consultant or professor"),
  body("email").optional().isEmail().withMessage("invalid format"),
  body("isSkipedEmail").isBoolean().exists().withMessage("isSkiped required"),
];

export const likeDoctorValidation = [
  body("doctor_id")
    .exists()
    .withMessage("is required")
    .isMongoId()
    .withMessage("invalid id format")
    .isLength({ min: 1 })
    .withMessage("is required"),
];
