// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// İstifadəçini qorunan marşrutlara daxil olmadan əvvəl autentifikasiya edir
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Tokenin Authorization başlığında olub-olmadığını yoxlayın (Bearer token formatı)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // "Bearer tokenstring" formatından tokeni al
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('İcazə yoxdur, token formatı səhvdir.');
        }
    } 
    // 2. Əgər Authorization başlığında yoxdursa, çərəzlərdə olub-olmadığını yoxlayın
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // Token yoxdursa
    if (!token) {
        res.status(401);
        throw new Error('Bu marşruta daxil olmaq üçün icazəniz yoxdur. Zəhmət olmasa daxil olun.');
    }

    try {
        // Tokeni yoxla
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tokenin payload-ından istifadəçi ID-sini al və istifadəçini tap
        // req.user obyektinə istifadəçini əlavə edirik ki, kontrollerlərdə istifadə edə bilək
        req.user = await User.findById(decoded.id).select('-password'); // Şifrəsiz gətir

        if (!req.user) {
            res.status(401);
            throw new Error('İcazə yoxdur, istifadəçi tapılmadı.');
        }

        next(); // Növbəti middleware-ə və ya marşrut kontrollerinə keç
    } catch (error) {
        console.error(error);
        res.status(401);
        throw new Error('İcazə yoxdur, token etibarsızdır.');
    }
});

// İstifadəçinin rolunu yoxlayır (məsələn, admin üçün)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) { // req.user-in varlığını da yoxlayın
            res.status(403); // Forbidden
            throw new Error(`Sizin (${req.user ? req.user.role : 'qonaq'}) bu resursa giriş icazəniz yoxdur.`);
        }
        next();
    };
};

module.exports = { protect, authorize };
