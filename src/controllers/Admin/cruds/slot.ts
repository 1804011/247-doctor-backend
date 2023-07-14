// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import User, { UserType } from "@models/user";
import Slot, { SlotType } from "@models/slots";
import Doctor, { DoctorType } from "@models/doctor";
import {
  convertUtcDateTimeToOnlyDate,
  convertUtcDateTimeToOnlyTime,
} from "@utils/helper";

const doctorSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore

    let slots: SlotType = await Slot.find(
      {
        doctor_id: req.query.id,
        is_active: true,
        date: { $gte: new Date().toISOString().split("T")[0] }, // Filter by current date and future dates
      },
      {
        id: "$_id",
        from: 1,
        to: 1,
        date: 1,
      }
    )
      .sort({ date: 1, from: 1 })
      .lean()
      .exec();

    if (slots.length === 0) {
      return res.status(200).json([]);
    }

    let formattedSlot = slots.map((slot) => {
      slot.from = convertUtcDateTimeToOnlyTime(
        slot.from,
        req.user.timezone?.code
      );
      slot.to = convertUtcDateTimeToOnlyTime(
        slot.to,
        req.user.timezone?.code
      );
      slot.date = convertUtcDateTimeToOnlyDate(
        slot.date,
        req.user.timezone?.code
      );
      return slot;
    });

    return res.status(200).json(formattedSlot);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  doctorSlots,
};
