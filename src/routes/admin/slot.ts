import express from "express";
import { isAdmin } from "@middleware/auth";

const slot = require("@controllers/Admin/cruds/slot");


var router = express.Router();


router.get("/doctor-slots", isAdmin, slot.doctorSlots);


module.exports = router;