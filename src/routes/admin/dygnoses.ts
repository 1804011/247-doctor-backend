import express from "express";
import { isAdmin } from "@middleware/auth";

const dygnoses = require("@controllers/Admin/cruds/dygnoses");


var router = express.Router();


router.get("/", isAdmin, dygnoses.index);
router.post("/", isAdmin, dygnoses.store);
router.get("/:id", isAdmin, dygnoses.show);
router.put("/:id", isAdmin, dygnoses.update);
router.delete("/:id", isAdmin, dygnoses.destroy);

module.exports = router;