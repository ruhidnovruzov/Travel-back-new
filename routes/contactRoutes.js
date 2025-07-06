// backend/routes/contactRoutes.js

const express = require('express');
const { submitContactForm } = require('../controllers/contactController');

const router = express.Router();

// Əlaqə formasını göndər
router.route('/').post(submitContactForm);

module.exports = router;
