import mongoose, { Document, Model, Schema } from 'mongoose';

export interface UserType extends Document {
  email: string;
  is_verified?: boolean;
  otp?: string;
  userType: 'doctor' | 'patient' | 'admin';
  password: string;
  phone_number: string;
  full_name: string;
  gender?: 'male' | 'female';
  language?: string;
  city?: string;
  area?: string;
  address?: string;
  dob?: Date;
  division?: string;
  country?: string;
  timezone?: {
    code?: string;
    utc?: string;
  };
  is_profile_created?: boolean;
  is_information_completed?: boolean;
  forgot_password_otp?: string;
  verified_forgot_password_otp?: boolean;
  profile_pic?: {
    url?: string;
    name?: string;
  };
  is_active?: boolean;
  doctorID?: string;
  playerID?: string;
}

const userSchema: Schema<UserType> = new Schema({
  email: {
    type: String,
    lowercase: true,
  },
  /* eslint-disable */
  is_verified: {
    type: Boolean,
  },
  otp: {
    type: String,
  },
  userType: {
    enum: ['doctor', 'patient', 'admin'],
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone_number: {
    type: String,
    required: true,
  },

  full_name: {
    type: String,
    required: true,
  },

  gender: {
    type: String,
    enum: ['male', 'female'],
  },

  language: {
    type: String,
  },

  city: {
    type: String,
  },

  area: {
    type: String,
  },

  address: {
    type: String,
  },

  dob: {
    type: Date,
  },

  division: {
    type: String,
  },

  country: {
    type: String,
  },
  timezone: {
    code: {
      type: String,
    },
    utc: {
      type: String,
    },
  },

  is_profile_created: {
    type: Boolean,
  },

  is_information_completed: {
    type: Boolean,
  },

  forgot_password_otp: {
    type: String,
  },

  verified_forgot_password_otp: {
    type: Boolean,
  },

  profile_pic: {
    url: {
      type: String,
    },
    name: {
      type: String,
    },
    key: {
      type: String
    }
  },

  is_active: {
    type: Boolean,
    default: true,
  },
  doctorID: {
    type: String,
    unique: true,
    sparse: true,
  },

  playerID: {
    type: String,
  }

});

const User: Model<UserType> = mongoose.model('User', userSchema);

export default User;
