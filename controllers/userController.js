// backend/controllers/userController.js

const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Asinxron funksiyaları idarə etmək üçün
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');


// @desc    Cari istifadəçinin profilini al
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
    // req.user obyektini authMiddleware-də əlavə edirik
    const user = await User.findById(req.user._id).select('-password'); // Şifrəni qaytarma

    if (user) {
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } else {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }
});

// @desc    Cari istifadəçinin profilini yenilə
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Əgər şifrə daxil edilibsə, onu da yenilə
        if (req.body.password) {
            user.password = req.body.password; // Şifrə User modelindəki pre-save hook tərəfindən hash ediləcək
        }

        const updatedUser = await user.save(); // İstifadəçini verilənlər bazasında yenilə

        res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            message: 'Profil uğurla yeniləndi.'
        });
    } else {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }
});

// @desc    Yeni istifadəçi yarat (yalnız admin üçün)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Məcburi sahələri yoxla
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Ad, email və şifrə daxil etmək məcburidir.');
    }

    // Email-in artıq mövcud olub-olmadığını yoxla
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Bu email ilə istifadəçi artıq mövcuddur.');
    }

    // Yeni istifadəçi yarat
    const user = await User.create({
        name,
        email,
        password, // Şifrə User modelindəki pre-save hook tərəfindən hash ediləcək
        role: role || 'user', // Əgər rol verilməyibsə, defolt 'user' olacaq
    });

    if (user) {
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: 'İstifadəçi uğurla yaradıldi.'
        });
    } else {
        res.status(400);
        throw new Error('İstifadəçi yaradılmadı.');
    }
});

// @desc    Bütün istifadəçiləri al (yalnız admin üçün)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Bütün istifadəçiləri şifrəsiz gətir
    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
});

// @desc    İstifadəçini ID-yə görə al (yalnız admin üçün)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        res.status(200).json({
            success: true,
            data: user,
        });
    } else {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }
});

// @desc    İstifadəçini sil (yalnız admin üçün)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne(); // Mongoose 6+ üçün .remove() yerinə .deleteOne() istifadə edin
        res.status(200).json({
            success: true,
            message: 'İstifadəçi uğurla silindi.'
        });
    } else {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }
});

// @desc    İstifadəçi rolunu yenilə (yalnız admin üçün)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            message: 'İstifadəçi rolu uğurla yeniləndi.'
        });
    } else {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }
});

exports.sendResetPasswordEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('Bu email ilə istifadəçi tapılmadı.');
    }

    // Token yarat və istifadəçiyə əlavə et
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 1000 * 60 * 30; // 30 dəqiqəlik etibarlıdır
    await user.save({ validateBeforeSave: false });

    // Linki hazırla və göndər
    const resetUrl = `https://gunay-aztravel.vercel.app/reset-password/${resetToken}`;
    await sendEmail({
        to: user.email,
        subject: 'Şifrəni sıfırla',
        text: `Şifrənizi sıfırlamaq üçün bu linkə daxil olun: ${resetUrl}`,
        resetUrl: resetUrl
    });

    res.status(200).json({ success: true, message: 'Şifrə sıfırlama linki emailə göndərildi.' });
});

// @desc  Token ilə yeni şifrə təyin et
// @route PUT /api/users/reset-password/:token
// @access Public
exports.resetPasswordWithToken = asyncHandler(async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Token etibarsız və ya vaxtı bitib.');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Şifrə uğurla yeniləndi.' });
});
