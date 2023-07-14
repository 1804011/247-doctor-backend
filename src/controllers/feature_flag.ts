
import { NextFunction, Request, Response } from "express";
import FeatureFlag, {FeatureFlagType} from '@models/feature_flag'


// Endpoint to create a new feature flag
export const createFeatureFlag = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, enabled, description } = req.body;

    // Create the new feature flag
    const newFeatureFlag: FeatureFlagType = await FeatureFlag.create({
      name,
      enabled,
      description,
    });

    res.status(201).json(newFeatureFlag);
  } catch (error) {
    res.status(500).json({ message: "Error creating feature flag" });
  }
};

export const getAllFlags = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const featureFlags: FeatureFlagType[] = await FeatureFlag.find(
      {},
      { name: 1, enabled: 1 }
    ).lean(); // Add the .lean() method to return plain JavaScript objects instead of Mongoose documents
    res.json(featureFlags);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving feature flags" });
  }
}