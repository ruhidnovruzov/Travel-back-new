// backend/routes/userRoutes.js

const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getUsers,
    getUserById,
    deleteUser,
    updateUserRole,
    sendResetPasswordEmail,
    resetPasswordWithToken,
    createUser, // Yeni əlavə edilən funksiya
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Cari istifadəçinin profilini al və ya yenilə (Private)
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Admin üçün istifadəçi idarəetmə marşrutları (Private/Admin)
router.route('/')
    .get(protect, authorize('admin'), getUsers) // Bütün istifadəçiləri al
    .post(protect, authorize('admin'), createUser); // Yeni istifadəçi yarat

router.route('/:id')
    .get(protect, authorize('admin'), getUserById) // İstifadəçini ID-yə görə al
    .delete(protect, authorize('admin'), deleteUser); // İstifadəçini sil

    
router.route('/forgot-password').post(sendResetPasswordEmail);
router.route('/reset-password/:token').put(resetPasswordWithToken);

router.route('/:id/role')
    .put(protect, authorize('admin'), updateUserRole); // İstifadəçi rolunu yenilə

module.exports = router;
