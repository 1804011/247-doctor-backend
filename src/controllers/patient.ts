// @ts-nocheck
import { validationResult } from "express-validator";
import User from "@models/user";
import Diseases from "@models/diseases";
import { NextFunction, Request, Response } from "express";
import Patient from "@models/patient";
const timeZones = require("timezones-list");
var aws = require("aws-sdk");

var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});

export const uploadProfilePic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    let _user = req.userID;
    let file: any = req.file;
    console.log("file=", file);
    if (file === undefined) {
      return res.status(422).json({ message: "profile pic requied" });
    }
    let user = await User.findOne({ _id: _user }).select("-password");

    if (user === null) {
      res.status(401).json({ message: "invalid token,user not found" });
    } else if (user.userType != "patient") {
      res.status(401).json({ message: "only patients can access" });
    } else {
      let patient = await Patient.findOne({ user_id: user._id })
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
        stripe_account: null,
        payment_details: patient.payment_details,
        doctor: null,
        patient: patient,
      }
      res.json({ user: user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePatientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      //@ts-ignore
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let {
      gender,
      language,
      city,
      country,
      address,
      division,
      area,
      height_ft,
      height_inches,
      email,
      weight,
      is_under_doctor_care,
      diseases_or_conditions,
      dob,
      bloodGroup,
      timezone_code,
      timezone_utc,
      full_name
    } = req.body;

    //@ts-ignore
    let _user = req.userID;

    console.log("user id=====", _user);

    let user = await User.findOne({ _id: _user })
      .select("-password")
      .select("-password");


    if (user === null) {
      res.status(401).json({ message: "invalid token,user not found" });
    } else if (user.userType != "patient") {
      res.status(401).json({ message: "only patients can access" });
    } else {

      if (user.patient === null) {
        return res.status(401).json({
          message: "unautorized access, no doctor found against the user id",
        });
      }
      let patient = await Patient.findOne({ user_id: _user });

      user.language = language;
      user.country = country;
      user.city = city;
      user.division = division;
      user.area = area;
      user.address = address;
      user.dob = dob;
      user.full_name = full_name;
      user.email = email;
      user.gender = gender;
      user.timezone = {
        code: timezone_code,
        utc: timezone_utc,
      };


      const diseaseDocs = await Diseases.find({ disease: { $in: diseases_or_conditions } });

      const diseaseIds = diseaseDocs.map((disease) => disease._id);

      patient.diseases_or_conditions = diseaseIds;

      patient.bloodGroup = bloodGroup;
      patient.height = {
        ft: height_ft,
        inches: height_inches,
      };
      patient.weight = weight;
      patient.is_under_doctor_care = is_under_doctor_care;

      await user.save();
      await patient.save();
      user = {
        ...user._doc,
        stripe_account: null,
        payment_details: patient.payment_details,
        doctor: null,
        patient: patient,
      }
      return res.json({ user: user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const savePatientInformation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // console.log("req_body=",req.body);
    // return res.json({body:req.body});
    let errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      //@ts-ignore
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let {
      gender,
      language,
      height_ft,
      height_inches,
      email,
      weight,
      is_under_doctor_care,
      diseases_or_conditions,
      dob,
      bloodGroup,
      isSkiped,
      timezone_code,
      timezone_utc,
    } = req.body;

    console.log("body=", req.body);
    if (isSkiped === false) {
      console.log("email=", email);
    }

    //@ts-ignore
    let _user = req.userID;
    let user = await User.findOne({ _id: _user }).select("-password");

    if (user === null) {
      res.status(401).json({ message: "invalid token,user not found" });
    } else if (user.userType != "patient") {
      res.status(401).json({ message: "only patients can access" });
    } else {
      let patient = await Patient.findOne({ user_id: _user })
      if (patient === null) {
        return res.status(401).json({
          message: "unautorized access, no doctor found against the user id",
        });
      }
      user.language = language;
      user.dob = dob;
      user.email = isSkiped === true ? "" : email;
      user.gender = gender;
      user.timezone = {
        utc: timezone_utc,
        code: timezone_code,
      };
      const diseaseDocs = await Diseases.find({ disease: { $in: diseases_or_conditions } });

      const diseaseIds = diseaseDocs.map((disease) => disease._id);
      console.log("diseaseIds=", diseaseIds);
      //  user.is_profile_created = true;
      user.is_information_completed = true;
      patient.diseases_or_conditions = diseaseIds;
      patient.bloodGroup = bloodGroup;
      patient.height = {
        ft: height_ft,
        inches: height_inches,
      };
      patient.weight = weight;
      patient.is_under_doctor_care = is_under_doctor_care;

      await user.save();
      await patient.save();
      user = {
        ...user._doc,
        stripe_account: null,
        payment_details: patient.payment_details,
        doctor: null,
        patient: patient,
      }
      return res.json({ user: user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// export const save_patient_information = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let errors = validationResult(req);
//     if (errors.isEmpty() === false) {
//       return res.status(422).json(errors);
//     }
//     //@ts-ignore
//     let userID = req.userID;
//     let user = await User.findById(userID).select("-password");
//     if (user === null) {
//       return res
//         .status(401)
//         .json({ message: "invalid token, user not found." });
//     }
//     if (user.userType != "patient") {
//       return res.status(401).json({ message: "only patients can access it" });
//     }
//     let { email, title } = req.body;

//     let patient = await Patient.findOne({
//       user_id: user._id,
//     });
//     // doctor.title = title;
//     // await doctor.save();
//     // user.email = email;
//     user.is_information_completed = true;
//     await user.save();
//     return res.json({ patient: patient, user: user });
//   } catch (err: any) {
//     return res.status(500).json({ message: err.message });
//   }
// };

export const getPatientAttributes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;

    let user = await User.findById(userID);

    if (user === null) {
      return res.status(401).json({ message: "invalid token, no user found" });
    }
    if (user.userType != "patient") {
      return res.status(401).json({ message: "only patient can access it" });
    }

    if (user.patient === null) {
      return res
        .status(401)
        .json({ message: "only owner can access it,patient not found" });
    }
    // user={
    //   ...user._doc,
    //   stripe_account:{
    //     account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
    //    } ,
    //   payment_details: user.userType === "patient" ? patient.payment_details:null,
    //   doctor:doctor || null,
    //  patient:patient || null, 

    // }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const addRelativePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;

    let user = await User.findById(userID).select("-password");

    if (user === null) {
      return res.status(401).json({ message: "invalid token, no user found" });
    }
    if (user.userType != "patient") {
      return res.status(401).json({ message: "only patient can access it" });
    }

    if (user.patient === null) {
      return res
        .status(401)
        .json({ message: "only owner can access it,patient not found" });
    }

    if (
      user.is_profile_created === false ||
      user.is_information_completed === false ||
      user.is_verified === false
    ) {
      return res
        .status(401)
        .json({ message: "user must complete it's profile first" });
    }

    let {
      gender,
      height_ft,
      height_inches,
      weight,
      is_under_doctor_care,
      diseases_or_conditions,
      dob,
      bloodGroup,
      full_name,
    } = req.body;
    const diseaseDocs = await Diseases.find({ disease: { $in: diseases_or_conditions } });

    const diseaseIds = diseaseDocs.map((disease) => disease._id);
    console.log("diseaseIds=", diseaseIds);

    let patient = await Patient.findOne({ user_id: userID });

    await patient.relative_patients.push({
      gender: gender,
      height: {
        ft: height_ft,
        inches: height_inches,
      },
      weight: weight,
      full_name: full_name,
      is_under_doctor_care: is_under_doctor_care,
      diseases_or_conditions: diseaseIds,
      dob: dob,
      bloodGroup: bloodGroup,
    });
    await patient.save();

    return res.json({ patient });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
