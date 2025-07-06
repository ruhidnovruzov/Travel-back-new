// backend/routes/carRoutes.js

const express = require('express');
const {
    getCars,
    getCarById,
    createCar,
    updateCar,
    deleteCar,
    updateCarAvailability
} = require('../controllers/carController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Bütün avtomobilləri al (Public)
// Yeni avtomobil yarat (Private/Admin)
router.route('/')
    .get(getCars)
    .post(protect, authorize('admin'), createCar);

// Avtomobili ID-yə görə al (Public)
// Avtomobili yenilə (Private/Admin)
// Avtomobili sil (Private/Admin)
router.route('/:id')
    .get(getCarById)
    .put(protect, authorize('admin'), updateCar)
    .delete(protect, authorize('admin'), deleteCar);

// Avtomobilin mövcudluğunu yenilə (Private - Rezervasiya sistemi üçün)
router.route('/availability/:id') // /api/cars/availability/:id
    .put(protect, updateCarAvailability); // Admin icazəsi tələb olunmur, çünki bu, rezervasiya zamanı istifadəçi tərəfindən də işə düşə bilər

module.exports = router;
