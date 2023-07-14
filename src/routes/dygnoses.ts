import { ensureAuthenticated } from "@middleware/auth";
import express from "express";
import { createDygnosesValidation } from "@validations/dygnoses";
import { createDygnoses, getAllDygnoses } from "@controllers/dygnoses";

var router = express.Router();

router.post(
  "/add-dygnoses",
  ensureAuthenticated,
  createDygnosesValidation,
  createDygnoses
);
router.get("/get-all-dygnoses", ensureAuthenticated, getAllDygnoses);
module.exports = router;
