import {
  patientProfileValidation,
  patientInformationValidation,
  addRelativePatientValidation,
} from "@validations/patient";
import {
  updatePatientProfile,
  uploadProfilePic,
  savePatientInformation,
  addRelativePatient,
} from "@controllers/patient";
import { ensureAuthenticated } from "@middleware/auth";
import express, { Request, Response, NextFunction } from "express";

import multer from "multer";
import uniqid from "uniqid";
var multerS3 = require("multer-s3");
var aws = require("aws-sdk");
import { getPatientAttributes } from "@controllers/patient";

var router = express.Router();
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
      //@ts-ignore
      let user_id = req.userID;
      cb(null, `patient/${user_id}/profile_pic/` + uniqid() + "-" + file.originalname);
    }, //@ts-ignore
  }),
});

// let storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     cb(null, "uploads/patients");
//   },
//   filename: async (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// let upload = multer({
//   storage: storage,
// });

router.post(
  "/update-patient-profile",
  ensureAuthenticated,
  patientProfileValidation,
  updatePatientProfile
);

router.post(
  "/update-patient-information",
  ensureAuthenticated,
  patientInformationValidation,
  savePatientInformation
);
router.post(
  "/upload-profile-pic",
  ensureAuthenticated,
  upload.single("profile_pic"),
  uploadProfilePic
);

router.get(
  "/get-patient-attributes",
  ensureAuthenticated,
  getPatientAttributes
);

router.post(
  "/add-relative-patient",
  ensureAuthenticated,
  addRelativePatientValidation,
  addRelativePatient
);

module.exports = router;
