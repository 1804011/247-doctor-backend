import express from "express";
import { isAdmin } from "@middleware/auth";

const medicines = require("@controllers/Admin/cruds/medicines");


var router = express.Router();


router.get("/", isAdmin, medicines.index);
router.post("/", isAdmin, medicines.store);
router.get("/:id", isAdmin, medicines.show);
router.put("/:id", isAdmin, medicines.update);
router.delete("/:id", isAdmin, medicines.destroy);

module.exports = router;