// @ts-nocheck
import Medicine from "@models/medicine";
import User from  "@models/user";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

// Get all medicines

const index = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
     
        let medicines = await Medicine.find();
        return res.json({ medicines });
      
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

// create a medicine

const store = async (
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
       catch (err: any) {
        res.status(500).json({ message: err.message });
      }
  };
  

  // get medicine by id

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
            try {
                let medicine = await Medicine.findOne({ _id: req.params.id });
                if (medicine === null) {
                    return res.status(404).json({ message: "medicine not found" });
                } else {
                    return res.json({ medicine });
                }

            } catch (err: any) {
                res.status(500).json({ message: err.message });
            }
    };

// update medicine by id

const update = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
        try {
            let medicine = await Medicine.findOne({ _id: req.params.id });
            if (medicine === null) {
                return res.status(404).json({ message: "medicine not found" });
            } else {
                let errors: any = await validationResult(req);
                if (errors.isEmpty() === false) {
                    return res.status(422).json(errors);
                }
                let { generic_name, brand_name, medicineType } = req.body;
                medicine.generic_name = generic_name;
                medicine.brand_name = brand_name;
                medicine.medicineType = medicineType;
                await medicine.save();
                return res.json({ medicine });
            }
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };
    
// delete medicine by id

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
        try {
            let medicine = await Medicine.findOne({ _id: req.params.id });
            if (medicine === null) {
                return res.status(404).json({ message: "medicine not found" });
            } else {
                await medicine.remove();
                return res.json({ message: "medicine deleted" });
            }
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

module.exports = {index,store,show,update,destroy};