import express from "express";
import { isAdmin } from "@middleware/auth";

const medical_specialities = require("@controllers/Admin/cruds/medical_specialities");


var router = express.Router();


router.get("/", isAdmin, medical_specialities.index);
router.post("/", isAdmin, medical_specialities.store);
router.get("/:id", isAdmin, medical_specialities.show);
router.put("/:id", isAdmin, medical_specialities.update);
router.delete("/:id", isAdmin, medical_specialities.destroy);

module.exports = router;