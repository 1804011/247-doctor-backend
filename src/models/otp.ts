import mongoose from "mongoose";

const Schema = mongoose.Schema;

const otpSchema = new Schema({
  otp: {
    type: String,
    required: true,
  },
  user_id:{
      type: mongoose.Types.ObjectId, 
      required:true,
  
  },
  isVerified:{
      type:Boolean,
      required:true
  },
  isExpired:{
      type:Boolean,
      required:true
  }
});  

const OTP = mongoose.model("otp", otpSchema);

export default OTP;  
 