import express from "express";
import { isAdmin } from "@middleware/auth";

const appointment = require("@controllers/Admin/cruds/appointment");


var router = express.Router();


router.get("/", isAdmin, appointment.index);
router.post("/", isAdmin, appointment.store);
router.get("/:id", isAdmin, appointment.show);
router.put("/:id", isAdmin, appointment.update);
router.delete("/:id", isAdmin, appointment.destroy);

module.exports = router;