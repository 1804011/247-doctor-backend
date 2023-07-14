import express from 'express';
import { initiatePayment } from '@controllers/payment';
import { ensureAuthenticated } from "@middleware/auth";

var router = express.Router();

router.post('/', ensureAuthenticated, initiatePayment);

module.exports = router;
