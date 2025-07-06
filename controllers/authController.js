// backend/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken'); // JWT token yaratmaq üçün
const asyncHandler = require('express-async-handler'); // Asinxron funksiyaları idarə etmək üçün (xətaları avtomatik tutar)
const nodemailer = require('nodemailer'); // E-poçt göndərmək üçün

// JWT token yaratmaq funksiyası
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token 30 gün sonra etibarsız olacaq
    });
};

// Tokeni çərəzdə göndərmək funksiyası
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
        httpOnly: true, // JavaScript-dən çərəzə daxil olmağı qadağan edir (XSS hücumlarından qoruyur)
        secure: process.env.NODE_ENV === 'production' ? true : false, // Yalnız HTTPS üzərindən göndər (production-da true olmalıdır)
        sameSite: 'strict', // CSRF hücumlarından qoruma
    };

    if (process.env.NODE_ENV === 'production') {
        options.sameSite = 'none'; // Production-da "cross-site" tələblərə icazə vermək üçün
        options.secure = true;
    }

    res.status(statusCode)
        .cookie('token', token, options) // 'token' adlı çərəzi göndər
        .json({
            success: true,
            token, // Tokeni responseda da göndərmək (debug və ya mobil üçün)
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified, // isVerified dəyərini də göndər
            },
        });
};

// Nodemailer transporter-i konfiqurasiya et
const transporter = nodemailer.createTransport({
    service: 'gmail', // Məsələn, Gmail. Başqa xidmətlər üçün host, port və secure ayarlarını dəyişdirin.
    auth: {
        user: process.env.EMAIL_USER, // Sizin email adresiniz
        pass: process.env.EMAIL_PASS, // Sizin email şifrəniz və ya tətbiq şifrəniz
    },
});

// OTP yaratmaq funksiyası
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 rəqəmli OTP
};

// Doğrulama e-poçtu göndərmək funksiyası
const sendVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'TravelAZ: Email Doğrulama Kodunuz',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0056b3;">Email Doğrulama</h2>
                <p>TravelAZ-a qeydiyyatdan keçdiyiniz üçün təşəkkür edirik!</p>
                <p>Hesabınızı doğrulamaq üçün aşağıdakı kodu istifadə edin:</p>
                <h3 style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; font-size: 24px; text-align: center; color: #0056b3;">${otp}</h3>
                <p>Bu kod 5 dəqiqə ərzində etibarlıdır.</p>
                <p>Əgər siz bu qeydiyyatı etməmisinizsə, bu e-poçtu nəzərə almayın.</p>
                <p>Hörmətlə,<br/>TravelAZ Komandası</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};


// @desc    Yeni istifadəçi qeydiyyatı
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Bütün sahələrin daxil edildiyini yoxla
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün sahələri daxil edin.');
    }

    // Emailin artıq istifadə olunub-olmadığını yoxla
    const userExists = await User.findOne({ email });

    if (userExists) {
        // Əgər istifadəçi mövcuddursa və doğrulanmayıbsa, OTP-ni yenidən göndər
        if (!userExists.isVerified) {
            const otp = generateOTP();
            userExists.otp = otp;
            userExists.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 dəqiqə
            await userExists.save();
            await sendVerificationEmail(userExists.email, otp);

            res.status(200).json({
                success: true,
                message: 'Bu email ilə istifadəçi artıq mövcuddur, lakin doğrulanmayıb. Doğrulama kodu emailinizə yenidən göndərildi.',
            });
            return;
        } else {
            res.status(400);
            throw new Error('Bu email ilə artıq istifadəçi qeydiyyatdan keçmişdir.');
        }
    }

    // Yeni istifadəçi yarat
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 dəqiqə

    const user = await User.create({
        name,
        email,
        password,
        isVerified: false, // İlk olaraq doğrulanmamış
        otp,
        otpExpires,
    });

    if (user) {
        await sendVerificationEmail(user.email, otp); // Doğrulama e-poçtu göndər
        res.status(201).json({
            success: true,
            message: 'Qeydiyyat uğurlu oldu! Zəhmət olmasa, hesabınızı doğrulamaq üçün emailinizi yoxlayın.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });
    } else {
        res.status(400);
        throw new Error('İstifadəçi yaradıla bilmədi.');
    }
});

// @desc    İstifadəçi daxil olması
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Bütün sahələrin daxil edildiyini yoxla
    if (!email || !password) {
        res.status(400);
        throw new Error('Zəhmət olmasa email və şifrəni daxil edin.');
    }

    // İstifadəçini emailinə görə tap
    const user = await User.findOne({ email }).select('+password'); // Şifrəni də gətir

    if (!user) {
        res.status(401); // Unauthorized
        throw new Error('Yanlış email və ya şifrə.');
    }

    // İstifadəçi doğrulanmayıbsa
    if (!user.isVerified) {
        res.status(401);
        throw new Error('Zəhmət olmasa, hesabınızı doğrulayın. Doğrulama kodu emailinizə göndərildi.');
    }

    // Daxil edilmiş şifrəni yoxla
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Yanlış email və ya şifrə.');
    }

    sendTokenResponse(user, 200, res);
});

// @desc    İstifadəçi sistemdən çıxışı (Logout)
// @route   GET /api/auth/logout
// @access  Private
exports.logoutUser = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Tokeni tez bitir (10 saniyə)
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'strict',
    });

    if (process.env.NODE_ENV === 'production') {
        // Bu hissə artıq sendTokenResponse funksiyasında idarə olunur, lakin logout üçün də saxlayaq
        // res.options obyektinə birbaşa daxil olmaq düzgün deyil.
        // options obyektini cookie metoduna ötürmək lazımdır.
        // Yuxarıdakı cookie metodu artıq bunu edir.
    }

    res.status(200).json({
        success: true,
        message: 'Sistemdən uğurla çıxış edildi.',
    });
});

// @desc    Cari istifadəçinin profilini al
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    // req.user obyektini authMiddleware-də əlavə edəcəyik
    const user = await User.findById(req.user._id).select('-password'); // Şifrəni qaytarma

    if (!user) {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Email doğrulaması (OTP ilə)
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Zəhmət olmasa email və doğrulama kodunu daxil edin.');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('Hesabınız artıq doğrulanıb.');
    }

    // OTP-ni və etibarlılıq müddətini yoxla
    if (user.otp !== otp || user.otpExpires < Date.now()) {
        res.status(400);
        throw new Error('Yanlış və ya etibarsız doğrulama kodu.');
    }

    // İstifadəçini doğrulanmış olaraq qeyd et
    user.isVerified = true;
    user.otp = undefined; // OTP-ni təmizlə
    user.otpExpires = undefined; // OTP müddətini təmizlə
    await user.save();

    sendTokenResponse(user, 200, res); // Doğrulandıqdan sonra istifadəçini daxil et
});

// @desc    Yeni doğrulama kodu göndər (əgər istifadəçi kodu almayıbsa)
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Zəhmət olmasa email daxil edin.');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('İstifadəçi tapılmadı.');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('Hesabınız artıq doğrulanıb.');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 dəqiqə
    await user.save();

    await sendVerificationEmail(user.email, otp);

    res.status(200).json({
        success: true,
        message: 'Yeni doğrulama kodu emailinizə göndərildi.',
    });
});
