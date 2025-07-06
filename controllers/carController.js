// backend/controllers/carController.js

const Car = require('../models/Car');
const asyncHandler = require('express-async-handler');

// @desc    Bütün avtomobilləri al
// @route   GET /api/cars
// @access  Public
exports.getCars = asyncHandler(async (req, res) => {
    // Axtarış və filtrləmə üçün query parametrlərini al
    const { brand, model, location, minDailyRate, maxDailyRate, seats, transmission, startDate, endDate } = req.query;

    let query = {};

    if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
    }
    if (model) {
        query.model = { $regex: model, $options: 'i' };
    }
    if (location) {
        query.location = { $regex: location, $options: 'i' };
    }
    if (minDailyRate) {
        query.dailyRate = { ...query.dailyRate, $gte: parseFloat(minDailyRate) };
    }
    if (maxDailyRate) {
        query.dailyRate = { ...query.dailyRate, $lte: parseFloat(maxDailyRate) };
    }
    if (seats) {
        query.seats = { $gte: parseInt(seats) };
    }
    if (transmission) {
        query.transmission = transmission;
    }

    // Tarix aralığına görə mövcudluğu yoxla
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Tarix aralığındakı hər bir tarixin unavailableDates-də olmamasını təmin et
        query.unavailableDates = {
            $not: {
                $elemMatch: {
                    $gte: start,
                    $lte: end
                }
            }
        };
    }

    // Sıralama
    const sortBy = req.query.sortBy || 'dailyRate';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const cars = await Car.find(query).sort({ [sortBy]: sortOrder });

    res.status(200).json({
        success: true,
        count: cars.length,
        data: cars,
    });
});

// @desc    Avtomobili ID-yə görə al
// @route   GET /api/cars/:id
// @access  Public
exports.getCarById = asyncHandler(async (req, res) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        res.status(200).json({
            success: true,
            data: car,
        });
    } else {
        res.status(404);
        throw new Error('Avtomobil tapılmadı.');
    }
});

// @desc    Yeni avtomobil yarat
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = asyncHandler(async (req, res) => {
    const { brand, model, year, licensePlate, dailyRate, fuelType, transmission, seats, description, images, location } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!brand || !model || !year || !licensePlate || !dailyRate || !fuelType || !transmission || !seats || !description || !location) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi sahələri daxil edin.');
    }

    // Nömrə nişanının unikal olduğunu yoxla
    const carExists = await Car.findOne({ licensePlate });
    if (carExists) {
        res.status(400);
        throw new Error('Bu nömrə nişanı ilə artıq avtomobil mövcuddur.');
    }

    const car = await Car.create({
        brand,
        model,
        year,
        licensePlate,
        dailyRate,
        fuelType,
        transmission,
        seats,
        description,
        images,
        location,
    });

    res.status(201).json({
        success: true,
        data: car,
        message: 'Avtomobil uğurla yaradıldı.',
    });
});

// @desc    Avtomobili yenilə
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = asyncHandler(async (req, res) => {
    const { brand, model, year, licensePlate, dailyRate, fuelType, transmission, seats, description, images, location, isAvailable } = req.body;

    const car = await Car.findById(req.params.id);

    if (car) {
        car.brand = brand || car.brand;
        car.model = model || car.model;
        car.year = year || car.year;
        car.licensePlate = licensePlate || car.licensePlate;
        car.dailyRate = dailyRate !== undefined ? dailyRate : car.dailyRate;
        car.fuelType = fuelType || car.fuelType;
        car.transmission = transmission || car.transmission;
        car.seats = seats !== undefined ? seats : car.seats;
        car.description = description || car.description;
        car.images = images || car.images;
        car.location = location || car.location;
        car.isAvailable = isAvailable !== undefined ? isAvailable : car.isAvailable;

        const updatedCar = await car.save();

        res.status(200).json({
            success: true,
            data: updatedCar,
            message: 'Avtomobil uğurla yeniləndi.',
        });
    } else {
        res.status(404);
        throw new Error('Avtomobil tapılmadı.');
    }
});

// @desc    Avtomobilin mövcud olmayan tarixlərini yenilə (icarə zamanı istifadə olunur)
// @route   PUT /api/cars/availability/:id
// @access  Private (Booking system)
exports.updateCarAvailability = asyncHandler(async (req, res) => {
    const { dates } = req.body; // dates array-i (məsələn, ["2025-07-20", "2025-07-21"])

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        res.status(400);
        throw new Error('Zəhmət olmasa mövcud olmayan tarixləri daxil edin.');
    }

    const car = await Car.findByIdAndUpdate(
        req.params.id,
        {
            $push: {
                unavailableDates: { $each: dates.map(d => new Date(d)) }
            }
        },
        { new: true, runValidators: true }
    );

    if (car) {
        res.status(200).json({
            success: true,
            message: 'Avtomobil mövcudluğu uğurla yeniləndi.',
            data: car
        });
    } else {
        res.status(404);
        throw new Error('Avtomobil tapılmadı.');
    }
});

// @desc    Avtomobili sil
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = asyncHandler(async (req, res) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        await car.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Avtomobil uğurla silindi.',
        });
    } else {
        res.status(404);
        throw new Error('Avtomobil tapılmadı.');
    }
});
