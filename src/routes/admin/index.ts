import { Router } from 'express';

const usersRoutes = require('./users')
const medicalCategoriesRoutes = require('./medical_categories');
const medicalSpecialitiesRoutes = require('./medical_specialities');
const dygnosesRoutes = require('./dygnoses');
const complainsRoutes = require('./complains');
const diseasesRoutes = require('./diseases');
const medicinesRoutes = require('./medicines');
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointment');
const slotRoutes = require('./slot');
const router = Router();

router.use('/users', usersRoutes, medicalCategoriesRoutes);
router.use('/categories', medicalCategoriesRoutes);
router.use('/specialities', medicalSpecialitiesRoutes);
router.use('/dygnoses', dygnosesRoutes);
router.use('/complains', complainsRoutes);
router.use('/diseases', diseasesRoutes);
router.use('/medicines', medicinesRoutes);
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/slots', slotRoutes);



module.exports = router;