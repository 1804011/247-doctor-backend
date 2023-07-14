import { ensureAuthenticated } from "@middleware/auth";
import express, { Request, Response, NextFunction } from "express";
import {
  updatePersonalProfile,
  updateProfessionalProfile,
  uploadProfilePic,
  save_doctor_information,
  updateAvailability,
  UpdateDoctorBankDetails,
  getDoctorAttributes,
  // like_doctor,
  gotAllDoctorsLocal,
  gotAllDoctorsForeign,
  searchDoctor,
  // searchDcotor,
} from "@controllers/doctor";
import multer from "multer";
import {
  bankDetailsValidation,
  doctorInformationValidation,
  likeDoctorValidation,
  personalProfileValidation,
  professionalProfileValidation,
  updateAvailabilitySlotsValidation,
} from "@validations/doctor";
import uniqid from "uniqid";
var multerS3 = require("multer-s3");
var aws = require("aws-sdk");

var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});

var uploadS3ProfilePic = multer({
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
      cb(null, `doctor/${user_id}/profile_pic/` + uniqid() + "-" + file.originalname);
    }, //@ts-ignore
  }),
});

// fileFilter: function (req: any, file: any, cb: any) {
//   console.log("multer files=", req);
//   // if (!whiteListImages.includes(file.mimetype)) {
//   //   req.image_error = "invalid mime type";
//   //   return cb(null, false, req.image_error);
//   // }
//   // cb(null, true);
// },

var uploadS3DoctorProfileFiles = multer({
  fileFilter: function (req: any, file: any, cb: any) {
    console.log("multer req=", req);
    console.log("multer file=", file);
    // if (!whiteListImages.includes(file.mimetype)) {
    //   req.image_error = "invalid mime type";
    //   return cb(null, false, req.image_error);
    // }
    cb(null, true);
  },
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
      cb(null, `doctor/${user_id}/professional_pic/` + uniqid() + "-" + file.originalname);
    }, //@ts-ignore
  }),
});

let whiteListImages = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
let storage_protected = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, "assets/protected/doctors");
  },
  filename: async (req, file, cb) => {
    cb(null, uniqid() + "-" + file.originalname);
  },
});

let storage_public = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, "assets/public/doctors");
  },
  filename: async (req, file, cb) => {
    cb(null, uniqid() + "-" + file.originalname);
  },
});

let upload_protected = multer({
  storage: storage_protected,
  fileFilter: function (req: any, file: any, cb: any) {
    console.log("multer files=", req.files);
    if (!whiteListImages.includes(file.mimetype)) {
      req.image_error = "invalid mime type";
      return cb(null, false, req.image_error);
    }
    cb(null, true);
  },
});

let upload_public = multer({
  storage: storage_public,
  fileFilter: function (req: any, file: any, cb: any) {
    console.log("multer files=", req.files);
    if (!whiteListImages.includes(file.mimetype)) {
      req.image_error = "invalid mime type";
      return cb(null, false, req.image_error);
    }

    cb(null, true);
  },
});

var router = express.Router();

const upload_profesionl_filesupload = uploadS3DoctorProfileFiles.fields([
  { name: "gov_id_front", maxCount: 1 },
  { name: "gov_id_back", maxCount: 1 },
  { name: "certificate_file", maxCount: 1 },
]);

router.post(
  "/update-professional-profile",
  ensureAuthenticated,
  upload_profesionl_filesupload,
  professionalProfileValidation,
  updateProfessionalProfile
);

router.post(
  "/update-personal-profile",
  ensureAuthenticated,
  personalProfileValidation,
  updatePersonalProfile
);

router.post(
  "/upload-profile-pic",
  ensureAuthenticated,
  uploadS3ProfilePic.single("profile_pic"),
  uploadProfilePic
);

router.post(
  "/update-availablity-slots",
  ensureAuthenticated,
  updateAvailabilitySlotsValidation,
  updateAvailability
);

router.post(
  "/update-bank-details",
  ensureAuthenticated,
  bankDetailsValidation,
  UpdateDoctorBankDetails
);

router.post(
  "/save-information",
  ensureAuthenticated,
  doctorInformationValidation,
  save_doctor_information
);

// router.post(
//   "/like-doctor",
//   ensureAuthenticated,
//   likeDoctorValidation,
//   like_doctor
// );

router.get("/get-all-doctors-local", ensureAuthenticated, gotAllDoctorsLocal);
router.get(
  "/get-all-doctors-foreign",
  ensureAuthenticated,
  gotAllDoctorsForeign
);
router.get("/get-doctor-attributes", ensureAuthenticated, getDoctorAttributes);
router.get("/search-doctor", ensureAuthenticated, searchDoctor);

module.exports = router;
