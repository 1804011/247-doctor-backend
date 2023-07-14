import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
const morgan = require('morgan');
import mongoose from "mongoose";
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from '../swagger.json';

import { expressjwt } from "express-jwt";
import "module-alias/register";

// For test coverage reports
import hbs from "hbs";
import fs from "fs";
import path from "path";


dotenv.config();
const app: Express = express();
const server = require("http").createServer(app); //create the server

const port = process.env.PORT;

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

let mongo_db_url: any = process.env.Mongo_DB_URL;

mongoose
  .connect(encodeURI(mongo_db_url))
  .then((res) => {
    console.log("connected with  monodb");
  })
  .catch((err: any) => {
    console.log("error====", err);
  });

app.use(
  "/protected",
  expressjwt({ algorithms: ["HS256"], secret: process.env.TOKEN_SECRET || "" }),
  function (req: Request, res, next) {
    //@ts-ignore
    if (!req.auth.sub) return res.sendStatus(401);
    next();
  },
  express.static("assets/protected")
);
app.use("/public", express.static("assets/public"));

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});


// Configure the view engine

app.engine(".hbs", hbs.__express);
app.set("view engine", ".hbs");


app.get("/test-coverage", (req: Request, res: Response) => {
  const coverageReportPath = path.join(__dirname, "..", "coverage", "lcov-report", "index.html");
  fs.readFile(coverageReportPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading coverage report:", err);
      return res.status(500).send("Error reading coverage report");
    }
    res.render("coverage", { report: data });
  });
});


var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var doctorRouter = require("./routes/doctor");
var patientRouter = require("./routes/patient");
var appointmentRouter = require("./routes/appointment");
var medicineRouter = require("./routes/medicine");
var complainRouter = require("./routes/complain");
var dygnosesRouter = require("./routes/dygnoses");
var otpRouter = require("./routes/otp");
var adminRoutes = require("./routes/admin");
var slotRoutes = require("./routes/slot");
var paymentRoutes = require("./routes/payment");
var featureFlagRoutes = require("./routes/feature_flag")
app.get("/api/protected/*");
app.use("/api/user", usersRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/patient", patientRouter);
app.use("/api/appointment", appointmentRouter);
app.use("/api/medicine", medicineRouter);
app.use("/api/dygnoses", dygnosesRouter);
app.use("/api/utils", indexRouter);
app.use("/api/complain", complainRouter);
app.use("/api/otp", otpRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/slot", slotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feature-flag", featureFlagRoutes);
app.get('/api/settings', (req, res) => {
  const config = {
    id: 1,
    options: {
      siteTitle: "247 Doctor",
      siteSubtitle: "Your personal doctor",
      minimumOrderAmount: 0,
      currencyToWalletRatio: 3,
      signupPoints: 100,
      maximumQuestionLimit: 5,
      seo: {
        metaTitle: "Your personal doctor",
        metaDescription: null,
        metaTags: null,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        twitterHandle: null,
        twitterCardType: null,
        ogImage: null
      },
      deliveryTime: [
        {
          title: "On Time",
          description: "You'll get it instant"
        }
      ],
      contactDetails: {
        contact: "+129290122122",
        website: "https://redq.io",
        socials: [
          {
            icon: "FacebookIcon",
            url: "https://www.facebook.com/"
          },
          {
            icon: "TwitterIcon",
            url: "https://twitter.com/home"
          },
          {
            icon: "InstagramIcon",
            url: "https://www.instagram.com/"
          }
        ],
        location: {
          lat: 42.9585979,
          lng: -76.90872019999999,
          zip: null,
          city: null,
          state: "NY",
          country: "United States",
          formattedAddress: "NY State Thruway, New York, USA"
        }
      },
      logo: {
        id: 935,
        original: "https://profile-pic-doctor-mobile-24-7.s3.amazonaws.com/logo/1k3tselcklj1c78fm-247+(2).png",
        thumbnail: "https://profile-pic-doctor-mobile-24-7.s3.amazonaws.com/logo/1k3tselcklj1c78fm-247+(2).png"
      },
      currency: "USD",
      useOtp: false,
      taxClass: 1,
      dark_logo: {
        id: 936,
        original: "https://profile-pic-doctor-mobile-24-7.s3.amazonaws.com/logo/1k3tselcklj1c78fm-247+(2).png",
        thumbnail: "https://profile-pic-doctor-mobile-24-7.s3.amazonaws.com/logo/1k3tselcklj1c78fm-247+(2).png"
      },
      shippingClass: 1,
      useCashOnDelivery: true,
      paymentGateway: "stripe"
    },
    language: "en",
    created_at: "2021-03-24T15:30:18.000Z",
    updated_at: "2022-12-14T18:13:56.000Z"
  };

  res.json(config);
});



// SWAGGER UI ROUTE
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app;