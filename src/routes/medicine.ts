import { ensureAuthenticated } from "@middleware/auth";
import express from "express";
import { createMedicine, getAllMedicines } from "@controllers/medicine";
import { createMedicineValidation } from "@validations/medicine";

var router = express.Router();

router.post(
  "/add-medicine",
  ensureAuthenticated,
  createMedicineValidation,
  createMedicine
);
router.get("/get-all-medicines", ensureAuthenticated, getAllMedicines);

module.exports = router;
