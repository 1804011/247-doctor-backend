// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { validationResult, check, body } from "express-validator";
import User from  "@models/user";
import Doctor from  "@models/doctor";
import Patient from  "@models/patient";
import bcrypt from "bcrypt";
import { createJWT } from "@middleware/auth";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const otpGenerator = require("otp-generator");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

//Get all users

const index=async (req: Request, res: Response) => {
  //@ts-ignore
  const page: number = parseInt(req.query.page) || 1;
  //@ts-ignore
  const limit: number = parseInt(req.query.limit) || 10;
  const skip: number = (page - 1) * limit;
  // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  // console.log(fullUrl)
  try {
    const users = await User.find({},{
     
       id: "$_id",
        name: "$full_name",
        email: "$phone_number",
        gender: 1,
       role:'$userType',
       profile_pic:'$profile_pic.url',
       is_active: 1,
      
    }).skip(skip).limit(limit).exec();
    const count = await User.countDocuments();
    res.json({
       data:users,
       total: count,
       per_page: limit,
       current_page: page,
       last_page: Math.ceil(count / limit),
       next_page_url: null,
       prev_page_url: null,
       from: limit*(page-1) + 1,
       to:  limit*page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


// Get User by id

const show = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let data = await User.findById(req.params.id,{
      id: "$_id",
      name: "$full_name",
      phone_number: "$phone_number",
      email: "$email",
      role:'$userType',
      password:1,
    });
    res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};



const store=async(
  req: Request,
  res: Response,
  next: NextFunction
)=>{
  try {
    const errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    else
    {
      let { phone_number, userType, name, password,email } = req.body;
      let check_user=await User.findOne({
        phone_number: phone_number,
      }).select("-password");

      if(check_user!==null)
      {
        return  res.status(400).send({
                  is_error: true,
                  message: "user with the phone number already exists",
        });
      }
      else{
        let encrypted_password = await bcrypt.hashSync(password, 10);
        let user = await new User({
          userType: userType,
          full_name: name,
          phone_number: phone_number,
          password: encrypted_password,
          is_profile_created: false,
          is_information_completed: false,
          email:email ,
        });
        
        if (userType === "doctor") {
          var doctor = await new Doctor({
            user_id: user._id,
            is_availability_details_completed: false,
            is_bank_details_completed: false,
            is_personal_profile_created: false,
            is_professional_profile_created: false,
          });
          const account = await stripe.accounts.create({
            type: "express",
            business_type: "individual",
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            business_profile: {
              mcc: "8011",
              url: "https://doctor-24-7-backend.herokuapp.com/",
            },
          });
          doctor.is_availability_details_completed = false;
          doctor.is_bank_details_completed = false;
          doctor.is_personal_profile_created = false;
          doctor.is_professional_profile_created = false;
          doctor.bank_details.account_number = account;
          doctor.bank_details.is_verified = false;
          await user.save();
          await doctor.save();
        } else if (userType === "patient") {
          var patient = await new Patient({
            user_id: user._id,
            is_profile_created: false,
            is_information_completed: false,
          });
          await user.save();
          await patient.save();
        }
        
      let otp = await otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await client.messages
        .create({
          body: `This is otp code ${otp} for doctor-24-7 app`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone_number,
        })
        .then(async (message: any) => {
          user.otp = otp;
          user.is_verified = false;
          await user.save();
          
          
          let jwt = await createJWT(user);
          return res.status(200).json({
             user,
            token: jwt,
          });
        })
        .catch(async (err: any) => {
          if (err.code === 21211) {
            return res
              .status(422)
              .json({ message: "invalid phone number or format" });
          } else {
            return res.status(500).json({ message: "somehting went wrong" });
          }
        });
      }

    }
    
  } catch (err:any) {
    return res.status(500).json({ message: err.message });
    
  }
}


const update= async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = await validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    } else {
      let { id } = req.params;
      let { name, email, phone_number,password} = req.body;
    
      //let file:any = req.file;

      const user=await User.findById(id);
      if(!user) {
        return res.status(404).json({ message: "User not found" });
      }
      else{
        user.full_name = name ;
        if(email)
        {
          user.email = email ;

        }
        user.phone_number = phone_number ;
        if(password){
          user.password = await bcrypt.hashSync(password, 10);
        }
        // if(file){
        //   user.profile_pic={
        //     url:file.location,
        //     name:file.filename,
        //   }
        // }
        await user.save();
        return res.status(200).json({ message: "User updated successfully" });
      }

    }

  } catch (err: any) {
   return res.status(500).json({ message: err.message });
  }
};

// const update=async(
//   req: Request,
//   res: Response,
//   next: NextFunction
// )=>{
//   try {

//     //update phone,email,password,name,userType
    
//     const errors = validationResult(req);
//     if (errors.isEmpty() === false) {
//       return res
//         .status(422) //@ts-ignore
//         .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
//     }
//     else{

//       let user=await User.findById(req.params.id);
//       //update users phone,email,password,name,userType
//       if(user!==null)
//       {
//         let { phone, userType, name, password,email } = req.body;
//         user.userType=userType;
//         user.full_name=name;
//         user.phone_number=phone;
//         user.email=email;
//         if(password)
//         {
//           let encrypted_password = await bcrypt.hashSync(password, 10);
//           user.password=encrypted_password;
//         }


//         await user.save();
//         return res.status(200).json({ data: user });
//       }
//     }

    
//   } catch (err:any) {
//     return res.status(500).json({ message: err.message });
//   }
// }


// Remove a user

const destroy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let user = await User.findById(req.params.id);
    if (user === null) {
      return res.status(404).json({ message: "user not found" });
    }

    // Check if the user is patient or doctor. if it is patient then delete the patient record and if it is doctor then delete the doctor record along with the user record

    if (user.userType === "patient") {
      await Patient.findOneAndDelete({ user_id: user._id });
    } else if(user.userType === "doctor") {
      await Doctor.findOneAndDelete({ user_id: user._id });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "user deleted successfully" });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

const switchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
)=>{
  try{
    console.log(req.body.id)
    const user = await User.findById(req.body.id,{
  
       id: "$_id",
      name: "$full_name",
      email: "$phone_number",
      gender: 1,
      role:'$userType',
      profile_pic:'$profile_pic.url',
      is_active: 1,
    });
    if(user){
      user.is_active = !user.is_active;
      await user.save();
      res.status(200).json({ data: user });
    }else{
      res.status(404).json({ message: 'User not found' });
    }
  }catch(err: any){
    return res.status(500).json({ message: err.message });
  }
}


module.exports={
    index,
    show,
    destroy,
    switchStatus,
    store,
    update
}
