// @ts-nocheck
import { validationResult, ValidationError, Result } from "express-validator";
import { Request, Response, NextFunction } from "express";
import Doctor, { DoctorType } from "@models/doctor";
import Patient, { PatientType } from "@models/patient";
import Slot, { SlotType } from "@models/slots";
import Appointment from "@models/appointment";
import {
    convertUtcDateTimeToOnlyDate,
    convertUtcDateTimeToOnlyTime,
} from "@utils/helper";


// get all appointments

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

        let appointments = await Appointment.find({}, {
            id: "$_id",
            status: 1,
        }).populate({
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
        }).populate("slot").sort({ createdAt: -1 }).lean().skip(skip).limit(limit).exec();
        if (appointments.length == 0) {
            return res.status(200).json({ status: "failed", message: "no appointments found" });
        }
        const formattedData = appointments.map(appointment => {
            const { user_id: doctorUserId, ...doctorRest } = appointment.doctor ? appointment.doctor : {};
            const doctor = { ...doctorUserId, ...doctorRest };
            const { user_id: patientUserId, ...patientRest } = appointment.patient ? appointment.patient : {};
            const patient = { ...patientUserId, ...patientRest };
            const { from, to, date, ...restSlot } = appointment.slot ? appointment.slot : {};
            console.log(req.user);

            const formattedSlot = {
                // @ts-ignore
                date: convertUtcDateTimeToOnlyDate(date, req.user.timezone?.code),
                from: convertUtcDateTimeToOnlyTime(from, req.user.timezone?.code),
                to: convertUtcDateTimeToOnlyTime(to, req.user.timezone?.code),
                ...restSlot
            };
            return { ...appointment, doctor, patient, slot: formattedSlot };

        });
        // console.log(formattedData);
        const count = await Appointment.countDocuments();
        return res.json({
            data: formattedData,
            total: count,
            per_page: limit,
            current_page: page,
            last_page: Math.ceil(count / limit),
            next_page_url: null,
            prev_page_url: null,
            from: limit * (page - 1) + 1,
            to: limit * page,
        });


    } catch (err: any) {
        res.status(500).json({ message: err.message });


    }
};

// create a new appointment

const store = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let errors: Result<ValidationError> = validationResult(req);
        if (errors.isEmpty() === false) {
            return res.status(442).json({ errors });
        }
        let { doctor_id, patient_id, slot_id, status } = req.body;
        let doctor: DoctorType = await Doctor.findOne({
            _id: doctor_id,
        });
        if (!doctor) {
            return res.status(404).json({ status: "failed", message: "doctor not found" });
        }
        let patient: PatientType = await Patient.findOne({
            _id: patient_id,
        });
        if (!patient) {
            return res.status(404).json({ status: "failed", message: "patient not found" });
        }
        let slot = await Slot.findOne({
            _id: slot_id,
        });
        if (!slot) {
            return res.status(404).json({ status: "failed", message: "slot not found" });
        }
        let appointment = await Appointment.findOne({
            doctor: doctor._id,
            patient: patient._id,
            slot: slot._id,
            status: status
        });
        if (appointment) {
            return res.status(409).json({ status: "failed", message: "appointment already exists" });
        }
        let appointment_ = new Appointment({
            doctor: doctor._id,
            patient: patient._id,
            slot: slot._id,
        });
        appointment_.status = status;
        slot.is_booked = true;
        await slot.save();
        await appointment_.save();
        return res.status(201).json({ status: "success", message: "appointment created successfully" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}


// show appointment

const show = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let appointment = await Appointment.findById(req.params.id, {
            id: "$_id",
            status: 1,
        }).populate({
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
        }).populate("slot").lean().exec();
        if (!appointment) {
            return res.status(404).json({ status: "failed", message: "appointment not found" });
        }
        const { user_id: doctorUserId, ...doctorRest } = appointment.doctor ? appointment.doctor : {};
        const doctor = { ...doctorUserId, ...doctorRest };
        const { user_id: patientUserId, ...patientRest } = appointment.patient ? appointment.patient : {};
        const patient = { ...patientUserId, ...patientRest };
        const { from, to, date, ...restSlot } = appointment.slot ? appointment.slot : {};
        const formattedSlot = {
            // @ts-ignore
            date: convertUtcDateTimeToOnlyDate(date, req.user.timezone?.code),
            from: convertUtcDateTimeToOnlyTime(from, req.user.timezone?.code),
            to: convertUtcDateTimeToOnlyTime(to, req.user.timezone?.code),
            ...restSlot
        };
        return res.status(200).json({ ...appointment, doctor, patient, slot: formattedSlot });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};




// update appointment

const update = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { doctor_id, patient_id, slot_id, status } = req.body;
        console.log(req.body);

        let appointment = await Appointment.findById(req.params.id);
        console.log(appointment);

        if (!appointment) {
            return res.status(404).json({ status: "failed", message: "appointment not found" });
        }

        // Validate if the doctor exists
        let doctor = await Doctor.findById(doctor_id);
        if (!doctor) {
            return res.status(404).json({ status: "failed", message: "doctor not found" });
        }

        // Validate if the patient exists
        let patient = await Patient.findById(patient_id);
        if (!patient) {
            return res.status(404).json({ status: "failed", message: "patient not found" });
        }

        // Validate if the slot exists
        let slot = await Slot.findById(slot_id);
        if (!slot) {
            return res.status(404).json({ status: "failed", message: "slot not found" });
        }

        appointment.doctor = doctor._id;
        appointment.patient = patient._id;
        appointment.slot = slot._id;
        appointment.status = status;

        await appointment.save();
        return res.status(200).json({ status: "success", message: "appointment updated successfully" });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// delete appointment

const destroy = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ status: "failed", message: "appointment not found" });
        }
        await appointment.remove();
        return res.status(200).json({ status: "success", message: "appointment deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    index,
    store,
    show,
    update,
    destroy
};