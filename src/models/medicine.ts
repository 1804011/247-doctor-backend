import mongoose from "mongoose";

const Schema = mongoose.Schema;

const medicineSchema = new Schema({
  user_id: {
    type: mongoose.Types.ObjectId,
  },
  generic_name: {
    type: String,
    required: true,
  },
  brand_name: {
    type: String,
    required: true,
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
});

const Medicine = mongoose.model("medicine", medicineSchema);

export default Medicine;
