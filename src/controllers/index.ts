// @ts-nocheck
import Diseases from "@models/diseases";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
export const save_diseases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { disease } = req.body;
    let _disease = await Diseases.findOne({
      disease: disease,
    });
    if (_disease != null) {
      return res
        .status(422)
        .json({ message: "disease or condition already exists" });
    }
    _disease = new Diseases({
      disease: disease,
    });
    await _disease.save();
    res.json({ _disease });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllTimeSlots = async () => {
  let start_time = "12:00 am";
  let end_time = "11:59pm";
  let slotInterval = 30;
  //Format the time
  let startTime = moment(start_time, "hh:mm a");

  //Format the end time and the next day to it
  let endTime = moment(end_time, "hh:mm a").add(1, "days");

  //Times
  let allTimes = [];

  //Loop over the times - only pushes time with 30 minutes interval
  while (startTime <= endTime) {
    //Push times
    allTimes.push(startTime.format("hh:mm a"));
    //Add interval of 30 minutes
    startTime.add(slotInterval, "minutes");
  }

  return allTimes;
};

export const getTimeSlotsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let time_slots = await getAllTimeSlots();
    return res.json({ time_slots });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMedicalSpecialities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
