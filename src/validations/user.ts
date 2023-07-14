import { body, check } from "express-validator";

export const registerUserValidation = [
  check("phone_number")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("required")
    .isMobilePhone("any")
    .withMessage("invalid format"),
  check("full_name")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 3 })
    .withMessage("minimum 3 characters are required"),
  check("password")
    .exists()
    .withMessage("required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })
    .withMessage(
      "must contain min 8 characters with 1 upper case, 1 lower case, 1 number, 1 special character"
    ),
  check("userType", "user type is required").isIn([
    "doctor",
    "patient",
    "admin",
  ]),
];

export const signinUserValidation = [
  body("phone_number")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("required"),
  body("password")
    .exists()
    .withMessage("required")
    .isString()
    .isLength({ min: 1 })
    .withMessage("required"),
];

export const changePasswordValidation = [
  check("password", "password is required"),
  check("new_password")
    .exists()
    .withMessage("new password is required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    }),
  check("confirm_new_password").custom(async (confirmPassword, { req }) => {
    const password = req.body.password;
    if (password !== confirmPassword) {
      throw new Error("Passwords must be same");
    }
  }),
];

export const sendForgotPasswordCodeValidation = [
  check("phone_number", "phone number is required"),
];

export const verifyForgotPasswordOTPValidation = [
  check("phone_number", "phone number is required"),
  check("otp_code", "otp code is required"),
];

export const save_new_passwordValidation = [
  check("phone_number", "phone number is required"),
  check("otp_code", "otp code is required"),
  check("new_password")
    .exists()
    .withMessage("new password is required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })
    .withMessage(
      "password must contain min 8 characters with 1 upper case, 1 lower case, 1 number, 1 special character"
    ),
  check("confirm_new_password").custom(async (confirmPassword, { req }) => {
    const password = req.body.new_password;
    if (password !== confirmPassword) {
      throw new Error("Passwords must be same");
    }
  }),
];
