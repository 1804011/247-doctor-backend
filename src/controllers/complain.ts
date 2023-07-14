// @ts-nocheck
import Complain from "@models/complain";
import User from "@models/user";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export const createComplain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("req complain 13===",req?.body)
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
    }
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
export const getAllComplains = async (
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
      let complains = await Complain.find();

      return res.json({ complains });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
