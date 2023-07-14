import mongoose from "mongoose";

const Schema = mongoose.Schema;

const dygnosesSchema = new Schema({
  dygnoses: {
    type: String,
    required: true,
  },
});

const Dygnoses = mongoose.model("Dygnoses", dygnosesSchema);

export default Dygnoses;
