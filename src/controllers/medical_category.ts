// @ts-nocheck
import { validationResult } from "express-validator";
import MedicalCategory from "@models/medical_categories";
import { NextFunction, Response, Request, response } from "express";
import User from "@models/user";

export const getAllMedicalCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let medical_categories = await MedicalCategory.find();
    console.log("medical_categories 123=", medical_categories);
    return res.json({ medical_categories });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const addMedicalCategory = async (
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
    let { category } = req.body;
    let medical_category = await MedicalCategory.findOne({
      category: category,
    });
    if (medical_category != null) {
      return res.status(422).json({ message: "category already exists" });
    }
    medical_category = new MedicalCategory();
    medical_category.category = category;
    await medical_category.save();
    return res.json({ medical_category });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
