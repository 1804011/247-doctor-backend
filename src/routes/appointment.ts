import {
  acceptAppointmentRequestValidation,
  cancelAppointmentValidation,
  finishAppointmentValidation,
  rejectAppointmentRequestValidation,
  requestAppointmentValidation,
  writePrescriptionValidation,
} from "@validations/appointment";
import {
  acceptAppointmentRequest,
  cancelAppointment,
  finishAppointment,
  getAllActiveAppointments,
  getAllAppointments,
  getAllAwaitingAppointments,
  getUPComingAppointment,
  rejectAppointmentRequest,
  getAllAvailableSlots,
  getSlotsDateWise,
  // acceptAppointmentRequest,
  // finishAppointment,
  // getAllActiveAppointments,
  // getAllDoctorAwaitingAppointments,
  requestAppointment,
  writePrescription,
  // writePrescription,
} from "@controllers/appointment";
import { ensureAuthenticated } from "@middleware/auth";
import express from "express";
var router = express.Router();

router.get('/get-all-available-slots/:doctor_id',ensureAuthenticated, getAllAvailableSlots)
router.get('/get-slots-datewise',ensureAuthenticated, getSlotsDateWise)

router.post(
  "/request-appointment",
  ensureAuthenticated,
  requestAppointmentValidation,
  requestAppointment
);
router.get(
  "/get-all-awaiting-appointments",
  ensureAuthenticated,
  getAllAwaitingAppointments
);

router.post(
  "/reject-appointment-request",
  ensureAuthenticated,
  rejectAppointmentRequestValidation,
  rejectAppointmentRequest
);

router.get(
  "/get-all-active-appointments",
  ensureAuthenticated,
  getAllActiveAppointments
);

router.post(
  "/accept-appointment",
  ensureAuthenticated,
  acceptAppointmentRequestValidation,
  acceptAppointmentRequest
);

router.post(
  "/finish-appointment",
  ensureAuthenticated,
  finishAppointmentValidation,
  finishAppointment
);

router.post(
  "/cancel-appointment",
  ensureAuthenticated,
  cancelAppointmentValidation,
  cancelAppointment
);

router.post(
  "/write-prescription",
  ensureAuthenticated,
  writePrescriptionValidation,
  writePrescription
);

router.get(
  "/get-upcoming-appointment",
  ensureAuthenticated,
  getUPComingAppointment
);

router.get("/get-all-appointments", ensureAuthenticated, getAllAppointments);
module.exports = router;
