import mongoose from "mongoose";

const Schema = mongoose.Schema;

const medicalSpecialitiesSchema = new Schema({
  speciality: {
    type: String,
    required: true,
  },
});

const MedicalSpeciality = mongoose.model(
  "MedicalSpeciality",
  medicalSpecialitiesSchema
);

export default MedicalSpeciality;
