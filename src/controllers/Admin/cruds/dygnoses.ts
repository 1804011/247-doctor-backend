// @ts-nocheck
import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import Dygnoses from "@models/dygnoses";


// Get all dygnoses

const index = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {

        let dygnoses = await Dygnoses.find();
        return res.json({ dygnoses });
      
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };
  
// create a dygnoses

const store = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

      let errors: any = validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json({ errors });
      }
      let { dygnoses } = req.body;
      let dygnoses_ = await Dygnoses.findOne({
        dygnoses: dygnoses,
      });
      if (dygnoses_ != null) {
        return res.status(422).json({ message: "dygnoses already exists" });
      }
      dygnoses_ = new Dygnoses();
      dygnoses_.dygnoses = dygnoses;
      await dygnoses_.save();
      return res.json({ dygnoses: dygnoses_ });
    }
    catch (err: any) {
        res.status(500).json({
          message: err.message,
        });
      }
  }; 

// get dygnoses by id

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
    try {
      let dygnoses = await Dygnoses.findById(req.params.id);
      if (dygnoses == null) {
        return res.status(404).json({ message: "dygnoses not found" });
      }
      return res.json({ dygnoses });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
 };

// update dygnoses

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
      let { dygnoses } = req.body;
      let dygnoses_ = await Dygnoses.findById(req.params.id);
      if (dygnoses_ == null) {
        return res.status(404).json({ message: "dygnoses not found" });
      }
      dygnoses_.dygnoses = dygnoses;
      await dygnoses_.save();
      return res.json({ dygnoses: dygnoses_ });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
    };


// delete dygnoses

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
    try {
      let dygnoses = await Dygnoses.findById(req.params.id);
      if (dygnoses == null) {
        return res.status(404).json({ message: "dygnoses not found" });
      }
      await dygnoses.remove();
      return res.json({ message: "dygnoses deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
    };


module.exports= {index,store,show,update,destroy}