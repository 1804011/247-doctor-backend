import { ensureAuthenticated } from "@middleware/auth";
import express, { Request, Response, NextFunction } from "express";
import {
  getUserAttribtues,
  registerUser,
  save_new_password,
  sendForgotPasswordCode,
  signinUser,
  verifyForgotPasswordOTP,
  verifyOtp
} from "@controllers/user";
import {
  registerUserValidation,
  save_new_passwordValidation,
  sendForgotPasswordCodeValidation,
  signinUserValidation,
  verifyForgotPasswordOTPValidation,
} from "@validations/user";
import { changePassword } from "@controllers/user";

var router = express.Router();

/* REGISTER USER */
router.post("/register-user", registerUserValidation, registerUser);

/* SIGN IN USER */
router.post("/signin", signinUserValidation, signinUser);

/* CHANGE PASSWORD */
router.post("/change-password", ensureAuthenticated, changePassword);

/* GET USER ATTRIBUTES */
router.get("/get-user-attributes", ensureAuthenticated, getUserAttribtues);

router.post("/verify-otp", ensureAuthenticated, verifyOtp);

router.post(
  "/send-forgot-password-code",
  sendForgotPasswordCodeValidation,
  sendForgotPasswordCode
);
router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordOTPValidation,
  verifyForgotPasswordOTP
);
router.post(
  "/save-new-password",
  save_new_passwordValidation,
  save_new_password
);

module.exports = router;
