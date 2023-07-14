import mongoose, { Document, Schema, Types } from "mongoose";

export interface PatientType extends Document {
  user_id: Types.ObjectId;
  weight?: number;
  height?: {
    ft?: number;
    inches?: number;
  };
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  is_under_doctor_care?: boolean;
  diseases_or_conditions?: Array<Schema.Types.ObjectId>;
  payment_details?: {
    setupIntent?: mongoose.Schema.Types.Mixed;
    ephemeralKey?: mongoose.Schema.Types.Mixed;
    customer?: mongoose.Schema.Types.Mixed;
    label?: string;
    image?: string;
    is_payment_sheet_completed?: boolean;
  };
  relative_patients?: Array<{
    full_name?: string;
    gender?: "male" | "female";
    weight?: number;
    height?: {
      ft?: number;
      inches?: number;
    };
    dob?: Date;
    bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
    is_under_doctor_care?: boolean;
    diseases_or_conditions?: Array<Schema.Types.ObjectId>;
  }>;
}

const patientSchema = new Schema<PatientType>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  weight: {
    type: Number,
  },
  height: {
    ft: {
      type: Number,
    },
    inches: {
      type: Number,
    },
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  is_under_doctor_care: {
    type: Boolean,
  },
  diseases_or_conditions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Diseases",
    },
  ],
  payment_details: {
    setupIntent: {
      type: mongoose.Schema.Types.Mixed,
    },
    ephemeralKey: {
      type: mongoose.Schema.Types.Mixed,
    },
    customer: {
      type: mongoose.Schema.Types.Mixed,
    },
    label: {
      type: String,
    },
    image: {
      type: String,
    },
    is_payment_sheet_completed: {
      type: Boolean,
    },
  },
  relative_patients: [
    {
      full_name: {
        type: String,
      },
      gender: {
        type: String,
        enum: ["male", "female"],
      },
      weight: {
        type: Number,
      },
      height: {
        ft: {
          type: Number,
        },
        inches: {
          type: Number,
        },
      },
      dob: {
        type: Date,
      },
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      is_under_doctor_care: {
        type: Boolean,
      },
      diseases_or_conditions: [
        {
          type: Schema.Types.ObjectId,
          ref: "Diseases",
        },
      ],
    },
  ],
});

const Patient = mongoose.model<PatientType>("Patient", patientSchema);

export default Patient;
