import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const diseasesSchema = new Schema({
  disease: {
    type: String,
    required: true,
  },
});

const Diseases = mongoose.model('Diseases', diseasesSchema);

export default Diseases;
