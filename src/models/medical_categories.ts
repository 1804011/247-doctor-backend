import mongoose from "mongoose";

const Schema = mongoose.Schema;

const medicalCategoriesSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
});

const MedicalCategory = mongoose.model(
  "MedicalCategory",
  medicalCategoriesSchema
);

export default MedicalCategory;
