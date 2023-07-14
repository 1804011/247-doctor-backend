// @ts-nocheck
import Medicine from "@models/medicine";
import User from "@models/user";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const createMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "admin") {
      return res.status(401).json({
        message: "only admin can access",
      });
    } else {
      let errors: any = await validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json(errors);
      }
      let { generic_name, brand_name, medicineType } = req.body;
      let medicine = await Medicine.findOne({
        brand_name: brand_name,
      });

      if (medicine != null) {
        return res
          .status(422)
          .json({ message: "brand name of the medicine should be unique" });
      } else {
        medicine = new Medicine();
        medicine.generic_name = generic_name;
        medicine.brand_name = brand_name;
        medicine.medicineType = medicineType;
        medicine.user_id = user._id;
        await medicine.save();
        return res.json({ medicine });
      }
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore

    let user_id = req.userID;
    let user = await User.findById(user_id);
    if (user === null) {
      return res.status(401).json({ message: "invalid token no user found" });
    } else {
      let medicines = await Medicine.find();

      return res.json({ medicines });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
