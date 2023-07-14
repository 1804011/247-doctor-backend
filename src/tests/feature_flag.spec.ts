import dotenv from "dotenv";
import chai from "chai";
import chaiHttp from "chai-http";
import server from "../app";
import FeatureFlag from "@models/feature_flag";
import mongoose from "mongoose";


dotenv.config();

chai.use(chaiHttp);
chai.should();

let mongo_db_url: any = process.env.Mongo_DB_URL;


const CREATE_FEATURE_FLAG_ENDPOINT = "/api/feature-flag/create";
const GET_ALL_FEATURE_FLAGS_ENDPOINT = "/api/feature-flag/all";

// Set up the MongoDB connection
if (mongo_db_url) {
  before(async () => {
    try {
      await mongoose.connect(encodeURI(mongo_db_url));
      console.log("Connected with MongoDB for testing");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
    }
  });
}

// Clean up the MongoDB connection
after(async function () {
  await mongoose.connection.close();
});

// Helper function to generate fake user data
function createFakeUser() {
  return {
    phone_number: "+16469618037",
    password: "Qwerty@123",
    full_name: "Maria",
    userType: "patient",
  };
}

// Helper function to generate a JWT token for authentication
// Helper function to generate fake feature flag data
function createFakeFeatureFlag() {
  return {
    name: "my_feature_flag",
    enabled: true,
    description: "This is a feature flag for testing.",
  };
}


describe("Feature Flag API", function () {
  let featureFlagId: string;
  it("should create a new feature flag, assert the response, and retrieve all feature flags", async function () {
    const newFeatureFlag = createFakeFeatureFlag();

    // Create the feature flag
    const res = await chai
      .request(server)
      .post(CREATE_FEATURE_FLAG_ENDPOINT)
      .send(newFeatureFlag);

    const response = res.body;
    // Assert the response
    response.should.have.property("name", newFeatureFlag.name);
    response.should.have.property("enabled", newFeatureFlag.enabled);
    response.should.have.property("description", newFeatureFlag.description);
    featureFlagId = response._id;
    // Retrieve all feature flags
    const getAllRes = await chai
      .request(server)
      .get(GET_ALL_FEATURE_FLAGS_ENDPOINT)

    const featureFlags = getAllRes.body;
    // Assert the response
    featureFlags.should.be.an("array");
    featureFlags.should.have.lengthOf.at.least(1);
    // Add more assertions as needed
    // Delete the feature flag
    await FeatureFlag.deleteOne({ _id: featureFlagId });
  });
});
