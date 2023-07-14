import express from "express";
import { isAdmin } from "@middleware/auth";

const diseases = require("@controllers/Admin/cruds/diseases");


var router = express.Router();


router.get("/", isAdmin, diseases.index);
router.post("/", isAdmin, diseases.store);
router.get("/:id", isAdmin, diseases.show);
router.put("/:id", isAdmin, diseases.update);
router.delete("/:id", isAdmin, diseases.destroy);

module.exports = router;