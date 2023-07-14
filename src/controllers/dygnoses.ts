// @ts-nocheck
import { validationResult } from "express-validator";
import User from "@models/user";
import { NextFunction, Request, Response } from "express";
import Dygnoses from "@models/dygnoses";

export const createDygnoses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findById(_user_id);
    if (user === null) {
      return res.status(401).json({ message: "invalid token, user not found" });
    } else if (user.userType != "admin") {
      return res.status(401).json({ message: "only admin can access it" });
    } else {
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
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getAllDygnoses = async (
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
      let dygnoses = await Dygnoses.find();
      return res.json({ dygnoses });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
