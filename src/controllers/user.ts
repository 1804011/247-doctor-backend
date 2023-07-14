

import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { validationResult, ValidationError, Result } from "express-validator";
import User, { UserType } from "@models/user";
import Doctor, { DoctorType } from "@models/doctor";
import Patient, { PatientType } from "@models/patient";
import bcrypt from "bcrypt";
import { createJWT } from "@middleware/auth";
const pushNotificationService = require("@utils/push-notification");
const otpGenerator = require("otp-generator");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
import Slot, { SlotType } from "@models/slots";

export const registerUser = async (
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
    let { phone_number, userType, full_name, password, playerID }:
      { phone_number: string, userType: string, full_name: string, password: string, playerID: string } = req.body;

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
        full_name: full_name,
        phone_number: phone_number,
        password: encrypted_password,
        is_profile_created: true,
        is_information_completed: false,

      });
      user.playerID = playerID;

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
          /** 
           * WHEN USER TYPE IS DOCTOR, WE REGISTER DOCTOR HERE
          */
          if (userType === "doctor") {
            let uniqueID = uuidv4().substr(0, 8);
            let existingDoctor = await User.findOne({ doctorID: uniqueID }).exec();

            // Regenerate ID until unique ID is obtained
            while (existingDoctor) {
              uniqueID = uuidv4().substr(0, 8);
              existingDoctor = await User.findOne({ doctorID: uniqueID }).exec();
            }
            user.doctorID = uniqueID;
            await user.save(); // SAVING DOCTOR ID IN USER COLLECTION
            const newDoctor: DoctorType = await new Doctor({
              user_id: user._id,
              is_availability_details_completed: false,
              is_bank_details_completed: false,
              is_personal_profile_created: false,
              is_professional_profile_created: false,
              bank_details: {
                is_verified: false
              },
            });
            await newDoctor.save(); // SAVING NEW DOCTOR IN DOCTOR COLLECTION
            if (newDoctor && newDoctor._id) {
              // const slots: SlotType | null = await Slot.findOne({ doctor_id: newDoctor._id });
              user = {
                // @ts-ignore ,
                ...user._doc, // _doc is referring to mongo document, which is current available data inside user object
                payment_details: null,
                doctor: {
                  // @ts-ignore , _doc is referring to mongo document, which is current available data inside user object
                  ...newDoctor._doc,
                  availability: {
                    slots: []
                  }
                } || null,
                patient: null
              };
            }
          }

          if (userType === "patient") {
            const patient: PatientType = await new Patient({
              user_id: user._id,
            });
            await patient.save(); // SAVING A NEW PATIENT IN PATIENT COLLECTION
            user = {
              // @ts-ignore
              ...user._doc, // _doc is referring to mongo document, which is current available data inside user object
              stripe_account: null,
              payment_details: patient.payment_details,
              doctor: null,
              patient: patient,
            };
          }

          let jwt = await createJWT(user);
          return res.status(200).json({
            user,
            token: jwt,
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


export const signinUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    } else {
      let { phone_number, password } = req.body;
      let user = await User.findOne({
        phone_number: phone_number,
      });
      if (user === null) {
        return res.status(401).json({
          is_error: true,
          message: "user by this phone number does not exists",
        });
      } else {
        if (user.userType === "doctor") {
          var doctor = await Doctor.findOne({
            user_id: user._id,
          });
          // @ts-ignore
          var slot = await Slot.findOne({ doctor_id: doctor._id })

        }
        if (user.userType === "patient") {
          var patient = await Patient.findOne({
            user_id: user._id,
          });
        }
        let tmp = await bcrypt.compareSync(password, user.password);
        if (bcrypt.compareSync(password, user.password)) {
          let jwt = createJWT(user);
          if (!user.is_active) {
            return res.status(401).json({
              is_error: true,
              message: "user is not active",
            });
          }

          user = {
            // @ts-ignore
            ...user._doc,
            stripe_account: {
              // @ts-ignore
              account: user.userType === "doctor" ? doctor.bank_details.account_number : null,
            },
            // @ts-ignore
            payment_details: user.userType === "patient" ? patient.payment_details : null,
            // @ts-ignore
            doctor: user.userType === "doctor" ? {
              // @ts-ignore
              ...doctor._doc,
              // @ts-ignore
              availability: {
                // @ts-ignore
                slots: slot
              }
            } : null,
            // @ts-ignore
            patient: user.userType === "patient" ? patient : null,

          }

          return res.status(200).json({
            token: jwt,
            user: user,
          });
        } else {
          res
            .status(422)
            .json({ is_error: true, message: "incorrect password" });
        }
      }
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    } else {
      //@ts-ignore
      let userID = req.userID;
      let { old_password, new_password } = req.body;
      let _user = await User.findOne({
        _id: userID,
      });
      if (_user === null) {
        res.status(401).json({ message: "invalid token, user not found" });
      } else {
        if (bcrypt.compareSync(old_password, _user.password)) {
          _user.password = await bcrypt.hashSync(new_password, 10);
          await _user.save();
          return res
            .status(200)
            .json({ success: true, message: "password changed successfully" });
        } else {
          res
            .status(422)
            .json({ is_error: true, message: "invalid old password" });
        }
      }
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const fogertPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    } else {
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const complete_profile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { user } = req.body;
    let _user = await User.findOne({ _id: user });
    if (_user === null) {
      res.status(401).json({ message: "invalid token,user not found" });
    } else if (_user.userType != "patient") {
      res.status(401).json({ message: "only patients can access" });
    } else {
      let patient = await Patient.findOne({
        user_id: _user._id,
      });
      _user.is_profile_created = true;
      await _user.save();
      _user = {
        ...user._doc,
        stripe_account: null,
        //@ts-ignore
        payment_details: user.userType === "patient" ? patient.payment_details : null,
        doctor: null,
        patient: patient || null,
      }
      return res.json({ user: _user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserAttribtues = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;

    let user = await User.findById(userID).select("-password -otp");
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, no user found against this token" });
    }
    if (user.userType === 'doctor') {
      let doctor = await Doctor.findOne({
        user_id: userID,
      });
      //@ts-ignore
      var slot = await Slot.findOne({ doctor_id: doctor._id })
      user = {
        //@ts-ignore
        ...user._doc,
        stripe_account: {
          //@ts-ignore
          account: user.userType === "doctor" ? doctor.bank_details.account_number : null,
        },
        //@ts-ignore
        payment_details: null,
        doctor: {
          //@ts-ignore
          ...doctor._doc,
          availability: {
            slots: slot
          }
        } || null,
        patient: null,

      }
    }
    else if (user.userType === "patient") {
      let patient = await Patient.findOne({
        user_id: userID,
      });
      user = {
        //@ts-ignore
        ...user._doc,
        stripe_account: null,
        // @ts-ignore
        payment_details: user.userType === "patient" ? patient.payment_details : null,
        doctor: null,
        patient: patient || null,
      }
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (
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

    if (user.otp != otp_code) {
      return res.status(422).json({ message: "invalid otp code" });
    } else if (
      user.otp === otp_code
    ) {
      user.is_verified = true;
      await user.save();
      return res.status(200).json({ success: true });
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

export const bank_details_submited = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID);
    if (user === null) {
      return res
        .status(401)
        // @ts-ignore
        .json({ message: "invalid token, no user found", user_id: user._id });
    }

    if (user.userType != "doctor" && user.userType != "patient") {
      return res.status(401).json({
        message: "invalid token, only doctor or patient can access it",
        user_id: user._id,
      });
    }
    let { accountID } = req.query;
  } catch (err: any) {
    console.log("err 631 ===>", err);
    return res.status(500).json({ message: err.message });
  }
};



