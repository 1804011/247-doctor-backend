import { ensureAuthenticated } from "@middleware/auth";
import { addMedicalSpecialityValidation } from "@validations/medical_speciality";
import { getTimeSlotsList, save_diseases } from "@controllers/index";
import {
  addMedicalSpeciality,
  getAllMedicalSpecialities,
} from "@controllers/medical_speciality";
import express, { Request, Response, NextFunction } from "express";
import {
  addMedicalCategory,
  getAllMedicalCategories,
} from "@controllers/medical_category";
import { addMedicalCategoryValidation } from "@validations/medical_category";
var router = express.Router();

/* GET users listing. */
router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("respond with a resource");
});

router.get("/get-time-slots", getTimeSlotsList);

router.post("/save-diseases", save_diseases);

router.post(
  "/add-medical-specialities",
  ensureAuthenticated,
  addMedicalSpecialityValidation,
  addMedicalSpeciality
);
router.get("/get-medical-specialities", getAllMedicalSpecialities);

router.post(
  "/add-medical-category",
  ensureAuthenticated,
  addMedicalCategoryValidation,
  addMedicalCategory
);
router.get("/get-medical-categories", getAllMedicalCategories);

router.get("/blood-groups");
module.exports = router;
