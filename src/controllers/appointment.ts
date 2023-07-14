// @ts-nocheck
import { validationResult, ValidationError, Result } from "express-validator";
import { Request, Response, NextFunction } from "express";
import User, { UserType } from "@models/user";
import Doctor, { DoctorType } from "@models/doctor";
import Patient, { PatientType } from "@models/patient";
import Slot, { SlotType } from "@models/slots";
import Appointment from "@models/appointment";
import Medicine from "@models/medicine";
import {
  convertUtcDateTimeToOnlyDate,
  convertUtcDateTimeToOnlyTime,
} from "../utils/helper";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pushNotificationService = require("@utils/push-notification");


export const getSlotsDateWise = async (
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
    } else if (user.userType != "patient") {
      return res.status(401).json({
        message: "only patient can access",
      });
    } else {
      let { doctor_id, date } = req.query;
      let doctor: DoctorType = await Doctor.findById(doctor_id);
      if (doctor === null) {
        return res.status(404).json({ message: "doctor not found" });
      }
      let slot: SlotType = await Slot.find({ doctor_id: doctor_id, is_booked: false, is_active: true }).sort({ from: 1 });
      let slots = slot.filter(slot => convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code) == date);
      if (slots.length === 0) {
        return res.status(200).json({ status: 0, message: "slot not found" });
      }
      let formattedSlot = slots.map(slot => {
        slot.from = convertUtcDateTimeToOnlyTime(slot.from, user.timezone?.code);
        slot.to = convertUtcDateTimeToOnlyTime(slot.to, user.timezone?.code);
        slot.date = convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code);
        return slot;
      }
      )
      return res.status(200).json({
        status: 1,
        data: formattedSlot,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

export const getAllAvailableSlots = async (
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
    } else if (user.userType != "patient") {
      return res.status(401).json({
        message: "only patient can access",
      });
    } else {
      let { doctor_id } = req.params;
      let doctor: DoctorType = await Doctor.findById(doctor_id);
      if (doctor === null) {
        return res.status(404).json({ message: "doctor not found" });
      }

      let slot: SlotType = await Slot.find({ doctor_id: doctor_id, is_booked: false, is_active: true }).sort({ date: 1, from: 1 });


      if (slot.length === 0) {
        return res.status(404).json({ message: "slot not found" });
      }

      let formattedSlot = slot.map(slot => {
        slot.from = convertUtcDateTimeToOnlyTime(slot.from, user.timezone?.code);
        slot.to = convertUtcDateTimeToOnlyTime(slot.to, user.timezone?.code);
        slot.date = convertUtcDateTimeToOnlyDate(slot.date, user.timezone?.code);
        return slot;
      })

      return res.status(200).json({
        status: 1,
        data: formattedSlot,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

export const requestAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: Result<ValidationError> = await validationResult(req);
    if (errors.isEmpty() === false) {
      console.log("errors=", errors.errors);
      return res
        .status(422)
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    console.log("req body=", req.body);
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "patient") {
      return res.status(401).json({
        message: "only patients can access",
      });
    } else {
      let {
        slot_id,
        doctor_id,
        is_relative,
        relative_patient,
      } = req.body;


      let doctor: DoctorType = await Doctor.findOne({
        _id: doctor_id,
      }).populate({
        path: "user_id",
        select: "playerID",
      });

      if (doctor === null) {
        return res
          .status(422)
          .json({ message: "invalid doctor id, no doctor found" });
      }
      let patient: PatientType = await Patient.findOne({ user_id: user._id });
      let slot: SlotType = await Slot.findById(slot_id);
      if (slot === null) {
        return res.status(422).json({ message: "invalid slot id" });
      }
      if (slot.is_booked) {
        return res.status(422).json({ message: "slot is already booked" });
      }
      let appointment = await new Appointment({
        patient: patient._id,
        doctor: doctor_id,
        slot: slot_id,
      });

      appointment.is_relative = is_relative;
      if (is_relative === true) {
        let user_relative = await User.findOne({
          _id: user._id,
          "relative.patient._id": relative_patient._id,
        });
        console.log("user_id 267 === ", user_relative);
        appointment.relative_patient = await relative_patient;
      }
      appointment.status = "awaiting";
      slot.is_booked = true;
      await slot.save();
      await appointment.save();
      console.log("appid", process.env.ONESIGNAL_APP_ID);

      var message = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: { "en": "New Appointment Request from " + user.full_name },
        include_player_ids: [doctor.user_id.playerID],
        content_available: true,
        small_icon: "ic_stat_onesignal_default",
        data: {
          pushTitle: "New login from " + user?.phone_number,
        }
      }
      pushNotificationService.sendNotification(message, (err: any, resp: any) => {
        if (err) {
          return next(err);
        }
        return res.json({ appointment });

      })

    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const getAllAwaitingAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor" && user.userType != "patient") {
      return res.status(401).json({
        message: "unauthorized access",
      });
    } else {
      if (user === null) {
        return res
          .status(401)
          .json({ message: "invalid token, no doctor found" });
      }
    }
    if (user.userType == "doctor") {
      let doctor: DoctorType = await Doctor.findOne({ user_id: user._id });
      let appointments = await Appointment.find({ doctor: doctor._id, status: "awaiting" }).populate({
        path: "patient",
        select: "-payment_details",
        populate: "user_id",
      }).populate({
        path: "doctor",
        populate: "user_id",
        select: "-bank_details",
      }).populate("slot").sort({ createdAt: -1 });
      if (appointments.length == 0) {
        return res.status(200).json({
          status: "false",
          message: "No awaiting appointments found"
        })
      }
      console.log("appointments=", appointments);

      return res.status(200).json({
        status: "success",
        data: appointments
      });
    }
    else if (user.userType == "patient") {
      let patient: PatientType = await Patient.findOne({ user_id: user._id });
      console.log("patient=", patient);

      let appointments = await Appointment.find({ patient: patient._id, status: "awaiting" }).populate({
        path: "patient",
        select: "-payment_details",
        populate: "user_id",
      }).populate({
        path: "doctor",
        populate: "user_id",
        select: "-bank_details",
      }).populate("slot").sort({ createdAt: -1 });
      console.log("appointments=", appointments);

      if (appointments.length == 0) {
        return res.status(200).json({
          status: "false",
          message: "No awaiting appointments found"
        })
      }
      console.log("appointments=", appointments);

      return res.status(200).json({
        status: "success",
        data: appointments
      });
    }
  }
  catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export const acceptAppointmentRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let errors: any = await validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json({
          message: errors.errors[0].param + " " + errors.errors[0].msg,
        });
      }

      let { appointment_id } =
        req.body;

      let doctor_id = await Doctor.findOne({ user_id: user._id }).select("_id");
      let appointment = await Appointment.findOne({
        "doctor": doctor_id,
        _id: appointment_id,
      }).populate({
        path: "patient",
        select: "-payment_details",
      });
      if (appointment === null) {
        return res
          .status(422)
          .json({ message: "invalid appointment id, not appointment found" });
      }
      appointment.is_prescription_written = false;
      appointment.status = "accepted";
      await appointment.save();

      //@ts-ignore

      // let patient = await User.findById(appointment.patient._id);

      // const paymentIntent = await stripe.paymentIntents.create(
      //   {
      //     amount: 1000,
      //     currency: "usd",
      //     application_fee_amount: 123,
      //   },
      //   {
      //     stripeAccount: patient.stripe_account.account.id,
      //   }
      // );
      // console.log("payment_intent 533=", paymentIntent);
      // return res.json({ appointment, paymentIntent });
      return res.status(200).json({ appointment });

    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectAppointmentRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only doctor can access",
      });
    } else {
      let errors: any = await validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json({
          message: errors.errors[0].param + " " + errors.errors[0].msg,
        });
      }
      let { appointment_id } = req.body;

      let appointment = await Appointment.findById(appointment_id);
      if (appointment === null) {
        return res.status(422).json({
          message: "invalid appointment id, no appointment found",
        });
      }

      appointment.status = "rejected";
      await appointment.save();
      return res.json({ appointment });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else {
      let errors: any = await validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json({
          message: errors.errors[0].param + " " + errors.errors[0].msg,
        });
      }
      let { appointment_id } = req.body;

      console.log("588=", req.body);

      let appointment = await Appointment.findById(appointment_id);
      if (appointment === null) {
        return res.status(422).json({
          message: "invalid appointment id, no appointment found",
        });
      }
      appointment.status = "cancelled";
      await appointment.save();
      return res.json({ appointment });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllActiveAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else if (user.userType != "doctor" && user.userType != "patient") {
      return res.status(401).json({
        message: "only doctor or patient can access",
      });
    } else {

      if (user.userType == "doctor") {
        let doctor: DoctorType = await Doctor.findOne({ user_id: user._id });
        let appointments = await Appointment.find({ doctor: doctor._id, status: "active" }).populate({
          path: "patient",
          select: "-payment_details",
          populate: "user_id",
        }).populate({
          path: "doctor",
          populate: "user_id",
          select: "-bank_details",
        }).populate("slot").sort({ createdAt: -1 });
        return res.json({ appointments });
      }
      if (user.userType == "patient") {
        let patient: PatientType = await Patient.findOne({ user_id: user._id });
        console.log("patient=", patient);

        let appointments = await Appointment.find({ patient: patient._id, status: "active" }).populate({
          path: "patient",
          select: "-payment_details",
          populate: "user_id",
        }).populate({
          path: "doctor",
          populate: "user_id",
          select: "-bank_details",
        }).populate("slot").sort({ createdAt: -1 });

        if (appointments.length == 0) {
          return res.status(200).json({
            status: "false",
            message: "No active appointments found"
          })
        }
        console.log("appointments=", appointments);

        return res.status(200).json({
          status: "success",
          data: appointments
        });
      }

    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



export const writePrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors: Result<ValidationError> = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422)
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    //@ts-ignore
    let user_id = req.userID;
    let user = await User.findById(user_id).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    }
    if (user.userType != "doctor") {
      return res.status(401).json({
        message: "only  doctors can access it",
      });
    }
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, no doctor found", user_id: user._id });
    }

    let {
      advice,
      complains,
      dygnoses,
      medicines,
      need_follow_up_consultation,
      investigation,
      appointment_id,
    } = req.body;

    let appointment = await Appointment.findById(appointment_id);
    let doctor_id = Doctor.findOne({ user_id: user._id }).select("_id");

    if (appointment === null) {
      return res
        .status(422)
        .json({ message: "invalid appointment id, no appointment found" });
    }
    console.log(appointment.doctor.toString(), doctor_id.toString());
    if (appointment.doctor.toString() != doctor_id.toString()) {
      return res.status(422).json({
        message: "invalid appointment id, no appointment of this doctor found",
      });
    }
    let meds: Array<any> = [];
    console.log("loop=====");
    for (let i = 0; i < medicines.length; i++) {
      console.log("duration unit=", medicines[i].duration_unit);

      let medicine = await Medicine.findById(medicines[i]._id);
      if (medicine === null) {
        return res
          .status(422)
          .json({ message: "invalid medicine id, not medicin found" });
      }
      await meds.push({
        ...medicine,
        instructions: medicines[i].instructions,
        duration_unit: medicines[i].duration_unit,
        dose_frequency: medicines[i].dose_frequency,
        dose_duration: medicines[i].dose_duration,
      });
    }
    if (complains.length === 0) {
      return res.status(422).json({ message: "complains array is required" });
    }
    if (dygnoses.length === 0) {
      return res.status(422).json({ message: "dygnoses array required" });
    }

    appointment.prescription.advice = advice;
    appointment.prescription.dygnoses = dygnoses;
    appointment.prescription.medicines = meds;
    appointment.prescription.need_follow_up_consultation =
      need_follow_up_consultation;
    appointment.prescription.complains = complains;
    appointment.prescription.dygnoses = dygnoses;
    appointment.prescription.investigation = investigation;
    appointment.is_prescription_written = true;
    await appointment.save();
    return res.json({ appointment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const finishAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let _user_id = req.userID;
    let user = await User.findOne({
      _id: _user_id,
    }).select("-password");
    if (user === null) {
      return res.status(401).json({ message: "invalid token user not found" });
    } else {
      let errors: any = await validationResult(req);
      if (errors.isEmpty() === false) {
        return res.status(422).json({
          message: errors.errors[0].param + " " + errors.errors[0].msg,
        });
      }
      let { appointment_id } = req.body;
      console.log("dsalkjdklsaj line 638===>", appointment_id);

      let appointment = await Appointment.findById(appointment_id);
      if (appointment === null) {
        return res.status(422).json({
          message: "invalid appointment id, no appointment found",
        });
      }

      let doctor = await Doctor.findById(appointment.doctor);
      if (doctor === null) {
        return res.status(422).json({ message: "no doctor found" });
      }

      const transfer = await stripe.transfers.create({
        amount: 1000,
        currency: "usd",
        destination: doctor.stripe_account.account.id,
      });
      console.log("paymentIntent 656 ===", transfer);
      appointment.status = "finished";
      await appointment.save();
      return res.json({ appointment, transfer });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



export const getAllAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID);
    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, no user found", user_id: user._id });
    }

    if (user.userType != "doctor" && user.userType != "patient") {
      return res.status(401).json({
        message: "invalid token, only doctor or patient can access it",
        user_id: user._id,
      });
    }

    if (user.userType == "doctor") {
      let doctor: DoctorType = await Doctor.findOne({ user_id: user._id });
      let appointments = await Appointment.find({ doctor: doctor._id }).populate({
        path: "patient",
        select: "-payment_details",
        populate: [
          {
            path: "user_id",
            select: "-password -otp -userType",
          },
          {
            path: "diseases_or_conditions",
            select: "disease",
          }
        ],
      }).populate({
        path: "doctor",
        select: "-bank_details",
        populate: [
          {
            path: "user_id",
            select: "-password -otp -userType",
          },
          {
            path: "medical_category",
            select: "category",
          },
          {
            path: "medical_speciality",
            select: "speciality",
          }
        ],
      }).populate("slot").sort({ createdAt: -1 }).lean();
      if (appointments.length == 0) {
        return res.status(200).json({ status: "failed", message: "no appointments found" });
      }
      const formattedData = appointments.map(appointment => {
        const { user_id: doctorUserId, ...doctorRest } = appointment.doctor;
        const doctor = { ...doctorUserId, ...doctorRest };
        const { user_id: patientUserId, ...patientRest } = appointment.patient;
        const patient = { ...patientUserId, ...patientRest };
        const { from, to, date, ...restSlot } = appointment.slot;
        const formattedSlot = {
          date: convertUtcDateTimeToOnlyDate(date, user.timezone?.code),
          from: convertUtcDateTimeToOnlyTime(from, user.timezone?.code),
          to: convertUtcDateTimeToOnlyTime(to, user.timezone?.code),
          ...restSlot
        };
        return { ...appointment, doctor, patient, slot: formattedSlot };

      });
      // console.log(formattedData);


      return res.status(200).json({ status: "success", data: formattedData });
    }
    if (user.userType == "patient") {
      let patient: PatientType = await Patient.findOne({ user_id: user._id });
      console.log("patient=", patient);
      let appointments = await Appointment.find({ patient: patient._id }).populate({
        path: "patient",
        select: "-payment_details",
        populate: [
          {
            path: "user_id",
            select: "-password -otp -userType",
          },
        ],
      }).populate({
        path: "doctor",
        select: "-bank_details",
        populate: [
          {
            path: "user_id",
            select: "-password -otp -userType",
          },
          {
            path: "medical_category",
            select: "category",
          },
          {
            path: "medical_speciality",
            select: "speciality",
          }
        ],
      }).populate("slot").sort({ createdAt: -1 }).lean();
      if (appointments.length == 0) {
        return res.status(200).json({ status: "failed", message: "no appointments found" });
      }
      const formattedData = appointments.map(appointment => {
        const { user_id: doctorUserId, ...doctorRest } = appointment.doctor;
        const doctor = { ...doctorUserId, ...doctorRest };
        const { user_id: patientUserId, ...patientRest } = appointment.patient;
        const patient = { ...patientUserId, ...patientRest };
        const { from, to, date, ...restSlot } = appointment.slot;
        const formattedSlot = {
          date: convertUtcDateTimeToOnlyDate(date, user.timezone?.code),
          from: convertUtcDateTimeToOnlyTime(from, user.timezone?.code),
          to: convertUtcDateTimeToOnlyTime(to, user.timezone?.code),
          ...restSlot
        };
        return { ...appointment, doctor, patient, slot: formattedSlot };

      });
      // console.log("transformedData=",formattedData);

      return res.status(200).json({ status: "success", data: formattedData });
    }



  } catch (err: any) {
    res.status(500).json({ message: err.message });


  }
};


// dont know about this function yet.

export const getUPComingAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    let userID = req.userID;
    let user = await User.findById(userID);

    if (user === null) {
      return res
        .status(401)
        .json({ message: "invalid token, no user found", user_id: user._id });
    }

    if (user.userType != "doctor" && user.userType != "patient") {
      return res.status(401).json({
        message: "invalid token, only doctor or patient can access it",
        user_id: user._id,
      });
    }
    if (user.userType === "patient") {
      let appointments = await Appointment.aggregate([
        {
          $lookup: {
            from: User.collection.name,
            localField: "doctor._id",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
        .match({
          status: "active",
          patient: {
            _id: user._id,
          },
          "slot.from_time": {
            $gt: new Date(),
          },
        })
        .project({
          "user.doctor": 0,
          "user.is_verified": 0,
          "user.password": 0,
          "user.is_profile_created": 0,
          "user.is_information_completed": 0,
        })
        .sort({ "slot.from_time": 1 })
        .limit(1);
      return res.json({ appointments });
    }
    if (user.userType === "doctor") {
      let appointments = await Appointment.aggregate([
        {
          $lookup: {
            from: User.collection.name,
            localField: "patient._id",
            foreignField: "_id",
            as: "patient",
          },
        },
      ])
        .match({
          $or: [
            {
              status: "active",
            },
          ],
          doctor: {
            _id: user._id,
          },
          "slot.from_time": {
            $gt: new Date(),
          },
        })
        .project({
          "doctor.bank_details": 0,
          "doctor.is_personal_profile_created": 0,
          "doctor.is_bank_details_completed": 0,
          "doctor.is_availability_details_completed": 0,
          "patient.password": 0,
          "patient.is_information_completed": 0,
          "patient.is_profile_created": 0,
          password: 0,
          is_profile_created: 0,
          is_information_completed: 0,
        })
        .sort({
          "slot.from_time": 1,
        })
        .limit(1);

      return res.json({ appointments });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// export const requestAppointment = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let errors: any = await validationResult(req);
//     if (errors.isEmpty() === false) {
//       console.log("errors=", errors.errors);
//       return res
//         .status(422)
//         .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
//     }
//     console.log("req body=", req.body);
//     const week_days = [
//       "sunday",
//       "monday",
//       "tuesday",
//       "wednesday",
//       "thursday",
//       "friday",
//       "saturday",
//     ];
//     //@ts-ignore
//     let _user_id = req.userID;
//     let user = await User.findOne({
//       _id: _user_id,
//     }).select("-password");
//     if (user === null) {
//       return res.status(401).json({ message: "invalid token user not found" });
//     } else if (user.userType != "patient") {
//       return res.status(401).json({
//         message: "only patients can access",
//       });
//     } else {
//       let {
//         from_slot_time,
//         to_slot_time,
//         appointment_day,
//         doctor_id,
//         appointment_date,
//         is_relative,
//         relative_patient,
//       } = req.body;

//       let doctor = await User.findOne({
//         _id: doctor_id,
//       });

//       if (doctor === null) {
//         return res
//           .status(422)
//           .json({ message: "invalid doctor id, no doctor found" });
//       }

//       const time_slots = await getAllTimeSlots();

//       if (time_slots.includes(from_slot_time.toLowerCase()) === false) {
//         return res.status(422).json({ message: "invalid from slot value" });
//       }

//       if (time_slots.includes(to_slot_time.toLowerCase()) === false) {
//         return res.status(422).json({ message: "invalid to slot value" });
//       }
//       let from_slot_index: number,
//         to_slot_index: number,
//         doc_from_slot_index: number,
//         doc_to_slot_index: number;
//       //doctor slots from db
//       let doc_from_slot = doctor.doctor.availability.slots.from;

//       let doc_to_slot = doctor.doctor.availability.slots.to;

//       await time_slots.map((item: String, index: number) => {
//         if (from_slot_time.toLowerCase() === item) {
//           from_slot_index = index;
//         }
//         if (to_slot_time.toLowerCase() === item) {
//           to_slot_index = index;
//         }
//         if (doc_from_slot.toLowerCase() === item) {
//           doc_from_slot_index = index;
//         }
//         if (doc_to_slot.toLowerCase() === item) {
//           doc_to_slot_index = index;
//         }
//       });

//       //@ts-ignore
//       if (to_slot_index > from_slot_index) {
//         console.log("continued everything is perfect");

//         var time = moment(from_slot_time, ["h:mm A"]).format("HH:mm");

//         var from_slot_date = new Date(appointment_date);
//         console.log(week_days[from_slot_date.getDay()], appointment_day);
//         if (week_days[from_slot_date.getDay()] != appointment_day) {
//           return res.status(422).json({
//             message: "specified date does not match with the appointment day",
//           });
//         }

//         let from_time_res = await convertTimeToDate(time);
//         from_slot_date.setUTCHours(parseInt(from_time_res.hour));
//         from_slot_date.setUTCMinutes(parseInt(from_time_res.mins));

//         let to_slot_date = new Date(appointment_date);
//         time = await moment(to_slot_time, ["h:mm A"]).format("HH:mm");
//         let to_time_res = await convertTimeToDate(time);
//         to_slot_date.setUTCHours(parseInt(to_time_res.hour));

//         to_slot_date.setUTCMinutes(parseInt(to_time_res.mins));

//         let check_day =
//           await doctor.doctor.availability.available_days.includes(
//             appointment_day
//           );

//         if (check_day === false) {
//           return res
//             .status(422)
//             .json({ messsage: "doctor not available on specified day" });
//         }
//         //@ts-ignore
//         if (from_slot_index < doc_from_slot_index) {
//           return res.status(422).json({
//             message:
//               "from time slot should be greater than or equal to doctor available from time slot",
//           });
//         }

//         //@ts-ignore
//         if (to_slot_index > doc_to_slot_index) {
//           return res.status(422).json({
//             message:
//               "to time slot should be less than or equal to doctor available to time slot",
//           });
//         }

//         let appointments = await Appointment.find({
//           doctor_id: doctor._id,
//           status: "active",
//           "slot.day": appointment_day,
//           "slot.date": appointment_date,
//           $or: [
//             {
//               $and: [
//                 {
//                   "slot.from_time": {
//                     $eq: from_slot_date,
//                   },
//                   "slot.to_time": {
//                     $eq: to_slot_date,
//                   },
//                 },
//               ],
//             },
//             {
//               $and: [
//                 {
//                   "slot.from_time": {
//                     $gte: from_slot_date,
//                   },
//                 },
//                 {
//                   "slot.from_time": {
//                     $lte: to_slot_date,
//                   },
//                 },
//               ],
//             },
//             {
//               $and: [
//                 {
//                   "slot.to_time": {
//                     $gte: from_slot_date,
//                   },
//                 },
//                 {
//                   "slot.to_time": {
//                     $lte: to_slot_date,
//                   },
//                 },
//               ],
//             },
//             {
//               $and: [
//                 {
//                   "slot.from_time": {
//                     $gte: from_slot_date,
//                   },
//                 },
//                 {
//                   "slot.from_time": {
//                     $lte: to_slot_date,
//                   },
//                 },
//               ],
//             },
//           ],
//         }).exec();
//         // return res.json({ appointments });
//         if (appointments.length > 0) {
//           return res.status(422).json({
//             message:
//               "no free slot available, doctor have already booked the appointment ",
//             appointments: appointments,
//           });
//         } else {
//           let appointment = await Appointment.findOne({
//             patient: {
//               _id: user._id,
//             },
//             status: "awaiting",
//             $and: [
//               {
//                 "slot.from_time": {
//                   $eq: from_slot_date,
//                 },
//               },
//               {
//                 "slot.to_time": {
//                   $eq: to_slot_date,
//                 },
//               },
//             ],
//           });
//           if (appointment != null) {
//             return res.status(422).json({
//               message: "already requested appointment",
//               appointment: appointment,
//             });
//           }

//           appointment = await new Appointment();
//           appointment.slot = {
//             day: appointment_day,
//             date: appointment_date,
//             from_time: from_slot_date,
//             to_time: to_slot_date,
//             from_slot: from_slot_time,
//             to_slot: to_slot_time,
//           };
//           appointment.patient = {
//             _id: mongoose.Types.ObjectId(user._id),
//           };
//           appointment.doctor = {
//             _id: mongoose.Types.ObjectId(doctor._id),
//           };
//           appointment.is_relative = is_relative;
//           if (is_relative === true) {
//             let user_relative = await User.findOne({
//               _id: user._id,
//               "relative.patient._id": relative_patient._id,
//             });
//             console.log("user_id 267 === ", user_relative);
//             appointment.relative_patient = await relative_patient;
//           }

//           appointment.status = "awaiting";
//           await appointment.save();
//           return res.json({ appointment });
//         }
//       } else {
//         res
//           .status(422)
//           .json({ message: "to time must be greater than from time" });
//       }
//     }
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const checkSlots = async (appointments: any, requested_slot: any) => {
//   try {
//     let slots: Array<any> = [];
//     console.log("appointmemts=", typeof appointments, appointments);

//     await appointments.map((item: any, index: number) => {
//       slots.push(item.slot);
//     });

//     console.log("slots=", slots);
//     return slots;
//   } catch (err: any) {
//     // res.status(500).json({ message: err.message });
//   }
// };

// export const getAllAwaitingAppointments = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     //@ts-ignore
//     let _user_id = req.userID;
//     let user = await User.findOne({
//       _id: _user_id,
//     }).select("-password");
//     if (user === null) {
//       return res.status(401).json({ message: "invalid token user not found" });
//     } else if (user.userType != "doctor" && user.userType != "patient") {
//       return res.status(401).json({
//         message: "unauthorized access",
//       });
//     } else {
//       if (user === null) {
//         return res
//           .status(401)
//           .json({ message: "invalid token, no doctor found" });
//       }

//       if (user.userType === "doctor") {
//         let appointments = await Appointment.aggregate([
//           {
//             $lookup: {
//               from: User.collection.name,
//               localField: "patient._id",
//               foreignField: "_id",
//               as: "patient",
//             },
//           },
//         ])
//           .match({
//             $or: [
//               {
//                 status: "awaiting",
//               },
//               {
//                 status: "rejected",
//               },
//             ],
//             doctor: {
//               _id: user._id,
//             },
//           })
//           .project({
//             "doctor.bank_details": 0,
//             "doctor.is_personal_profile_created": 0,
//             "doctor.is_bank_details_completed": 0,
//             "doctor.is_availability_details_completed": 0,
//             "patient.password": 0,
//             "patient.is_information_completed": 0,
//             "patient.is_profile_created": 0,
//             password: 0,
//             is_profile_created: 0,
//             is_information_completed: 0,
//           });

//         return res.json({ appointments });
//       }
//       if (user.userType === "patient") {
//         let appointments = await Appointment.aggregate([
//           {
//             $lookup: {
//               from: User.collection.name,
//               localField: "doctor._id",
//               foreignField: "_id",
//               as: "doctor",
//             },
//           },
//         ])
//           .match({
//             $or: [
//               {
//                 status: "awaiting",
//               },
//               {
//                 status: "rejected",
//               },
//             ],
//             patient: {
//               _id: user._id,
//             },
//           })
//           .project({
//             "doctor.is_personal_profile_created": 0,
//             "doctor.is_bank_details_completed": 0,
//             "doctor.is_availability_details_completed": 0,
//             "doctor.password": 0,
//             "doctor.is_professional_profile_created": 0,
//             "doctor.doctor": 0,
//             "patient._id": 0,
//           });

//         return res.json({ appointments });
//       }
//     }
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const acceptAppointmentRequest = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     //@ts-ignore
//     let _user_id = req.userID;
//     let user = await User.findOne({
//       _id: _user_id,
//     }).select("-password");
//     if (user === null) {
//       return res.status(401).json({ message: "invalid token user not found" });
//     } else if (user.userType != "doctor") {
//       return res.status(401).json({
//         message: "only doctor can access",
//       });
//     } else {
//       let errors: any = await validationResult(req);
//       if (errors.isEmpty() === false) {
//         return res.status(422).json({
//           message: errors.errors[0].param + " " + errors.errors[0].msg,
//         });
//       }

//       let { appointment_id, from_slot_time, to_slot_time, appointment_date } =
//         req.body;
//       let time_slots = await getAllTimeSlots();
//       if (time_slots.includes(from_slot_time.toLowerCase()) === false) {
//         return res.status(422).json({ message: "invalid from slot value" });
//       }
//       if (time_slots.includes(to_slot_time.toLowerCase()) === false) {
//         return res.status(422).json({ message: "invalid to slot value" });
//       }
//       let from_slot_index, to_slot_index;
//       await time_slots.map((item: String, index: number) => {
//         if (from_slot_time.toLowerCase() === item) {
//           from_slot_index = index;
//         }
//         if (to_slot_time.toLowerCase() === item) {
//           to_slot_index = index;
//         }
//       });

//       //@ts-ignore
//       if (to_slot_index > from_slot_index) {
//         let appointment = await Appointment.findOne({
//           "doctor._id": user._id,
//           _id: appointment_id,
//         });
//         if (appointment === null) {
//           return res
//             .status(422)
//             .json({ message: "invalid appointment id, not appointment found" });
//         }
//         if (
//           new Date(appointment.slot.date).toISOString().split("T")[0] !=
//           appointment_date
//         ) {
//           return res.status(422).json({
//             message: "appointment date doest not match with the appointment",
//           });
//         }
//         var time = moment(from_slot_time, ["h:mm A"]).format("HH:mm");

//         var from_slot_date = new Date(appointment.slot.date);

//         let res_ = await convertTimeToDate(time);

//         from_slot_date.setUTCHours(parseInt(res_.hour));
//         from_slot_date.setUTCMinutes(parseInt(res_.mins));

//         let to_slot_date = new Date(appointment.slot.date);
//         time = moment(to_slot_time, ["h:mm A"]).format("HH:mm");

//         res_ = await convertTimeToDate(time);
//         to_slot_date.setUTCHours(parseInt(res_.hour));
//         to_slot_date.setUTCMinutes(parseInt(res_.mins));

//         if (appointment.slot.to_time.toString() != to_slot_date.toString()) {
//           return res.status(422).json({
//             message:
//               "invalid to slot, appointment to slot mismatched with the provided to slot time",
//           });
//         }

//         if (
//           appointment.slot.from_time.toString() != from_slot_date.toString()
//         ) {
//           return res.status(422).json({
//             message:
//               "invalid from slot, appointment from slot mismatched with the provided from slot time",
//           });
//         }
//         appointment.is_prescription_written = false;
//         appointment.status = "active";
//         await appointment.save();
//         let appointments = await Appointment.find({
//           _id: {
//             $ne: appointment_id,
//           },
//           doctor_id: user._id,
//           "slot.from_time": from_slot_date,
//           "slot.to_time": to_slot_date,
//           "slot.date": appointment_date,
//         });
//         if (appointments.length > 0) {
//           await appointments.map(async (item: any, index: number) => {
//             item.status = "rejected";
//             await item.save();
//           });
//         }

//         let patient = await User.findById(appointment.patient._id);

//         const paymentIntent = await stripe.paymentIntents.create(
//           {
//             amount: 1000,
//             currency: "usd",
//             application_fee_amount: 123,
//           },
//           {
//             stripeAccount: patient.stripe_account.account.id,
//           }
//         );
//         console.log("payment_intent 533=", paymentIntent);
//         return res.json({ appointment, paymentIntent });
//       } else {
//         return res.status(422).json({
//           message: "to slot date must be greater than from slot time",
//         });
//       }
//     }
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };



// export const convertTimeToDate = async (time: any) => {
//   let Time = moment(time, ["h:mm A"]).format("HH:mm");
//   let hour = Time.split(":")[0];
//   let mins = Time.split(":")[1];
//   return { hour: hour, mins: mins };
// };


// export const getAllAppointments = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     //@ts-ignore
//     let userID = req.userID;
//     let user = await User.findById(userID);
//     if (user === null) {
//       return res
//         .status(401)
//         .json({ message: "invalid token, no user found", user_id: user._id });
//     }

//     if (user.userType != "doctor" && user.userType != "patient") {
//       return res.status(401).json({
//         message: "invalid token, only doctor or patient can access it",
//         user_id: user._id,
//       });
//     }
//     if (user.userType === "doctor") {
//       let appointments = await Appointment.aggregate([
//         {
//           $lookup: {
//             from: User.collection.name,
//             localField: "patient._id",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//       ])
//         .match({
//           doctor: {
//             _id: user._id,
//           },
//         })
//         .project({
//           "doctor.bank_details": 0,
//           "doctor.is_personal_profile_created": 0,
//           "doctor.is_bank_details_completed": 0,
//           "doctor.is_availability_details_completed": 0,
//           password: 0,
//           is_profile_created: 0,
//           is_information_completed: 0,
//           "patient.password": 0,
//           "patient.is_information_completed": 0,
//           "patient.is_profile_created": 0,
//         });
//       return res.json({ appointments });
//     }

//     if (user.userType === "patient") {
//       let appointments = await Appointment.aggregate([
//         {
//           $lookup: {
//             from: User.collection.name,
//             localField: "doctor._id",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//       ])
//         .match({
//           patient: {
//             _id: user._id,
//           },
//         })
//         .project({
//           "user.doctor": 0,
//           "user.is_verified": 0,
//           "user.password": 0,
//           "user.is_profile_created": 0,
//           "user.is_information_completed": 0,
//         });
//       return res.json({ appointments });
//     }
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };
