// backend/routes/hotelRoutes.js

const express = require('express');
const {
    getHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel
} = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Bütün hotelləri al (Public)
// Yeni hotel yarat (Private/Admin)
router.route('/')
    .get(getHotels)
    .post(protect, authorize('admin'), createHotel);

// Hoteli ID-yə görə al (Public)
// Hoteli yenilə (Private/Admin)
// Hoteli sil (Private/Admin)
router.route('/:id')
    .get(getHotelById)
    .put(protect, authorize('admin'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
