// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// İstifadəçini qorunan marşrutlara daxil olmadan əvvəl autentifikasiya edir
const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    console.log('Headers:', req.headers); // Debug üçün
    console.log('Cookies:', req.cookies); // Debug üçün
    
    // 1. Authorization header-dən token al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token from header:', token);
        } catch (error) {
            console.error('Header token error:', error);
        }
    }
    
    // 2. Cookie-dən token al
    if (!token && req.cookies.token) {
        token = req.cookies.token;
        console.log('Token from cookie:', token);
    }
    
    // Token yoxdursa
    if (!token) {
        console.log('No token found');
        res.status(401);
        throw new Error('Bu marşruta daxil olmaq üçün icazəniz yoxdur. Zəhmət olmasa daxil olun.');
    }
    
    try {
        // Tokeni yoxla
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        // İstifadəçini tap
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            console.log('User not found for token');
            res.status(401);
            throw new Error('İcazə yoxdur, istifadəçi tapılmadı.');
        }
        
        console.log('User found:', req.user.email);
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401);
        throw new Error('İcazə yoxdur, token etibarsızdır.');
    }
});
// İstifadəçinin rolunu yoxlayır (məsələn, admin üçün)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403); // Forbidden
            throw new Error(`Sizin (${req.user.role}) bu resursa giriş icazəniz yoxdur.`);
        }
        next();
    };
};

module.exports = { protect, authorize };