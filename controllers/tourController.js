// backend/controllers/tourController.js

const Tour = require('../models/Tour');
const asyncHandler = require('express-async-handler');

// @desc    Bütün turları al
// @route   GET /api/tours
// @access  Public
exports.getTours = asyncHandler(async (req, res) => {
    // Axtarış və filtrləmə üçün query parametrlərini al
    const { city, country, minPrice, maxPrice, duration, difficulty } = req.query;

    let query = {};

    if (city) {
        query.city = { $regex: city, $options: 'i' };
    }
    if (country) {
        query.country = { $regex: country, $options: 'i' };
    }
    if (minPrice) {
        query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
        query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (duration) {
        query.duration = { $regex: duration, $options: 'i' };
    }
    if (difficulty) {
        query.difficulty = difficulty;
    }

    // Sıralama (məsələn, qiymətə görə artan)
    const sortBy = req.query.sortBy || 'price'; // Defolt olaraq qiymətə görə sırala
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Artan və ya azalan

    const tours = await Tour.find(query).sort({ [sortBy]: sortOrder });

    res.status(200).json({
        success: true,
        count: tours.length,
        data: tours,
    });
});

// @desc    Turu ID-yə görə al
// @route   GET /api/tours/:id
// @access  Public
exports.getTourById = asyncHandler(async (req, res) => {
    const tour = await Tour.findById(req.params.id);

    if (tour) {
        res.status(200).json({
            success: true,
            data: tour,
        });
    } else {
        res.status(404);
        throw new Error('Tur tapılmadı.');
    }
});

// @desc    Yeni tur yarat
// @route   POST /api/tours
// @access  Private/Admin
exports.createTour = asyncHandler(async (req, res) => {
    const { title, city, country, description, price, duration, maxGroupSize, difficulty, images, availableDates } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!title || !city || !country || !description || !price || !duration || !maxGroupSize) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi sahələri daxil edin.');
    }

    const tour = await Tour.create({
        title,
        city,
        country,
        description,
        price,
        duration,
        maxGroupSize,
        difficulty,
        images,
        availableDates: availableDates ? availableDates.map(date => new Date(date)) : [],
    });

    res.status(201).json({
        success: true,
        data: tour,
        message: 'Tur uğurla yaradıldı.'
    });
});

// @desc    Turu yenilə
// @route   PUT /api/tours/:id
// @access  Private/Admin
exports.updateTour = asyncHandler(async (req, res) => {
    const { title, city, country, description, price, duration, maxGroupSize, difficulty, images, availableDates } = req.body;

    const tour = await Tour.findById(req.params.id);

    if (tour) {
        tour.title = title || tour.title;
        tour.city = city || tour.city;
        tour.country = country || tour.country;
        tour.description = description || tour.description;
        tour.price = price !== undefined ? price : tour.price;
        tour.duration = duration || tour.duration;
        tour.maxGroupSize = maxGroupSize !== undefined ? maxGroupSize : tour.maxGroupSize;
        tour.difficulty = difficulty || tour.difficulty;
        tour.images = images || tour.images;
        tour.availableDates = availableDates ? availableDates.map(date => new Date(date)) : tour.availableDates;

        const updatedTour = await tour.save();

        res.status(200).json({
            success: true,
            data: updatedTour,
            message: 'Tur uğurla yeniləndi.'
        });
    } else {
        res.status(404);
        throw new Error('Tur tapılmadı.');
    }
});

// @desc    Turu sil
// @route   DELETE /api/tours/:id
// @access  Private/Admin
exports.deleteTour = asyncHandler(async (req, res) => {
    const tour = await Tour.findById(req.params.id);

    if (tour) {
        await tour.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Tur uğurla silindi.'
        });
    } else {
        res.status(404);
        throw new Error('Tur tapılmadı.');
    }
});
