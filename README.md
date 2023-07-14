# 247-core-backend

## Node Version used

`v18.0.0`

## Install the dependencies

Type the following command in the terminal.

`npm install`

### Add following env vars in .env file.

```
TOKEN_SECRET=<JWT Token Secret>
Mongo_DB_URL=<MongoDB Connection String>
AWS_S3_BUCKET=<AWS S3 Bucket Name>
AWS_ACCESS_KEY_ID=<AWS Access Key ID>
AWS_SECRET_KEY=<AWS Secret Key>
TWILIO_PHONE_NUMBER=<Twilio Phone Number>
TWILIO_ACCOUNT_SID=<Twilio Account SID>
TWILIO_AUTH_TOKEN=<Twilio Auth Token>
```

### To build the project

type the following command to build ts files into js files
`nom run build`

### To start dev server

`npm run dev`

### To run all tests

`npm run test`

### To see test coverage report

`Go to /test-coverage endpoint`

# Swagger API Documentation

You can access the Swagger UI documentation by navigating to
`/swagger` on your browser and interact with currently implemented api endpoints.
