// backend/routes/roomRoutes.js

const express = require('express');
const {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    updateRoomAvailability,
    getHotelRooms // Yeni əlavə edildi
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Bütün otaqları al (Public)
router.route('/')
    .get(getRooms);

// Otağı ID-yə görə al (Public)
// Otağı yenilə (Private/Admin)
// Otağı sil (Private/Admin)
router.route('/:id')
    .get(getRoomById)
    .put(protect, authorize('admin'), updateRoom)
    .delete(protect, authorize('admin'), deleteRoom);

// Yeni otaq yarat (Private/Admin) - hotelId ilə
router.route('/hotel/:hotelId') // /api/rooms/hotel/:hotelId
    .post(protect, authorize('admin'), createRoom);

// Otağın mövcudluğunu yenilə (Private - Rezervasiya sistemi üçün)
router.route('/availability/:id') // /api/rooms/availability/:id
    .put(protect, updateRoomAvailability); // Admin icazəsi tələb olunmur, çünki bu, rezervasiya zamanı istifadəçi tərəfindən də işə düşə bilər

// Bir hotelin bütün otaqlarını al (Public)
router.route('/byhotel/:hotelId') // /api/rooms/byhotel/:hotelId
    .get(getHotelRooms);


module.exports = router;
