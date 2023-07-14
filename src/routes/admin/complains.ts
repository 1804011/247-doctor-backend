import express from "express";
import { isAdmin } from "@middleware/auth";

const complains = require("@controllers/Admin/cruds/complains");


var router = express.Router();


router.get("/", isAdmin, complains.index);
router.post("/", isAdmin, complains.store);
router.get("/:id", isAdmin, complains.show);
router.put("/:id", isAdmin, complains.update);
router.delete("/:id", isAdmin, complains.destroy);

module.exports = router;