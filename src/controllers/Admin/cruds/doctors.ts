// @ts-nocheck
import Doctor  from "@models/doctor";
import { NextFunction, Request, Response } from "express";
import { validationResult, check, body } from "express-validator";
import MedicalCategory from "@models/medical_categories";
import MedicalSpeciality from "@models/medical_specialities";
import User from "@models/user";
import bcrypt from "bcrypt";
import { createJWT } from "@middleware/auth";
import MedicalSpeciality from "@models/medical_specialities";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const otpGenerator = require("otp-generator");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
//Get all doctors
var aws = require("aws-sdk");

var s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: "us-west-1",
});

const index=async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try {
             //@ts-ignore
  const page: number = parseInt(req.query.page) || 1;
  //@ts-ignore
  const limit: number = parseInt(req.query.limit) || 10;
  const skip: number = (page - 1) * limit;
  let doctors = await Doctor.find().populate("user_id","-password -otp")
  .populate("medical_category").populate("medical_speciality").skip(skip).limit(limit).exec();
  const count = await Doctor.countDocuments();

  doctors = doctors.map((doctor)=>{
    return {
      id:doctor._id,
      user:doctor.user_id,
      title:doctor.title,
      about:doctor.about,
      degree:doctor.degree,
      institute:doctor.institute,
      chamberORhospitalAddress:doctor.chamberORhospitalAddress,
      medical_field:doctor.medical_field,
      medical_speciality:{
        id:doctor.medical_speciality?._id,
        speciality:doctor.medical_speciality?.speciality,
      },
      medical_category:{
        id:doctor.medical_category?._id,
        category:doctor.medical_category?.category,
      },
      experience:doctor.experience,
      consultation_fee:doctor.consultation_fee,
      follow_up_fee:doctor.follow_up_fee,

    }
  });
 
  return res.status(200).json({
      data:doctors,
      total: count,
      per_page: limit,
      current_page: page,
      last_page: Math.ceil(count / limit),
      next_page_url: null,
      prev_page_url: null,
      from: limit*(page-1) + 1,
      to:  limit*page,
    });

        
    } catch (err:any) {
        res.status(500).json({message:err.message})
    }
}

//store a doctor

const store = async (req: any, res: Response, next: NextFunction) => {
  try {
    let errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    
  
    
    let {
      title,
      about,
      degree,
      institute,
      chamberORhospitalAddress,
      medical_field,
      medical_speciality,
      medical_category,
      experience,
      consultation_fee,
      follow_up_fee,
      user,
    } = req.body;
    
    let file: any = req.file;
    console.log("file=", file);
    if (file === undefined) {
      return res.status(422).json({ message: "profile pic requied" });
    }
   
   

    let doctor= await User.findOne({phone_number:user.phone_number});
    if(doctor){
      return res.status(422).json({message:"Phone number already exists"});
    }
    let encrypted_password = await bcrypt.hashSync(user.password, 10);
    let users = await new User({
      userType:"doctor",
      full_name: user.full_name,
      phone_number: user.phone_number,
      password: encrypted_password,
      gender: user.gender,
      dob: user.dob,
      city: user.city,
      division: user.division,
      country: user.country,
      profile_pic:{
        url:file.location,
        name:file.filename
      },
      is_profile_created: false,
      is_information_completed: false,
      email:user.email,
    });
    var newDoctor = await new Doctor({
      title: title,
      about: about,
      degree: degree,
      institute: institute,
      chamberORhospitalAddress: chamberORhospitalAddress,
      medical_field: medical_field,
      experience: experience,
      consultation_fee: consultation_fee,
      follow_up_fee: follow_up_fee,
      user_id: users._id,
      medical_category:await MedicalSpeciality.findById(medical_speciality_id),
      medical_speciality:await MedicalCategory.findById(medical_category_id),
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
    newDoctor.is_availability_details_completed = false;
    newDoctor.is_bank_details_completed = false;
    newDoctor.is_personal_profile_created = false;
    newDoctor.is_professional_profile_created = false;
    newDoctor.bank_details.account_number = account;
    newDoctor.bank_details.is_verified = false;
    
   
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
        to: users.phone_number,
      })
      .then(async (message: any) => {
        users.otp = otp;
        users.is_verified = false;
        await users.save();
        await newDoctor.save();
        
        let jwt = await createJWT(users);
        return res.status(200).json({
         users,
         newDoctor,
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

  } catch (err: any) {
   return res.status(500).json({ message: err.message });
  }

}

// show doctor by id

const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    var doctor = await Doctor.findById(req.params.id).populate("user_id").populate("medical_speciality").populate("medical_category");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    doctor={
      id:doctor._id,
      user:doctor.user_id,
      title:doctor.title,
      about:doctor.about,
      degree:doctor.degree,
      institute:doctor.institute,
      chamberORhospitalAddress:doctor.chamberORhospitalAddress,
      medical_field:doctor.medical_field,
      medical_speciality:{
        id:doctor.medical_speciality?._id,
        speciality:doctor.medical_speciality?.speciality,
      },
      medical_category:{
        id:doctor.medical_category?._id,
        category:doctor.medical_category?.category,
      },
      medical_certificate:{
        url:doctor.medical_certificate?.url,
        certificate_number:doctor.medical_certificate?.certificate_number,
      },
      gov_id:{
        gov_id_number:doctor.gov_id?.gov_id_number,
        gov_id_front:doctor.gov_id?.gov_id_front.url,
        gov_id_back:doctor.gov_id?.gov_id_back.url,
        
      },

      experience:doctor.experience,
      consultation_fee:doctor.consultation_fee,
      follow_up_fee:doctor.follow_up_fee,
    }
    return res.status(200).json( doctor );
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// update doctor by id

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    let errors = validationResult(req);
    if (errors.isEmpty() === false) {
      return res
        .status(422) //@ts-ignore
        .json({ message: errors.errors[0].param + " " + errors.errors[0].msg });
    }
    // if (
    //   req.files.gov_id_front === undefined ||
    //   req.files.gov_id_back === undefined ||
    //   req.files.certificate_file === undefined
    // ) {
    //   if (req.files.gov_id_front) {
    //     s3.deleteObject(
    //       {
    //         Bucket: process.env.AWS_S3_BUCKET,
    //         Key: req.files.gov_id_front[0].key,
    //       },
    //       (err: any, data: any) => {
    //         console.error(err);
    //         console.log(data);
    //       }
    //     );
    //   }
    //   if (req.files.gov_id_back) {
    //     s3.deleteObject(
    //       {
    //         Bucket: process.env.AWS_S3_BUCKET,
    //         Key: req.files.gov_id_back[0].key,
    //       },
    //       (err: any, data: any) => {
    //         console.error(err);
    //         console.log(data);
    //       }
    //     );
    //   }
    //   if (req.files.certificate_file) {
    //     s3.deleteObject(
    //       {
    //         Bucket: process.env.AWS_S3_BUCKET,
    //         Key: req.files.certificate_file[0].key,
    //       },
    //       (err: any, data: any) => {
    //         console.error(err);
    //         console.log(data);
    //       }
    //     );
    //   }
    //   return res.status(422).json({
    //     image_error: `Gov id front, Gov id back and certificate images are required!`,
    //   });
    // }

    // if (req.image_error) {
    //   return res.json({ image_error: req.image_error });
    // }
    const doctor = await Doctor.findById(req.params.id).populate("user_id");
    const updated_user = await User.findById(doctor.user_id._id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    let {
      title,
      about,
      degree,
      institute,
      chamberORhospitalAddress,
      medical_field,
      medical_speciality_id,
      medical_category_id,
      user,
      experience,
      consultation_fee,
      follow_up_fee,
      // certificate_number,
      // gov_id_number
    } = req.body;

  //  let files: any = req.files;

   // let { gov_id_front, gov_id_back, certificate_file } = files;

    doctor.title=title;
    doctor.about=about;
    doctor.degree=degree;
    doctor.institute=institute;
    doctor.chamberORhospitalAddress=chamberORhospitalAddress
    doctor.medical_field=medical_field;
    doctor.medical_speciality=await MedicalSpeciality.findById(medical_speciality_id);
    doctor.medical_category=await MedicalCategory.findById(medical_category_id);
    doctor.experience=experience;
    doctor.consultation_fee=consultation_fee;
    doctor.follow_up_fee=follow_up_fee;
    // if (doctor.medical_certificate.url) {
    //   console.log(
    //     "certificate assets" + doctor.medical_certificate.url
    //   );

    //   await s3.deleteObject(
    //     {
    //       Bucket: process.env.AWS_S3_BUCKET,
    //       Key: doctor.medical_certificate.key,
    //     },
    //     (err: any, data: any) => {
    //       console.error(err);
    //       console.log(data);
    //     }
    //   );
    // }
    // doctor.medical_certificate = {
    //   key: certificate_file[0].key,
    //   url: certificate_file[0].location,
    //   name: certificate_file[0].originalname,
    //   certificate_number: certificate_number,
    // };
    // if (doctor.gov_id.gov_id_back.url) {
    //   console.log("back assets" + doctor.gov_id.gov_id_back.url);

    //   await s3.deleteObject(
    //     {
    //       Bucket: process.env.AWS_S3_BUCKET,
    //       Key: doctor.gov_id.gov_id_back.key,
    //     },
    //     (err: any, data: any) => {
    //       console.error(err);
    //       console.log(data);
    //     }
    //   );
    // }

    // if (doctor.gov_id.gov_id_front.url) {
    //   console.log("front assets" + doctor.gov_id.gov_id_front.url);
    //   await s3.deleteObject(
    //     {
    //       Bucket: process.env.AWS_S3_BUCKET,
    //       Key: doctor.gov_id.gov_id_front.key,
    //     },
    //     (err: any, data: any) => {
    //       console.error(err);
    //       console.log(data);
    //     }
    //   );
    // }

    // doctor.gov_id = {
    //   gov_id_number: gov_id_number,
    //   gov_id_back: {
    //     key: gov_id_back[0].key,
    //     url: gov_id_back[0].location,
    //     name: gov_id_back[0].originalname,
    //   },
    //   gov_id_front: {
    //     key: gov_id_front[0].key,
    //     url: gov_id_front[0].location,
    //     name: gov_id_front[0].originalname,
    //   },
    // };
    updated_user.full_name = user.full_name; ;
    updated_user.email = user.email ;
    updated_user.phone_number = user.phone_number;
    updated_user.gender =user.gender;
    updated_user.language = user.language;
    updated_user.city = user.city;
    updated_user.area = user.area;
    updated_user.address = user.address;
    updated_user.division = user.division;
    updated_user.country = user.country;
    if(user.password)
    {
      updated_user.password = await bcrypt.hashSync(user.password, 10);
    }
    updated_user.dob = user.dob;
   
    await updated_user.save();

    await doctor.save();

    return res.status(200).json({ message: "Doctor updated" })

  }
  catch(err:any){
    return res.status(500).json({ message:err.message});
  }

}
  




// delete doctor by id

const destroy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("user_id");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    await doctor.user_id.remove();
    await doctor.remove();
    return res.status(200).json({ message: "Doctor deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// block/unblock a doctor

const switchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.body.id).populate("user_id");
    if (!doctor) {
      return res.status(404).json({ message: "doctor not found" });
    }
    console.log("doctor status",doctor);
    doctor.user_id.is_active = !doctor.user_id.is_active;
    await doctor.user_id.save();
    return res.status(200).json({ message: "doctor blocked" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
    index,
    destroy,
    switchStatus,
    store,
    show,
    update
}