import { ensureAuthenticated } from "@middleware/auth";
import { updateAvailabilitySlotsValidation } from "@validations/doctor";
import {index, createSlots,show,update,destroy,switchStatus,doctorSlots} from "@controllers/slot";
import express from "express";
var router = express.Router();

router.get("/", ensureAuthenticated, index);
router.get("/doctor-slots", ensureAuthenticated, doctorSlots)
router.post("/", ensureAuthenticated, updateAvailabilitySlotsValidation, createSlots);
router.get("/:id", ensureAuthenticated, show)
router.put("/:id", ensureAuthenticated,updateAvailabilitySlotsValidation, update);
router.delete("/:id", ensureAuthenticated, destroy);
router.put("/active-deactive",ensureAuthenticated,switchStatus)


module.exports = router;