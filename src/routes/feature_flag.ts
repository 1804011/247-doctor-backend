import express from "express";
import {getAllFlags, createFeatureFlag } from "@controllers/feature_flag";



var router = express.Router();

// Endpoint to create a new feature flag
router.post("/create", createFeatureFlag);


// Endpoint to get all feature flags with name and enabled fields
router.get("/all", getAllFlags);

module.exports = router;
