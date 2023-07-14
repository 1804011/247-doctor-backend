// @ts-nocheck
import { validationResult } from "express-validator";
import MedicalSpeciality from "@models/medical_specialities";
import { NextFunction, Response, Request, response } from "express";
import User from "@models/user";

export const getAllMedicalSpecialities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let medical_specialities = await MedicalSpeciality.find();
    console.log("medical_specialities 123=", medical_specialities);
    return res.json({ medical_specialities });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const addMedicalSpeciality = async (
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
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findById(_user_id);
    if (user === null) {
      return res.status(401).json({ message: "invalid token, user not found" });
    }
    if (user.userType != "admin") {
      return res.status(401).json({ message: "only admins can access it" });
    }
    let { speciality } = req.body;
    let medical_speciality = await MedicalSpeciality.findOne({
      speciality: speciality,
    });
    if (medical_speciality != null) {
      return res.status(422).json({ message: "speciality already exists" });
    }
    medical_speciality = new MedicalSpeciality();
    medical_speciality.speciality = speciality;
    await medical_speciality.save();
    return res.json({ medical_speciality });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
