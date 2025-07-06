// backend/controllers/hotelController.js

const Hotel = require('../models/Hotel');
const asyncHandler = require('express-async-handler');

// @desc    Bütün hotelləri al
// @route   GET /api/hotels
// @access  Public
exports.getHotels = asyncHandler(async (req, res) => {
    // Axtarış və filtrləmə üçün query parametrlərini al
    const { city, minPrice, maxPrice, stars, amenities } = req.query;

    let query = {};

    if (city) {
        query.city = { $regex: city, $options: 'i' }; // Böyük/kiçik hərfə həssas olmayan axtarış
    }
    if (minPrice) {
        query.cheapestPrice = { ...query.cheapestPrice, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
        query.cheapestPrice = { ...query.cheapestPrice, $lte: parseFloat(maxPrice) };
    }
    if (typeof stars !== 'undefined') {
        query.stars = Number(stars); // Yalnız dəqiq ulduz
    }
    // ...
    if (amenities) {
        // Əgər amenities vergüllə ayrılmış string kimi gəlirsə, array-ə çevir
        const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim());
        query.amenities = { $in: amenitiesArray.map(a => new RegExp(a, 'i')) }; // Daxil olan xidmətlərə görə axtarış
    }

    // Sıralama (məsələn, qiymətə görə artan)
    const sortBy = req.query.sortBy || 'cheapestPrice'; // Defolt olaraq ən ucuz qiymətə görə sırala
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Artan və ya azalan

    const hotels = await Hotel.find(query).sort({ [sortBy]: sortOrder });

    res.status(200).json({
        success: true,
        count: hotels.length,
        data: hotels,
    });
});

// @desc    Hoteli ID-yə görə al
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotelById = asyncHandler(async (req, res) => {
    const hotel = await Hotel.findById(req.params.id);

    if (hotel) {
        res.status(200).json({
            success: true,
            data: hotel,
        });
    } else {
        res.status(404);
        throw new Error('Otel tapılmadı.');
    }
});

// @desc    Yeni hotel yarat
// @route   POST /api/hotels
// @access  Private/Admin
exports.createHotel = asyncHandler(async (req, res) => {
    const { name, address, city, country, stars, description, amenities, images, cheapestPrice } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!name || !address || !city || !country || !stars || !description || !cheapestPrice) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi sahələri daxil edin.');
    }

    const hotel = await Hotel.create({
        name,
        address,
        city,
        country,
        stars,
        description,
        amenities,
        images,
        cheapestPrice,
    });

    res.status(201).json({
        success: true,
        data: hotel,
        message: 'Otel uğurla yaradıldı.'
    });
});

// @desc    Hoteli yenilə
// @route   PUT /api/hotels/:id
// @access  Private/Admin
exports.updateHotel = asyncHandler(async (req, res) => {
    const { name, address, city, country, stars, description, amenities, images, cheapestPrice } = req.body;

    const hotel = await Hotel.findById(req.params.id);

    if (hotel) {
        hotel.name = name || hotel.name;
        hotel.address = address || hotel.address;
        hotel.city = city || hotel.city;
        hotel.country = country || hotel.country;
        hotel.stars = stars !== undefined ? stars : hotel.stars;
        hotel.description = description || hotel.description;
        hotel.amenities = amenities || hotel.amenities;
        hotel.images = images || hotel.images;
        hotel.cheapestPrice = cheapestPrice !== undefined ? cheapestPrice : hotel.cheapestPrice;



        const updatedHotel = await hotel.save();

        res.status(200).json({
            success: true,
            data: updatedHotel,
            message: 'Otel uğurla yeniləndi.'
        });
    } else {
        res.status(404);
        throw new Error('Otel tapılmadı.');
    }
});

// @desc    Hoteli sil
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
exports.deleteHotel = asyncHandler(async (req, res) => {
    const hotel = await Hotel.findById(req.params.id);

    if (hotel) {
        await hotel.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Otel uğurla silindi.'
        });
    } else {
        res.status(404);
        throw new Error('Otel tapılmadı.');
    }
});
