// @ts-nocheck
import User from "@models/user";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
const otpGenerator = require("otp-generator");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

export const verify_otp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = await validationResult(req);

    if (errors.isEmpty() === false) {
      return res.status(422).json({ errors });
    } else {
      //@ts-ignore
      let user_id = req.userID;
      let user = await User.findById(user_id);
      if (user === null) {
        return res
          .status(404)
          .json({ message: "user not found, invalid token" });
      }
      let { otp } = req.body;
      if (user.otp != otp) {
        return res.status(422).json({ message: "invalid otp code" });
      }
      user.is_verified = true;
      await user.save();
      return res.json({ user });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const resend_otp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let user_id = req.userID;
    let user = await User.findById(user_id).select("-password");
    if (user === null) {
      return res.status(404).json({ message: "user not found, invalid token" });
    }
    let otp = await otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    await client.messages
      .create({
        body: `This is otp code ${otp} for doctor-24-7 app`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone_number,
      })
      .then(async (message: any) => {
        console.log("message=", message);
        console.log(message);
        user.otp = otp;
        user.is_verified = false;
        await user.save();
      });
    return res.json({ resend: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
