import express from "express";
import { isAdmin } from "@middleware/auth";

const medical_categories = require("@controllers/Admin/cruds/medical_categories");


var router = express.Router();


router.get("/", isAdmin, medical_categories.index);
router.post("/", isAdmin, medical_categories.store);
router.get("/:id", isAdmin, medical_categories.show);
router.put("/:id", isAdmin, medical_categories.update);
router.delete("/:id", isAdmin, medical_categories.destroy);

module.exports = router;