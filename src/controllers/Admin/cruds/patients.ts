// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { validationResult, check, body } from "express-validator";
import Patient from  "@models/patient";
import User from  "@models/user";
import bcrypt from "bcrypt";
import { createJWT } from "@middleware/auth";
import Diseases from "@models/diseases";

//Get all patients

const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
     //@ts-ignore
  const page: number = parseInt(req.query.page) || 1;
  //@ts-ignore
  const limit: number = parseInt(req.query.limit) || 10;
  const skip: number = (page - 1) * limit;
    const patient = await Patient.find(
      {},
      {
        payment_details: 0,
      }
    )
      .populate("user_id", "-password -otp")
      .populate("diseases_or_conditions").skip(skip).limit(limit).exec();
    //console.log(patient);
    const count = await Patient.countDocuments();


    const formattedPatients = patient.map((patient) => {
      return {
        id: patient._id,
        weight: patient.weight,
        height: patient.height,
          bloodGroup: patient.bloodGroup,
          is_under_doctor_care: patient.is_under_doctor_care,
          diseases_or_conditions: patient.diseases_or_conditions,
          relative_patients: patient.relative_patients,
          user_id: patient.user_id?._id,
          name: patient.user_id?.full_name,
          phone_number: patient.user_id?.phone_number,
          is_active: patient.user_id?.is_active,
          role: patient.user_id?.userType,
          email: patient.user_id?.email,
          profile_pic: patient.user_id?.profile_pic?.url,
          gender: patient.user_id?.gender,
          language: patient.user_id?.language,
          city: patient.user_id?.city,
          area: patient.user_id?.area,
          address: patient.user_id?.address,
          dob: patient.user_id?.dob,
          division: patient.user_id?.division,
          country: patient.user_id?.country,
          is_information_completed: patient.user_id?.is_information_completed,
       
      };
    });

    return res.status(200).json({
      data:formattedPatients,
      total: count,
      per_page: limit,
      current_page: page,
      last_page: Math.ceil(count / limit),
      next_page_url: null,
      prev_page_url: null,
      from: limit*(page-1) + 1,
      to:  limit*page,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// get patient by id

const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("user_id", "-password -otp")
      .populate("diseases_or_conditions");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const data = {
      id: patient._id,
      weight: patient.weight,
      height: patient.height,
      bloodGroup: patient.bloodGroup,
      is_under_doctor_care: patient.is_under_doctor_care,
      diseases_or_conditions: patient.diseases_or_conditions,
      relative_patients: patient.relative_patients,
      user_id: patient.user_id?._id,
      name: patient.user_id?.full_name,
      phone_number: patient.user_id?.phone_number,
      email: patient.user_id?.email,
      profile_pic: patient.user_id?.profile_pic?.url,
      gender: patient.user_id?.gender,
      language: patient.user_id?.language,
      city: patient.user_id?.city,
      area: patient.user_id?.area,
      address: patient.user_id?.address,
      dob: patient.user_id?.dob,
      division: patient.user_id?.division,
      country: patient.user_id?.country,
    
  };
  return res.status(200).json(data);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// store a new patient

const store = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: errors.array()[0].msg });
    }
    const {
      weight,
      height,
      bloodGroup,
      is_under_doctor_care,
      diseases_ids,
      relative_patients,
      name,
      email,
      phone_number,
      password,
      gender,
      language,
      city,
      area,
      address,
      dob,
      division,
      country,
    } = req.body;

    let file:any = req.file;
    console.log("file=", file);
    if (file === undefined) {
      return res.status(422).json({ message: "profile pic requied" });
    }
    const diseases = await Promise.all(
      diseases_ids.map((diseaseID) => Diseases.findById(diseaseID))
    );
   
    
   //@ts-ignore
    let user=await User.findOne({phone_number:phone_number}).select("-password -otp");
    if(user)
    {
      return res.status(422).json({ message: "phone_number number already exists" });
    }

    else{
      let encrypted_password = await bcrypt.hashSync(password, 10);
      let user = await new User({
        userType:"patient",
        full_name: name,
        phone_number:phone_number,
        password: encrypted_password,
        gender,
        language,
        city,
        area,
        address,
        dob,
        division,
        country,
        // profile_pic:{
        //   url:file.location,
        //   name:file.filename
        // },
        is_profile_created: false,
        is_information_completed: false,
        email:email || null,
      });
      const patient = await new Patient({
        user_id: user._id,
        is_profile_created: false,
        is_information_completed: false,
        weight,
        height,
        bloodGroup,
        is_under_doctor_care: is_under_doctor_care || false,
        
        diseases_or_conditions:diseases || [],
        relative_patients: relative_patients || [],
      });
      await user.save();
      await patient.save();
      
  const token = createJWT(user);
  return  res.status(201).json({ data: patient, token });
    }

  }
  catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// update patient by id

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: errors.array()[0].msg });
    }
    const {
      weight,
      height,
      bloodGroup, 
      name,
      email,
      diseases_ids,
      phone_number,
      password,
      gender,
      language,
      city,
      file,
      area,
      address,
      dob,
      division,
      country,
    } = req.body;
    console.log(req.body);

    const diseases = await Promise.all(
      diseases_ids.map((diseaseID) => Diseases.findById(diseaseID))
    );
   
    
    const patient = await Patient.findById(req.params.id).populate("user_id");
    const user = await User.findById(patient.user_id?._id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    else{
      patient.weight = weight;
      patient.height = height;
      patient.bloodGroup = bloodGroup;
      patient.is_under_doctor_care = false;
      patient.diseases_or_conditions=diseases;
      user.full_name = name ;
      user.email = email ;
      // user.profile_pic={
      //   url:file.location,
      //   name:file.filename,
      // }
      user.phone_number = phone_number ;
      user.gender = gender;
      user.language = language;
      user.city = city;
      user.area = area;
      user.address = address;
      user.division = division;
      user.country = country;
      if(password)
      {
        user.password = await bcrypt.hashSync(password, 10);
      }
      user.dob = dob;
      await patient.save();
      await user.save();
      return res.status(200).json({ message: "Patient updated" });

    }

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// delete patient by id

const destroy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("user_id");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    await patient.user_id?.remove();
    await patient.remove();
    return res.status(200).json({ message: "Patient deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// block/unblock a patient

const switchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.body.id).populate("user_id");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    console.log("Patient status",patient);
    patient.user_id.is_active = !patient.user_id.is_active;
    await patient.user_id.save();
    return res.status(200).json({ message: "Patient blocked" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  index,
  switchStatus,
  store,
  show,
  update,
  destroy,
};
