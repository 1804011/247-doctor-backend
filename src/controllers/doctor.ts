// @ts-nocheck
import { validationResult } from "express-validator";
import User from "@models/user";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
import MedicalSpeciality from "@models/medical_specialities";
import MedicalCategory from "@models/medical_categories";
import Doctor from "@models/doctor";
import Slot from "@models/slots";
const timeZones = require("timezones-list");
var aws = require("aws-sdk");

var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});

export const UpdateDoctorBankDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    let {
      bank_name,
      bank_address,
      swift_code,
      mobile_account,
      account_holder_name,
      account_number,
      branch,
    } = req.body;
    //@ts-ignore
    let _user = req.userID;
    let user = await User.findOne({
      _id: _user,
    });
    if (_user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor=await Doctor.findOne({user_id:_user});
      doctor.bank_details.address = bank_address;
      doctor.bank_details.name = bank_name;
      doctor.bank_details.branch = branch;
      doctor.bank_details.swift_code = swift_code;
      doctor.bank_details.account_holder_name = account_holder_name;
      doctor.bank_details.mobile_account = mobile_account;
      doctor.bank_details.account_number = account_number;
      doctor.is_bank_details_completed = true;
    
      await user.save();
      await doctor.save();
      user={
        ...user._doc,
        stripe_account:{
          account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
         } ,
        payment_details: null,
        doctor:doctor ,
       patient: null, 
        
      }
      res.status(200).json({ user: user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfessionalProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    if (
      req.files.gov_id_front === undefined ||
      req.files.gov_id_back === undefined ||
      req.files.certificate_file === undefined
    ) {
      if (req.files.gov_id_front) {
        s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: req.files.gov_id_front[0].key,
          },
          (err: any, data: any) => {
            console.error(err);
            console.log(data);
          }
        );
      }
      if (req.files.gov_id_back) {
        s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: req.files.gov_id_back[0].key,
          },
          (err: any, data: any) => {
            console.error(err);
            console.log(data);
          }
        );
      }
      if (req.files.certificate_file) {
        s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: req.files.certificate_file[0].key,
          },
          (err: any, data: any) => {
            console.error(err);
            console.log(data);
          }
        );
      }
      return res.status(422).json({
        image_error: `Gov id front, Gov id back and certificate images are required!`,
      });
    }

    if (req.image_error) {
      return res.json({ image_error: req.image_error });
    }
    let {
      degree,
      institute,
      certificate_number,
      gov_id_number,
      medical_field,
      medical_speciality,
      medical_category,
      experience,
      consultation_fee,
      follow_up_fee,
      chamber_or_hospital_address,
      is_24_7,
      about,
    } = req.body;
    console.log("req body=", req.body);

    let files: any = req.files;

    let { gov_id_front, gov_id_back, certificate_file } = files;

    let user = await User.findOne({
      _id: req.userID,
    });
    let doctor=await Doctor.findOne({user_id:req.userID})
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access it",
      });
    } else {
      if (doctor === null) {
        return res
          .status(401)
          .json({ message: "doctor not found against this user id" });
      } else {
        let _medical_speciality = await MedicalSpeciality.findOne({
          speciality: medical_speciality,
        });
        console.log("medical speciality", _medical_speciality);
        
        if (_medical_speciality === null) {
          return res
            .status(422)
            .json({ message: "invalid medical speciality value" });
        }

        let _medical_category = await MedicalCategory.findOne({
          category: medical_category,
        });
        if (_medical_category === null) {
          return res
            .status(422)
            .json({ message: "invalid medical category value" });
        }

        doctor.degree = degree;
        doctor.institute = institute;
        doctor.chamberORhospitalAddress = chamber_or_hospital_address;
        if (doctor.medical_certificate.url) {
          console.log(
            "certificate assets" + doctor.medical_certificate.url
          );

          await s3.deleteObject(
            {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: doctor.medical_certificate.key,
            },
            (err: any, data: any) => {
              console.error(err);
              console.log(data);
            }
          );
        }
        doctor.medical_certificate = {
          key: certificate_file[0].key,
          url: certificate_file[0].location,
          name: certificate_file[0].originalname,
          certificate_number: certificate_number,
        };
        if (doctor.gov_id.gov_id_back.url) {
          console.log("back assets" + doctor.gov_id.gov_id_back.url);

          await s3.deleteObject(
            {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: doctor.gov_id.gov_id_back.key,
            },
            (err: any, data: any) => {
              console.error(err);
              console.log(data);
            }
          );
        }

        if (doctor.gov_id.gov_id_front.url) {
          console.log("front assets" + doctor.gov_id.gov_id_front.url);
          await s3.deleteObject(
            {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: doctor.gov_id.gov_id_front.key,
            },
            (err: any, data: any) => {
              console.error(err);
              console.log(data);
            }
          );
        }

        doctor.gov_id = {
          gov_id_number: gov_id_number,
          gov_id_back: {
            key: gov_id_back[0].key,
            url: gov_id_back[0].location,
            name: gov_id_back[0].originalname,
          },
          gov_id_front: {
            key: gov_id_front[0].key,
            url: gov_id_front[0].location,
            name: gov_id_front[0].originalname,
          },
        };
        console.log("consultation fee=", consultation_fee);
        console.log("is_24_7=", new Boolean(is_24_7));

         doctor.experience = parseInt(experience);
        //parseInt(experience);
         console.log("experience_=",  doctor.experience);
         doctor.is_24_7 = is_24_7;
         doctor.consultation_fee = consultation_fee;
         doctor.follow_up_fee = follow_up_fee;
         doctor.medical_field = medical_field;
         doctor.medical_category = _medical_category._id;
         doctor.medical_speciality = _medical_speciality._id;
         doctor.is_professional_profile_created = true;
         doctor.about = about;
        user.is_profile_created = true;
        await user.save();
        await doctor.save();
        user={
          ...user._doc,
          stripe_account:{
            account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
           } ,
          payment_details: null,
          doctor:doctor ,
         patient: null, 
          
        }
        res.json({ user: user  });
      }
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePersonalProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }

    let {
      city,
      division,
      email,
      dob,
      gender,
      address,
      country,
      language,
      area,
      timezone_utc,
      title,
      full_name,
      timezone_code,
    } = req.body;

    //@ts-ignore
    let _user = req.userID;
    let user = await User.findOne({
      _id: _user,
    }).select("-password");
    
    //res.json({ _user, body: req.body });

    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({ message: "unauthorized access" });
    } else {
      let doctor = await Doctor.findOne({user_id:_user});
      if (doctor === null) {
        return res.status(401).json({
          message: "unautorized access, no doctor found against the user id",
        });
      }

      let timezone: Array<any> = timeZones.default.filter(
        (item: any, index: number) => {
          return item.tzCode === timezone_code && item.utc === timezone_utc;
        }
      );

      console.log("timezone length===", timezone.length, timezone);
      if (timezone.length === 0) {
        return res.status(422).json({
          errors: [{ msg: "invalid timzone code or utc", param: "timzone" }],
        });
      }

      user.city = city;
      // _user.title = title;
      if (area && area.length > 0) {
        user.area = area;
      }

      user.full_name = full_name;
      user.address = address;
      user.email = email;
      user.timezone = {
        code: timezone[0].tzCode,
        utc: timezone[0].utc,
      };
      user.country = country;
      user.gender = gender;
      user.dob = dob;
      if (division && division.length > 0) {
        user.division = division;
      }
      user.language = language;

      doctor.title = title;
      doctor.is_personal_profile_created = true;
      await user.save();
      await doctor.save();
      user={
        ...user._doc,
        stripe_account:{
          account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
         } ,
        payment_details: null,
        doctor:doctor ,
       patient: null, 
        
      }
      return res.json({ user: user });
    }
  } catch (err: any) {
    res.status(500).json({ messsage: err.message });
  }
};

export const uploadProfilePic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    console.log("req=", req.files);
    //@ts-ignore
    let user = req.userID;
    let file: any = req.file;
    console.log("file=", file);

    if (file === undefined) {
      return res.status(422).json({ message: "profile pic requied" });
    }
    let _user = await User.findOne({
      _id: user,
    }).select("-password");
    if (_user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (_user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor=await Doctor.findOne({user_id:user});
      if (_user.profile_pic.url) {        
        await s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: _user.profile_pic.key,
          },
          (err: any, data: any) => {
            console.error(err);
            console.log(data);
          }
        );
      }
      _user.profile_pic = {
        url: file.location,
        name: file.originalname,
        key: file.key,
      };

      await _user.save();
      user={
        ...user._doc,
        stripe_account:{
          account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
         } ,
        payment_details: null,
        doctor:doctor ,
       patient: null, 
        
      }
      return res.json({ user: _user });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errors = await validationResult(req);
  if (errors.isEmpty() === false) {
    //@ts-ignore
    return res
      .status(422) //@ts-ignore
      .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
  }
  try {
    //@ts-ignore
    let _user = req.userID;
    let user = await User.findOne({
      _id: _user,
    });
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor=await Doctor.findOne({user_id:_user});
      let { available_days, from_time, to_time } = req.body;
      // return res.json({ body: req.body });
      if (from_time === to_time) {
        return res
          .status(422)
          .json({ message: "to_time must be greater than from_time" });
      }
      var time1 = from_time.split(":");

      var time2 = to_time.split(":");
      // return res.json({ available_days, time2, time1 });
      let start_time = "12:00 am";
      let end_time = "11:59pm";
      let slotInterval = 30;
      //Format the time
      let startTime = moment(start_time, "hh:mm a");

      //Format the end time and the next day to it
      let endTime = moment(end_time, "hh:mm a").add(1, "days");

      //Times
      let allTimes = [];

      //Loop over the times - only pushes time with 30 minutes interval
      while (startTime <= endTime) {
        //Push times
        allTimes.push(startTime.format("hh:mm a"));
        //Add interval of 30 minutes
        startTime.add(slotInterval, "minutes");
      }

      console.log(allTimes);

      let slot_1_index: number, slot_2_index: number;
      await allTimes.map((item: string, index: number) => {
        if (to_time.toLowerCase() === item) {
          slot_2_index = index;
        }
        if (from_time.toLowerCase() === item) {
          slot_1_index = index;
        }
      });
 
      //@ts-ignore
      if (slot_2_index > slot_1_index) {
        console.log("you can continue");

       let slot=await Slot.create({
        doctor_id: doctor._id,
       })

        //  return doctor;
        // user.doctor.availability.available_days = available_days;
        
        //@ts-ignore
        // user.doctor.availability.slots.from = allTimes[slot_1_index];
        slot.from=allTimes[slot_1_index];
        //@ts-ignore
        // user.doctor.availability.slots.to = allTimes[slot_2_index];
        slot.to=allTimes[slot_2_index];
        doctor.is_availability_details_completed = true;
        await user.save();
        await doctor.save();
        await slot.save();
        user={
          ...user._doc,
          stripe_account:{
            account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
            } ,
          payment_details: null,
          doctor:{
            ...doctor._doc,
            availability:{
              slots:slot,
            }
          } ,
          patient: null,
        }
        console.log("doctor=", doctor);
        return res.json({ user });
      } else {
        return res
          .status(422)
          .json({ message: "to_time must be greater than from_time" });
      }
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const save_doctor_information = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let errors = validationResult(req);

    if (errors.isEmpty() === false) {
      //@ts-ignore
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }

    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID).select("-password");
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, user not found." });
    }
    if (user.userType != "doctor") {
      return res.status(401).json({ message: "only doctor can access it" });
    }

    let { email, title, isSkipedEmail } = req.body;

    console.log("user=", user._id, userID);

    console.log("doctor=", user.doctor);

    if (user.doctor === null) {
      return res
        .status(401)
        .json({ message: "doctor not found", id: userID, user: user._id });
    }
     let doctor = await Doctor.findOne({ user_id: userID });
     let slot=await Slot.findOne({doctor_id:doctor._id});
    //return res.json({doctor});
    doctor.title = title;
    await user.save();
    user.email = isSkipedEmail === true ? "" : email;
    user.is_information_completed = true;
    await user.save();
    console.log("user inforamtion completed=", user.is_information_completed);
    await doctor.save();
    user={
      ...user._doc,
      stripe_account:{
        account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
        } ,
      payment_details: null,
      doctor:{
        ...doctor._doc,
        availability:{
          slots:slot,
        }
      } ,
      patient: null,
    }
    return res.json({ user: user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getDoctorAttributes = async (
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
    if (user.userType != "doctor") {
      return res.status(401).json({ message: "only doctors can access it" });
    }
    if (user.doctor === null) {
      return res
        .status(401)
        .json({ message: "only owner can access it,doctor not found" });
    }
    let doctor=await Doctor.findOne({user_id:userID});
    let slot=await Slot.findOne({doctor_id:doctor._id});
    user={
      ...user._doc,
      stripe_account:{
        account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
        } ,
      payment_details: null,
      doctor:{
        ...doctor._doc,
        availability:{
          slots:slot,
        }
      } ,
      patient: null,
    }
    user={
      ...user._doc,
      stripe_account:{
        account: user.userType === "doctor" ? doctor.bank_details.account_number:null,
       } ,
      payment_details: null,
      doctor:doctor ,
     patient: null, 
      
    }
    
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const gotAllDoctorsLocal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;
    console.log("userID=", userID);
    let user = await User.findById(userID);
    if (user === null) {
      return res.status(401).json({ message: "invalid token, no user found" });
    }
    if (user.userType != "patient") {
      return res.status(401).json({ message: "only patient can access it" });
    }
    let doctors = await Doctor.find().populate("user_id", "-password -otp");

    console.log("doctors=", doctors);
    
    
    let formattedUsers = await Promise.all(
      doctors.map(async (doctor) => {
        let slot = await Slot.findOne({ doctor_id: doctor._id });
        if(doctor.user_id.timezone.code===user.timezone.code){
        return {
          ...doctor.user_id._doc,
          doctor: {
            ...doctor._doc,
            availability: {
              slots: slot?slot:[],
            },
          },
          patient: null,
          payment_details: null,
          stripe_account: {
            account: doctor.bank_details.account_number,
          },
        };
      }
      else {
        return;
      }
      })
    );
    return res.json({ users: formattedUsers });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const gotAllDoctorsForeign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;
    console.log("userID=", userID);
    let user = await User.findById(userID);
    if (user === null) {
      return res.status(401).json({ message: "invalid token, no user found" });
    }
    if (user.userType != "patient") {
      return res.status(401).json({ message: "only patient can access it" });
    }
    
 
    let doctors = await Doctor.find().populate("user_id", "-password -otp");

    console.log("doctors=", doctors);
    
    
    let formattedUsers = await Promise.all(
      doctors.map(async (doctor) => {
        let slot = await Slot.findOne({ doctor_id: doctor._id });
        if(doctor.user_id.timezone.code!=user.timezone.code){
        return {
          ...doctor.user_id._doc,
          doctor: {
            ...doctor._doc,
            availability: {
              slots: slot?slot:[],
            },
          },
          patient: null,
          payment_details: null,
          stripe_account: {
            account: doctor.bank_details.account_number,
          },
        };
      }
      else {
        return null;
      }
      })
    );
    return res.json({ users: formattedUsers });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// export const like_doctor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let errors = validationResult(req);
//     if (errors.isEmpty() === false) {
//       //@ts-ignore
//       return res
//         .status(422) //@ts-ignore
//         .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
//     }
//     //@ts-ignore
//     let userID = req.userID;
//     console.log("userID=", userID);
//     let user = await User.findById(userID);
//     if (user === null) {
//       return res.status(401).json({ message: "invalid token, no user found" });
//     }
//     if (user.userType != "patient") {
//       return res.status(401).json({ message: "only patient can access it" });
//     }
//     //@ts-ignore
//     let { doctor_id } = req.body;
//     let doctor = await Doctor.findById(doctor_id);

//     if (doctor === null) {
//       return res
//         .status(401)
//         .json({ message: "invalid doctor is, no doctor found" });
//     }

//     let is_liked = await Doctor.findOne({
//       likes: userID,
//     });
//     if (is_liked === null) {
//       await doctor.likes.push(userID);
//       await doctor.save();
//       return res.json({ doctor, liked: true });
//     } else {
//       return res.status(422).json({ message: "already liked doctor" });
//     }
//   } catch (err: any) {
//     return res.status(500).json({ message: err.message });
//   }
// };

// export const unlike_doctor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let errors = validationResult(req);
//     if (errors.isEmpty() === false) {
//       return res.status(422).json({
//         //@ts-ignore
//         message: errors.errors[0].param + " " + errors.errors[0].msg,
//       });
//     }

//     //@ts-ignore
//     let userID = req.userID;

//     console.log("userID=", userID);
//     let user = await User.findById(userID);

//     if (user === null) {
//       return res.status(401).json({ message: "invalid token, no user found" });
//     }
//     if (user.userType != "patient") {
//       return res.status(401).json({ message: "only patient can access it" });
//     }
//     //@ts-ignore
//     let { doctor_id } = req.body;
//     let doctor = await Doctor.findById(doctor_id);
//     if (doctor === null) {
//       return res
//         .status(401)
//         .json({ message: "invalid doctor is, no doctor found" });
//     }

//     // let arr:Array<any>=doctor.likes;

//     // await arr.push(userID);

//     // doctor.likes=arr;

//     await doctor.save();

//     return res.json({ doctor });
//   } catch (err: any) {
//     return res.status(500).json({ message: err.message });
//   }
// };

export const searchDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("query params=", req.query);
    let errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      //@ts-ignore
      return res.status(422).json({
        //@ts-ignore

        message: errors.errors[0].param + " " + errors.errors[0].msg,
      });
    }
    //@ts-ignore
    let userID = req.userID;

    let user = await User.findById(userID);
    if (user === null) {
      return res.status(401).json({ message: "user not found invalid token" });
    }
    if (user.userType != "patient") {
      return res.status(401).json({ message: "only patients can access it" });
    }
    let {
      medical_speciality,
      medical_field,
      is_24_7,
      query_text,
      medical_category,
    } = req.query;

    let matchConditions: any = {
      userType: "doctor",
    };
    if (medical_speciality) {
      if (medical_speciality.length === 0) {
        return res
          .status(422)
          .json({ message: "medical speciality invalid value" });
      }
      let _medical_speciality = await MedicalSpeciality.findOne({
        speciality: medical_speciality,
      });
      if (_medical_speciality === null) {
        return res
          .status(422)
          .json({ message: "invalid medical speciality value" });
      }
      matchConditions["doctor.medical_speciality"] = medical_speciality;
    }
    if (medical_field) {
      if (medical_field.length === 0) {
        return res.status(422).json({ message: "medical field invalid value" });
      }
      matchConditions["doctor.medical_field"] = medical_field;
    }
    if (is_24_7) {
      if (is_24_7 != "true" && is_24_7 != "false") {
        return res.status(422).json({ message: "is_24_7 invalid value" });
      }
      matchConditions["doctor.is_24_7"] = is_24_7;
    }
    console.log("medical_category=", medical_category);
    if (medical_category) {
      if (medical_category.length === 0) {
        return res
          .status(422)
          .json({ message: "medical category invalid value" });
      }
      matchConditions["doctor.medical_category"] = medical_category;
    }

    let pipeline = [
      {
        $search: {
          index: "UserSearchIndex",
          text: {
            //@ts-ignore
            query: query_text?.length > 0 ? query_text : "",
            path: {
              wildcard: "*",
            },
            fuzzy: {},
          },
        },
      },
    ];
    console.log("query_text 815 === ", query_text);

    console.log("818 conditions === ", matchConditions);
    let users: any;
    //@ts-ignore
    if (query_text?.length > 0) {
      users = await User.aggregate(pipeline).match(matchConditions);
    } else {
      users = await User.find(matchConditions);
    }

    console.log("825 users", users);

    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
