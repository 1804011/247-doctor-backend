import express from "express";
import { isAdmin } from "@middleware/auth";
import {
  registerUserValidation,
  save_new_passwordValidation,
  sendForgotPasswordCodeValidation,
  signinUserValidation,
  verifyForgotPasswordOTPValidation,
} from "@validations/admin";
const admin = require("@controllers/Admin/auth");

var router = express.Router();
import multer from "multer";
import uniqid from "uniqid";
var multerS3 = require("multer-s3");
var aws = require("aws-sdk");
var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "profile-pic-doctor-mobile-24-7",
    acl: "public-read",
    //@ts-ignore
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    //@ts-ignore
    key: function (req, file, cb) {
      let user_id = req.userID;
      cb(null, `admin/${user_id}/profile_pic/` + uniqid() + "-" + file.originalname);
    },
  }),
});

router.post("/", registerUserValidation, admin.store);
router.post("/signin", signinUserValidation, admin.signIn);
router.get("/me", isAdmin, admin.index);
router.post('/logout', isAdmin, admin.logout);
router.post(
  "/upload-profile-pic",
  isAdmin,
  upload.single("profile_pic"),
  admin.uploadProfilePic
);
router.post(
  "/send-forgot-password-code",
  sendForgotPasswordCodeValidation,
  admin.sendForgotPasswordCode
);
router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordOTPValidation,
  admin.verifyForgotPasswordOTP
);
router.post(
  "/verify-otp",
  verifyForgotPasswordOTPValidation,
  admin.verifyOTP
);
router.post(
  "/save-new-password",
  save_new_passwordValidation,
  admin.save_new_password
);
module.exports = router;