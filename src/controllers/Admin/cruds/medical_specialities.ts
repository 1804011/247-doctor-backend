// @ts-nocheck
import { validationResult } from "express-validator";
import MedicalSpeciality from "@models/medical_specialities";
import { NextFunction, Response, Request, response } from "express";



// Get all medical specialities

const index = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
      //@ts-ignore
const page: number = parseInt(req.query.page) || 1;
//@ts-ignore
const limit: number = parseInt(req.query.limit) || 10;
const skip: number = (page - 1) * limit;
let specialities = await MedicalSpeciality.find({},{
  id:"$_id",
  speciality:1
}).skip(skip).limit(limit).exec();
     
    // console.log(disease);
      const count = await MedicalSpeciality.countDocuments();
      return res.json({  
        data:specialities,
        total: count,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(count / limit),
        next_page_url: null,
        prev_page_url: null,
        from: limit*(page-1) + 1,
        to:  limit*page, });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// add a new medical speciality

const store = async (
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


// get speciality by id

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
 ) => {
    try {
        let medical_speciality = await MedicalSpeciality.findById(req.params.id,{
          id:"$_id",
          speciality:1,
        });
        if (medical_speciality === null) {
        return res.status(404).json({ message: "speciality not found" });
        }
        return res.json(medical_speciality );
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// update medical speciality

const update = async (
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
        let medical_speciality = await MedicalSpeciality.findById(req.params.id);
        if (medical_speciality === null) {
        return res.status(404).json({ message: "speciality not found" });
        }
        medical_speciality.speciality = req.body.speciality;
        await medical_speciality.save();
        return res.json({ medical_speciality });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};


// delete medical speciality

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
    try {
        let medical_speciality = await MedicalSpeciality.findById(req.params.id);
        if (medical_speciality === null) {
        return res.status(404).json({ message: "speciality not found" });
        }
        await medical_speciality.remove();
        return res.json({ message: "speciality deleted" });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};


module.exports= {index,store,show,update,destroy}