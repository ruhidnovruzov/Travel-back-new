// backend/routes/authRoutes.js

const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    verifyEmail, // Yeni
    resendOtp,   // Yeni
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
    sendResetPasswordEmail,
    resetPasswordWithToken,
} = require('../controllers/userController'); // Şifrə yeniləmə funksiyaları

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/me', protect, getMe);
router.post('/verify-email', verifyEmail); // Yeni: Email doğrulaması
router.post('/resend-otp', resendOtp);     // Yeni: OTP-ni yenidən göndər
router.route('/forgot-password').post(sendResetPasswordEmail);
router.route('/reset-password/:token').put(resetPasswordWithToken);

module.exports = router;
