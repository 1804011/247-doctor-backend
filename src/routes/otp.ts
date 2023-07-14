import { resend_otp, verify_otp } from "@controllers/otp";
import { ensureAuthenticated } from "@middleware/auth";
import express from "express";

var router = express.Router();

router.post("/verify-otp", ensureAuthenticated, verify_otp);

router.post("/resend-otp", ensureAuthenticated, resend_otp);

module.exports = router;
