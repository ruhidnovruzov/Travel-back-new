// backend/routes/bookingRoutes.js

const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    getAllBookings,
    confirmBookingPayment // Yeni: Ödəniş təsdiqi funksiyası
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Yeni rezervasiya yarat (Private)
router.post('/', protect, createBooking);

// İstifadəçinin öz rezervasiyalarını al (Private)
router.get('/my', getMyBookings);

// Admin üçün bütün rezervasiyaları al (Private/Admin)
router.get('/', protect, authorize('admin'), getAllBookings);

// Rezervasiyanı ID-yə görə al (Private)
router.get('/:id', protect, getBookingById); // Admin və ya rezervasiyanı edən istifadəçi

// Rezervasiyanın statusunu yenilə (Private/Admin)
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus); // Yalnız admin

// Rezervasiyanı ləğv et (Private)
router.put('/:id/cancel', protect, cancelBooking); // Admin və ya rezervasiyanı edən istifadəçi

// Yeni: Rezervasiya üçün ödənişi təsdiqlə (Private)
router.put('/:id/confirm-payment', protect, confirmBookingPayment);

module.exports = router;
