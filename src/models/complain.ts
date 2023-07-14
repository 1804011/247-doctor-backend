import mongoose from "mongoose";

const Schema = mongoose.Schema;

const complainSchema = new Schema({
  complain: {
    type: String,
    required: false,
  },
});

const Complain = mongoose.model("complain", complainSchema);

export default Complain;  
