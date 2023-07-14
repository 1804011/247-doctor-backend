import dotenv from "dotenv";
import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../app';
import User from '@models/user';
import mongoose from 'mongoose';

dotenv.config();

chai.use(chaiHttp);
chai.should();

let mongo_db_url: any = process.env.Mongo_DB_URL;

const REGISTER_USER_ENDPOINT = '/api/user/register-user';

// Set up the MongoDB connection
if (mongo_db_url) {
  before(async () => {
    try {
      await mongoose.connect(encodeURI(mongo_db_url));
      console.log("Connected with MongoDB for testing");
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
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
    phone_number: '+16469618037',
    password: 'Qwerty@123',
    full_name: 'Maria',
    userType: 'patient',
  };
}

describe('User API', function () {
  it('should create a new user, assert the response, and delete the user', async function () {
    const newUser = createFakeUser();

    // Create the user
    const res = await chai.request(server).post(REGISTER_USER_ENDPOINT).send(newUser);
    const response = res.body;
    // Assert the response
    response.should.have.property('user');
    response.should.have.property('token');
    response.user.should.have.property('userType', newUser.userType);
    response.user.should.have.property('password');
    response.user.should.have.property('phone_number', newUser.phone_number);
    response.user.should.have.property('full_name', newUser.full_name);
    response.user.should.have.property('timezone');
    response.user.should.have.property('is_profile_created', true);
    response.user.should.have.property('is_information_completed', false);
    response.user.should.have.property('profile_pic');
    response.user.should.have.property('is_active', true);
    response.user.should.have.property('_id');
    response.user.should.have.property('otp');
    response.user.should.have.property('is_verified', false);
    response.user.should.have.property('__v', 0);
    response.user.should.have.property('stripe_account', null);
    response.user.should.have.property('payment_details');
    response.user.should.have.property('doctor', null);
    response.user.should.have.property('patient');
    // Add more assertions as needed

    const userId = response.user._id;

    // Delete the user
    await User.deleteOne({ _id: userId });
  });
});
