import express from "express";
import { isAdmin } from "@middleware/auth";
import multer from "multer";

const doctor = require("@controllers/Admin/cruds/doctors");
var router = express.Router();

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
      cb(null, uniqid() + "-" + file.originalname);
    }, //@ts-ignore
  }),
});


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
      cb(null, uniqid() + "-" + file.originalname);
    }, //@ts-ignore
  }),
});

const upload_profesionl_filesupload = uploadS3DoctorProfileFiles.fields([
  { name: "gov_id_front", maxCount: 1 },
  { name: "gov_id_back", maxCount: 1 },
  { name: "certificate_file", maxCount: 1 },
]);


router.get("/", isAdmin, doctor.index);
router.post("/", isAdmin, uploadS3ProfilePic.single("profile_pic"), upload_profesionl_filesupload, doctor.store);
router.get("/:id", isAdmin, doctor.show);
router.put("/:id", isAdmin, doctor.update);
router.post("/block-doctor", isAdmin, doctor.switchStatus);
router.post("/unblock-doctor", isAdmin, doctor.switchStatus);
router.delete("/:id", isAdmin, doctor.destroy)


module.exports = router;