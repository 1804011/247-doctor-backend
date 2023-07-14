// @ts-nocheck
import User from "@models/user";
import { validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import bcrypt from "bcrypt";
import { createJWT } from "@middleware/auth";
const otpGenerator = require("otp-generator");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
var aws = require("aws-sdk");

var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});


export const store = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors: Result<ValidationError> = await validationResult(req);
  if (errors.isEmpty() === false) {
    return res
      .status(422)
      .json({ message: errors });
  } else {
    let { phone_number, name, userType, password }:
      { phone_number: string, name: string, password: string, userType: string } = req.body;

    let check_user: UserType | null = await User.findOne({
      phone_number: phone_number,
    }).select("-password");
    if (check_user != null) {
      res.status(400).send({
        is_error: true,
        message: "User with the phone number already exists!",
      });
    } else {
      let encrypted_password: string = await bcrypt.hashSync(password, 10);
      let user: UserType = await new User({
        userType: userType,
        full_name: name,
        phone_number: phone_number,
        password: encrypted_password,
        is_profile_created: true,
        is_information_completed: false,
      });

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
          to: phone_number,
        })
        .then(async () => {
          user.otp = otp;
          user.is_verified = false;
          await user.save();     // SAVING NEW USER IN DATABASE
          return res.status(200).json({
            status: "success",
          });
        })
        .catch(async (err: any) => {
          if (err.code === 21211) {
            return res
              .status(422)
              .json({ message: "invalid phone number or format" });
          } else {
            return res.status(500).json(err.message);
          }
        });
    }
  }
};

// verify OTP
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: any = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422)
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let { otp_code, phone_number } = req.body;

    let user = await User.findOne({
      phone_number: phone_number,
    }).select("-password");
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid phone number no user found" });
    }
    if (user.userType !== 'admin') {
      return res.status(200).json({
        status: "failed",
        message: "You are not an admin",
      });
    }
    if (user.otp != otp_code) {
      return res.status(422).json({ message: "invalid otp code" });
    } else if (
      user.otp === otp_code &&
      // @ts-ignore
      user.otp.length > 0) {
      user.is_verified = true;
      await user.save();
      let jwt = await createJWT(user);
      let permissions = [user.userType]
      return res.status(200).json({
        token: jwt,
        permissions: permissions,
        is_verified: user.is_verified
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// sign in with phone and passaword

const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: `${errors.errors[0].param} ${errors.errors[0].msg}`,
      });
    }

    const { phone_number, password } = req.body;
    const user = await User.findOne({ phone_number });
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "Admin with this phone number does not exist",
      });
    }

    if (user.userType !== 'admin') {
      return res.status(401).json({
        is_error: true,
        message: "You are not an admin",
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(422).json({
        is_error: true,
        message: "Incorrect password",
      });
    }

    const jwt = createJWT(user);
    const permissions = [user.userType];
    return res.status(200).json({
      token: jwt,
      permissions,
      is_verified: user.is_verified,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// method to get the sign in users info

const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //@ts-ignore
    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID, {

      id: "$_id",
      name: '$full_name',
      permissions: '$userType',
      email: 1,
      created_at: "2023-12-12T12:12:12.000Z",
      updated_at: "2023-12-12T12:12:12.000Z",
      phone_number: 1,
      is_active: 1,
      profile_pic: '$profile_pic.url',
      is_verified: 1,

    }).select("-password -otp");

    // create a new key profile in the user object


    user = {
      ...user._doc,
      profile: {
        id: user._id,
        contact: user.phone_number,
        avatar: user.profile_pic
      },

    }

    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, no user found against this token" });
    }
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }

}

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //@ts-ignore
    const user = req.user;
    if (!user) {
      //@ts-ignore
      return res.send(true);
    }
    await user.token?.delete();
    res.send(true);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const uploadProfilePic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID).select("-password -otp");
    console.log(user);

    let file: any = req.file;
    console.log("file=", file);
    if (file === undefined) {
      return res.status(422).json({ message: "profile pic requied" });
    }
    if (user === null) {
      return res.status(401).json({ message: "invalid token,user not found" });
    } else if (user.userType != "admin") {
      return res.status(401).json({ message: "only admin can access" });
    } else {
      if (user.profile_pic.url) {
        await s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: user.profile_pic.key,
          },
          (err: any, data: any) => {
            console.error(err);
            console.log(data);
          }
        );
      }
      user.profile_pic = {
        url: file.location,
        name: file.originalname,
        key: file.key,
      };
      await user.save();
      user = {
        ...user._doc,
        profile: {
          id: user._id,
          contact: user.phone_number,
          avatar: user.profile_pic
        }

      }
      return res.status(200).json({ user: user });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const sendForgotPasswordCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: any = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422)
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let { phone_number } = req.body;
    let user = await User.findOne({
      phone_number: phone_number,
    }).select("-password");
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid phone number no user found" });
    }
    if (user.userType !== 'admin') {
      return res.status(200).json({
        status: "failed",
        message: "You are not an admin",
      });
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
        to: phone_number,
      })
      .then(async (message: any) => {
        // @ts-ignore
        user.forgot_password_otp = otp;
        // @ts-ignore
        user.verified_forgot_password_otp = false;
        // @ts-ignore
        await user.save();
        return res.json({ success: true });
      });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const verifyForgotPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: any = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422)
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let { otp_code, phone_number } = req.body;
    let user = await User.findOne({
      phone_number: phone_number,
    }).select("-password");
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid phone number no user found" });
    }
    if (user.userType !== 'admin') {
      return res.status(200).json({
        status: "failed",
        message: "You are not an admin",
      });
    }
    if (user.forgot_password_otp != otp_code) {
      return res.status(422).json({ message: "invalid otp code" });
    } else if (
      user.forgot_password_otp === otp_code &&
      // @ts-ignore
      user.forgot_password_otp.length > 0
    ) {
      user.verified_forgot_password_otp = true;
      await user.save();
      return res.json({ success: true });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};


export const save_new_password = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: any = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res.status(422).json({
        message: errors.errors[0].param + " " + errors.errors[0].msg,
      });
    }
    let { phone_number, new_password, confirm_new_password, otp_code } =
      req.body;
    let user = await User.findOne({
      phone_number: phone_number,
    });
    if (user === null) {
      return res
        .status(422)
        .json({ message: "invalid phone number, no user found" });
    }
    if (user.userType !== 'admin') {
      return res.status(200).json({
        status: "failed",
        message: "You are not an admin",
      });
    }
    if (user.verified_forgot_password_otp === false) {
      return res.status(422).json({
        message: "must verify your phone number before changing password",
      });
    }
    if (user.forgot_password_otp != otp_code) {
      return res.status(422).json({
        message: "invalid otp code",
      });
    }
    if (
      user.verified_forgot_password_otp == true &&
      user.forgot_password_otp == otp_code
    ) {
      let pwd = await bcrypt.hashSync(new_password, 10);
      console.log("password hash=", pwd);
      user.password = pwd;
      await user.save();
      return res.json({ success: true });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};




module.exports = {
  signIn, index, logout, uploadProfilePic, sendForgotPasswordCode, verifyForgotPasswordOTP, save_new_password, store, verifyOTP
}