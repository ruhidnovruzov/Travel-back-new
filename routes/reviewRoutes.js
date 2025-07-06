// backend/routes/reviewRoutes.js

const express = require('express');
const {
    getReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// mergeParams: true, bu router-in digər router-lərdən (məsələn, hotelRoutes) parametrləri almasına icazə verir.
// Məsələn, /api/hotels/:hotelId/reviews
const router = express.Router({ mergeParams: true });

// Bütün rəyləri al (Public)
// Yeni rəy yarat (Private)
router.route('/')
    .get(getReviews)
    .post(protect, createReview); // Yeni rəy yaratmaq üçün daxil olmaq lazımdır

// Rəyi ID-yə görə al (Public)
// Rəyi yenilə (Private - rəyi yazan istifadəçi/admin)
// Rəyi sil (Private - rəyi yazan istifadəçi/admin)
router.route('/:id')
    .get(getReviewById)
    .put(protect, updateReview)
    .delete(protect, deleteReview);

module.exports = router;
