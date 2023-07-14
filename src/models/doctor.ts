import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface MedicalCertificate {
  url: string;
  key: string;
  name: string;
  certificate_number: string;
}

interface GovId {
  gov_id_number: string;
  gov_id_front: {
    url: string;
    key: string;
    name: string;
  };
  gov_id_back: {
    url: string;
    key: string;
    name: string;
  };
}

interface BankDetails {
  type: 'stripe' | 'bkash' | 'rocket' | 'nagad' | 'bank';
  name: string;
  address: string;
  branch: string;
  swift_code: string;
  account_holder_name: string;
  account_number: string | any;
  mobile_account: string;
  is_verified: boolean;
}

export interface DoctorType extends Document {
  user_id: Types.ObjectId;
  title: 'dr' | 'consultant' | 'professor';
  about?: string;
  is_personal_profile_created?: boolean;
  is_professional_profile_created?: boolean;
  likes?: mongoose.Types.ObjectId[];
  degree?: string;
  institute?: string;
  chamberORhospitalAddress?: string;
  medical_certificate?: MedicalCertificate;
  gov_id?: GovId;
  medical_field?: string;
  medical_category?: mongoose.Types.ObjectId;
  medical_speciality?: mongoose.Types.ObjectId;
  experience?: number;
  is_24_7?: boolean;
  consultation_fee?: number;
  follow_up_fee?: number;
  is_availability_details_completed?: boolean;
  is_bank_details_completed?: boolean;
  bank_details?: BankDetails;
}

const doctorSchema: Schema<DoctorType> = new Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type: String,
        enum:["dr","consultant","professor"]
    },
    about:{
        type:String
    },
    is_personal_profile_created:{
        type:Boolean
    },
    is_professional_profile_created:{
        type:Boolean
    },
    likes:{
        type:[Schema.Types.ObjectId]
    },
    degree:{
        type:String
    },
    institute:{
        type:String
    },
    chamberORhospitalAddress:{
        type:String
    },
    medical_certificate:{
        url:{
            type:String
        },

        key:{
            type:String
        },
        name:{
            type:String
        },
        certificate_number:{
            type:String
        }
    },
    gov_id: {
        gov_id_number: {
          type: String,
        },
        gov_id_front: {
          url: {
            type: String,
          },
  
          key: {
            type: String,
          },
          name: {
            type: String,
          },
        },
        gov_id_back: {
          url: {
            type: String,
          },
          key: {
            type: String,
          },
          name: {
            type: String,
          },
        },
      },
    medical_field: {
        type: String,
      },
    medical_category: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "MedicalCategory",
      },
    medical_speciality: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "MedicalSpeciality",
      },
    experience: {
        type: Number,
      },
    is_24_7: {
        type: Boolean,
      },
    consultation_fee: {
        type: Number,
      },
    follow_up_fee: {
        type: Number,
      },
  
    is_availability_details_completed: {
        type: Boolean,
      },
  
    is_bank_details_completed: {
        type: Boolean,
      },

    bank_details: {
     type:{
            type:String,
            enum:['stripe','bkash','rocket','nagad','bank'],
       },
      name: {
        type: String,
      },
      address: {
        type: String,
      },
      branch: {
        type: String,
      },
      swift_code: {
        type: String,
      },
      account_holder_name: {
        type: String,
      },
      account_number: {
        // type: String,
        type: mongoose.Schema.Types.Mixed,
      },
      mobile_account: {
        type: String,
      },
      is_verified: {
        type: Boolean,
      },
    },
})



const Doctor: Model<DoctorType>=mongoose.model("Doctor", doctorSchema);

export default Doctor