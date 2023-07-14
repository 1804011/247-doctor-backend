import { ensureAuthenticated } from "@middleware/auth";
import express from "express";
import { createComplainValidation } from "@validations/complain";
import { createComplain, getAllComplains } from "@controllers/complain";

var router = express.Router();

router.post(
  "/add-complain",
  ensureAuthenticated,
  createComplainValidation,
  createComplain
);
router.get("/get-all-complains", ensureAuthenticated, getAllComplains);

module.exports = router;
