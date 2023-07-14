// @ts-nocheck
import MedicalCategory from "@models/medical_categories";

import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";

// Get All categories

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
let categories = await MedicalCategory.find({},{
  id:"$_id",
  category:1
}).skip(skip).limit(limit).exec();
     
    // console.log(disease);
      const count = await MedicalCategory.countDocuments();
      return res.json({  
        data:categories,
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

  
  // Add new medical category
  
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
  // get categories by id
  
  
   const show = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let medical_category = await MedicalCategory.findById(req.params.id,{
        id:"$_id",
        category:1,
      });
      if (medical_category == null) {
        return res.status(422).json({ message: "category does not exist" });
      }
      return res.json( medical_category );
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  };
  
  
  // edit a medical category
  
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
      let { category } = req.body;
      let medical_category = await MedicalCategory.findById(req.params.id);
      if (medical_category == null) {
        return res.status(422).json({ message: "category does not exist" });
      }
      medical_category.category = category;
      await medical_category.save();
      return res.json({ medical_category });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  };
  
  // remove a medical category
  
   const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let medical_category = await MedicalCategory.findById(
        req.params.id
      );
      console.log(medical_category);
      
     await medical_category.remove();
      return res.json({ message: "Succesfully Deleted" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  };
  

  module.exports= {index,store,show,update,destroy}