import mongoose, { Document, Model, Schema } from 'mongoose';

export interface FeatureFlagType extends Document {
  name: string;
  enabled: boolean;
  description?: string;
}

const featureFlagSchema: Schema<FeatureFlagType> = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    required: true,
    default: false,
  },
  description: {
    type: String,
  },
});

const FeatureFlag: Model<FeatureFlagType> = mongoose.model('FeatureFlag', featureFlagSchema);

export default FeatureFlag;
