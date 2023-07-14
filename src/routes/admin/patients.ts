import express from "express";
import { isAdmin } from "@middleware/auth";

const patient = require("@controllers/Admin/cruds/patients");
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
      cb(null, { fieldName: file?.fieldname });
    },
    //@ts-ignore
    key: function (req, file, cb) {
      cb(null, uniqid() + "-" + file?.originalname);
    }, //@ts-ignore
  }),
});


router.get("/", isAdmin, patient.index);
router.get("/:id", isAdmin, patient.show);
router.post("/", isAdmin, patient.store);
router.put("/:id", isAdmin, patient.update);
router.post("/block-patient", isAdmin, patient.switchStatus);
router.post("/unblock-patient", isAdmin, patient.switchStatus);
router.delete("/:id", isAdmin, patient.destroy)


module.exports = router;