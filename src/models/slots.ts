import mongoose, { Types } from "mongoose";

const Schema = mongoose.Schema;

export interface SlotType extends Document {
  doctor_id: Types.ObjectId;
  date: string;
  from: string;
  to: string;
  is_booked: boolean;
  is_active: boolean;
}

const slotsSchema = new Schema({
    doctor_id: {
        type: mongoose.Types.ObjectId,
        ref: "Doctor",
    },

    date: {
        type: String,
    },

    from: {
        type: String,
    },

    to:{
        type: String,
    },

    is_booked: {
        type: Boolean,
    },
    
    is_active:{
        type:Boolean
    }

});

const Slot = mongoose.model("Slot", slotsSchema);

export default Slot;