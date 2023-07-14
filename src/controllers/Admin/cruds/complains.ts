// @ts-nocheck
import Complain from "@models/complain";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";


// Get all complains

const index = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        let complains = await Complain.find();
        return res.json({ complains });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

// Create a new complain

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
      let { complain } = req.body;
      let complain_ = await Complain.findOne({
        complain: complain,
      });

      if (complain_ != null) {
        return res.status(422).json({ message: "complain alredy exists" });
      }
      complain_ = new Complain();
      complain_.complain = complain;
      await complain_.save();
      res.json({ complain: complain_ });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
};


// get complain by id

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {

        try {
            let complain = await Complain.findById(req.params.id);
            if (!complain) {
                return res.status(404).json({ message: "complain not found" });
            }
            return res.json({ complain });
            
        } catch (err: any) {
            res.status(500).json({ message: err.message });
            
        }
    };

// update complain by id

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
            let complain = await Complain.findById(req.params.id);
            if (!complain) {
                return res.status(404).json({ message: "complain not found" });
            }
            complain.complain = req.body.complain;
            await complain.save();
            return res.json({ complain });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

// delete complain by id

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
        try {
            let complain = await Complain.findById(req.params.id);
            if (!complain) {
                return res.status(404).json({ message: "complain not found" });
            }
            await complain.remove();
            return res.json({ message: "complain deleted" });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

module.exports ={index, store, show, update, destroy}