const { faker } = require('@faker-js/faker');

function createFakeUser() {
  const user = {
    email: faker.internet.email(),
    is_verified: faker.random.boolean(),
    otp: faker.random.uuid(),
    userType: faker.random.arrayElement(['doctor', 'patient', 'admin']),
    password: faker.internet.password(),
    phone_number: faker.phone.phoneNumber(),
    full_name: faker.name.findName(),
    gender: faker.random.arrayElement(['male', 'female']),
    language: faker.lorem.word(),
    city: faker.address.city(),
    area: faker.address.streetName(),
    address: faker.address.streetAddress(),
    dob: faker.date.past(),
    division: faker.address.state(),
    country: faker.address.country(),
    timezone: {
      code: faker.address.zipCode(),
      utc: faker.address.timeZone(),
    },
    is_profile_created: faker.random.boolean(),
    is_information_completed: faker.random.boolean(),
    forgot_password_otp: faker.random.uuid(),
    verified_forgot_password_otp: faker.random.boolean(),
    profile_pic: {
      url: faker.image.imageUrl(),
      name: faker.image.imageName(),
    },
    is_active: faker.random.boolean(),
  };

  return user;
}

export default createFakeUser;