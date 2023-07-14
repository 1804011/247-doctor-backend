// @ts-nocheck
import Diseases from "@models/diseases";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";



// Get all disease

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
  let disease = await Diseases.find({},{
    id:"$_id",
    disease:1
  }).skip(skip).limit(limit).exec();
       
      // console.log(disease);
        const count = await Diseases.countDocuments();
        return res.json({  
          data:disease,
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

// Create a new disease

export const store = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
     
      let errors: any = validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(442).json({ errors });
      }
      let { disease } = req.body;
      let disease_ = await Diseases.findOne({
        disease: disease,
      });

      if (disease_ != null) {
        return res.status(422).json({ message: "disease alredy exists" });
      }
      disease_ = new Diseases();
      disease_.disease = disease;
      await disease_.save();
      res.json({ disease: disease_ });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
};


// get disease by id

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {

        try {
            let disease = await Diseases.findById(req.params.id,{
              id:'$_id',
              disease:1
            });
            if (!disease) {
                return res.status(404).json({ message: "disease not found" });
            }
            return res.json( disease );
            
        } catch (err: any) {
            res.status(500).json({ message: err.message });
            
        }
    };

// update disease by id

const update = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
        try {
            let errors: any = validationResult(req);
            if (errors.isEmpty() === false) {
                return res.status(422).json({ errors });
            }
            let disease = await Diseases.findById(req.params.id);
            if (!disease) {
                return res.status(404).json({ message: "disease not found" });
            }
            console.log(req.body);
            disease.disease = req.body.disease;
            await disease.save();
            return res.json({ disease });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

// delete disease by id

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
        try {
            let disease = await Diseases.findById(req.params.id);
            if (!disease) {
                return res.status(404).json({ message: "disease not found" });
            }
            await disease.remove();
            return res.json({ message: "disease deleted" });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

module.exports ={index, store, show, update, destroy}