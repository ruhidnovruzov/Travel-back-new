// backend/routes/tourRoutes.js

const express = require('express');
const {
    getTours,
    getTourById,
    createTour,
    updateTour,
    deleteTour
} = require('../controllers/tourController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Bütün turları al (Public)
// Yeni tur yarat (Private/Admin)
router.route('/')
    .get(getTours)
    .post(protect, authorize('admin'), createTour);

// Turu ID-yə görə al (Public)
// Turu yenilə (Private/Admin)
// Turu sil (Private/Admin)
router.route('/:id')
    .get(getTourById)
    .put(protect, authorize('admin'), updateTour)
    .delete(protect, authorize('admin'), deleteTour);

module.exports = router;
