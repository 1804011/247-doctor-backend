import mongoose from "mongoose";

const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  relative_patient: {
    _id: {
      type: mongoose.Types.ObjectId,
    },
  },
  doctor:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },
  // doctor: {
  //   _id: {
  //     type: mongoose.Types.ObjectId,
  //   },
  //   user_id: {
  //     type: mongoose.Types.ObjectId,
  //   },
  // },
  is_prescription_written: {
    type: Boolean,
  },
  status: {
    type: String,
    enum: [
      "awaiting",
      "rejected",
      "active",
      "cancelled",
      "accepted",
      "finished",
      "started",
    ],
  },
  prescription: {
    complains: {
      type: [String],
    },
    dygnoses: {
      type: [String],
    },
    investigation: {
      type: String,
    },
    advice: {
      type: String,
    },
    need_follow_up_consultation: {
      type: Boolean,
    },
    medicines: [
      {
        _id: {
          type: mongoose.Types.ObjectId,
        },
        user_id: {
          type: mongoose.Types.ObjectId,
        },
        generic_name: {
          type: String,
        },
        brand_name: {
          type: String,
        },
        medicineType: {
          type: String,
          enum: [
            "liquid",
            "tablet",
            "capsule",
            "drops",
            "inhaler",
            "injection",
            "patches",
            "implants",
            "suppositories",
            "topical",
          ],
        },
        dose_frequency: {
          type: String,
        },
        dose_duration: {
          type: String,
        },
        duration_unit: {
          type: String,
          enum: [
            "once",
            "day",
            "weeks",
            "months",
            "years",
            "continue",
            "not required",
          ],
        },
        instructions: {
          type: String,
        },
      },
    ],
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Slot",
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
