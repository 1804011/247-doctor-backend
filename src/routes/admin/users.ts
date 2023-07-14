import express from "express";
import { isAdmin } from "@middleware/auth";

const users = require("@controllers/Admin/cruds/users");
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



router.get("/", isAdmin, users.index);
router.get("/:id", isAdmin, users.show);
router.post("/", isAdmin, users.store);
router.put("/:id", isAdmin, users.update);
router.post("/block-user", isAdmin, users.switchStatus);
router.post("/unblock-user", isAdmin, users.switchStatus);
router.delete("/:id", isAdmin, users.destroy);

module.exports = router;