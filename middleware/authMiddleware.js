// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// İstifadəçini qorunan marşrutlara daxil olmadan əvvəl autentifikasiya edir
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Cookie-dən yoxla
    if (req.cookies.token) {
        token = req.cookies.token;
    }
    // 2. Header-dən yoxla (Bearer ...)
    else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.log('No token found');
        res.status(401);
        throw new Error('Bu marşruta daxil olmaq üçün icazəniz yoxdur. Zəhmət olmasa daxil olun.');
    }
    
    try {
        // Tokeni yoxla
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            console.log('User not found for token');
            res.status(401);
            throw new Error('İcazə yoxdur, istifadəçi tapılmadı.');
        }
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401);
        throw new Error('İcazə yoxdur, token etibarsızdır.');
    }
});
// ...existing code...
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
