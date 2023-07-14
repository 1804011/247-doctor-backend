// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import User, { UserType } from "@models/user";
import Slot, { SlotType } from "@models/slots";
import Doctor, { DoctorType } from "@models/doctor";
import {
  convertOthersToUtcDateTime,
  convertUtcDateTimeToOnlyDate,
  convertUtcDateTimeToOnlyTime,
} from "../utils/helper";




export const doctorSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user: UserType = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      
      let doctor: DoctorType = await Doctor.findOne({user_id:user._id});
      if (doctor === null) {
        return res.status(404).json({ message: "doctor not found" });
      }
      
      let slot:SlotType=await Slot.find({doctor_id:doctor._id}).sort({date:1,from:1});


      if (slot.length === 0) {
        return res.status(404).json({ message: "slot not found" });
      }
      
        let formattedSlot=slot.map(slot=>{
        slot.from=convertUtcDateTimeToOnlyTime(slot.from, user.timezone?.code);
        slot.to=convertUtcDateTimeToOnlyTime(slot.to, user.timezone?.code);
        slot.date=convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code);
        return slot;
      })

      return res.status(200).json({
        status:1,
        data: formattedSlot,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}


// get all slots by doctor id and date

export const index = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user: UserType = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor: DoctorType = await Doctor.findOne({ user_id: user._id });
      let { date, from, to } = req.body;
      let utcDate = convertOthersToUtcDateTime(date, from, user.timezone?.utc);
      let utcFrom = convertOthersToUtcDateTime(date, from, user.timezone?.utc);
      let utcTo = convertOthersToUtcDateTime(date, to, user.timezone?.utc);

      console.log(utcDate);
      let slot:SlotType = await Slot.find({
        date: utcDate,
        from: utcFrom,
        to: utcTo,
        doctor_id: doctor?._id,
      });

      // let formattedSlots = slots.map(slot => {
      //   let from = convertUtcToOthersDateTime(slot.from, user.timezone?.code);
      //   let to = convertUtcToOthersDateTime(slot.to, user.timezone?.code);
      //   return { date: utcDate, from: from, to: to };
      // });
      if (slot.length === 0) {
        return res.status(404).json({ message: "slot not found" });
      }
      // console.log(slot);
      let formattedSlot=slot.map(slot=>{
        slot.from=convertUtcDateTimeToOnlyTime(slot.from, user.timezone?.code);
        slot.to=convertUtcDateTimeToOnlyTime(slot.to, user.timezone?.code);
        slot.date=convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code);
        return slot;
      })
      // slot[0].from=convertUtcToOthersDateTime(slot.from, user.timezone?.code);
      // slot[0].to=convertUtcToOthersDateTime(slot.to, user.timezone?.code);
      // slot[0].date=convertUtcToOthersDateTime(slot.date, user.timezone?.code);

      return res.status(200).json({
        status:1,
        data: formattedSlot,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// Create a new slot datewise

export const createSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errors = await validationResult(req);
  if (errors.isEmpty() === false) {
    //@ts-ignore
    return res
      .status(422) //@ts-ignore
      .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
  }
  try {
    //@ts-ignore
    let _user = req.userID;
    let user: UserType = await User.findOne({
      _id: _user,
    });
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor: DoctorType = await Doctor.findOne({ user_id: user._id });
      const { date, from, to } = req.body;
      const formattedFrom = convertOthersToUtcDateTime(
        date,
        from,
        user.timezone?.utc
      );
      const formattedTo = convertOthersToUtcDateTime(
        date,
        to,
        user.timezone?.utc
      );
      const formattedDate = convertOthersToUtcDateTime(
        date,
        from,
        user.timezone?.utc
      );
      console.log(formattedDate);

      if (formattedDate === "Invalid Date") {
        return res.status(400).json({
          message: "Invalid Date",
        });
      }

      const existingSlot: SlotType = await Slot.find({
        doctor_id: doctor?._id,
        date: formattedDate,
        $or: [
          {
            $and: [
              { from: { $lte: formattedFrom } },
              { to: { $gt: formattedFrom } },
            ],
          },
          {
            $and: [
              { from: { $lt: formattedTo } },
              { to: { $gte: formattedTo } },
            ],
          },
          {
            $and: [
              { from: { $gte: formattedFrom } },
              { to: { $lte: formattedTo } },
            ],
          },
        ],
      });
      console.log(existingSlot);
      if (existingSlot.length > 0) {
        return res.status(200).json({
          status:0,
          message: "Slot already exists"
        });
      } else {
        const newSlot:SlotType = new Slot({
          doctor_id: doctor?._id,
          date: formattedDate,
          from: formattedFrom,
          to: formattedTo,
          is_active: true,
          is_booked: false,
        });
        await newSlot.save();
        newSlot.from=convertUtcDateTimeToOnlyTime(formattedFrom, user.timezone?.code);
        newSlot.to=convertUtcDateTimeToOnlyTime(formattedTo, user.timezone?.code);
        newSlot.date=convertUtcDateTimeToOnlyDate(formattedDate, user.timezone?.code);
        return res.status(200).json({
          status:1,
          message: "Slot created successfully",
          data: newSlot,
        });
      }
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// get a slot by id

export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let slot:SlotType = await Slot.findById(req.params.id);
     //@ts-ignore
     let _user = req.userID;
     let user: UserType = await User.findOne({
       _id: _user,
     });
      if (user === null) {
        return res.status(401).json({ message: "invalid token user not found" });
      } else if (user.userType != "doctor") {
        return res.status(401).json({
          message: "only doctor can access",
        });
      }
    
    if (!slot) {
      return res.status(404).json({ message: "slot not found" });
    }   
      slot.from=convertUtcDateTimeToOnlyTime(slot.from, user.timezone?.code);
      slot.to=convertUtcDateTimeToOnlyTime(slot.to, user.timezone?.code);
      slot.date=convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code);
      return res.status(200).json({
        status:1,
        data: slot,
      });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// update a slot by id

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errors = await validationResult(req);
  if (errors.isEmpty() === false) {
    //@ts-ignore
    return res
      .status(422) //@ts-ignore
      .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
  }
  try {
    //@ts-ignore
    let _user = req.userID;
    let user = await User.findOne({
      _id: _user,
    });
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let doctor = await Doctor.findOne({ user_id: _user });
      let slot = await Slot.findById(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: "slot not found" });
      }
      let { date, from, to } = req.body;
      const formattedFrom = convertOthersToUtcDateTime(
        date,
        from,
        user.timezone?.utc
      );
      const formattedTo = convertOthersToUtcDateTime(
        date,
        to,
        user.timezone?.utc
      );
      const formattedDate = convertOthersToUtcDateTime(
        date,
        from,
        user.timezone?.utc
      );
      console.log(formattedDate);

      if (formattedDate === "Invalid Date") {
        return res.status(400).json({
          message: "Invalid Date"
        });
      }

      const existingSlot: SlotType = await Slot.find({
        doctor_id: doctor?._id,
        date: formattedDate,
        $or: [
          {
            $and: [
              { from: { $lte: formattedFrom } },
              { to: { $gt: formattedFrom } },
            ],
          },
          {
            $and: [
              { from: { $lt: formattedTo } },
              { to: { $gte: formattedTo } },
            ],
          },
          {
            $and: [
              { from: { $gte: formattedFrom } },
              { to: { $lte: formattedTo } },
            ],
          },
        ],
      });
      console.log(existingSlot);
      if (existingSlot.length > 0) {
        return res.status(200).json({
          status:0,
          message: "Slot already exists"
        });
      } else {
        slot.date = formattedDate;
        slot.from = formattedFrom;
        slot.to = formattedTo;
        await slot.save();
        return res.status(200).json({
          status:1,
          message: "Slot updated successfully",
          data: slot,
        });
      }
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// delete a slot by id

export const destroy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user = req.userID;
    let user:UserType = await User.findOne({ _id: _user });
    if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    }
    let slot:SlotType = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "slot not found" });
    }
    await slot.remove();
    return res.status(200).json({ message: "slot deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// active/deactive slot

export const switchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user = req.userID;
    let user:UserType = await User.findOne({ _id: _user });
    if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    }
    let slot:SlotType = await Slot.findById(req.body.id);
    if (!slot) {
      return res.status(404).json({ message: "slot not found" });
    }
    slot.is_active = !slot.is_active;
    await slot.save();
    return res.status(200).json({
      status:1,
      message: "slot status updated successfully",
      data: slot,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
