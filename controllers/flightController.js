const Flight = require('../models/Flight');
const asyncHandler = require('express-async-handler');

// @desc    Bütün uçuşları al (test üçün)
// @route   GET /api/flights/all
// @access  Public
exports.getAllFlights = asyncHandler(async (req, res) => {
    const flights = await Flight.find({});
    
    console.log('All flights in database:');
    flights.forEach((flight, index) => {
        console.log(`${index + 1}. Origin: "${flight.origin}" | Destination: "${flight.destination}"`);
    });

    res.status(200).json({
        success: true,
        count: flights.length,
        data: flights,
    });
});

// @desc    Bütün uçuşları al
// @route   GET /api/flights
// @access  Public
exports.getFlights = asyncHandler(async (req, res) => {
    // Axtarış və filtrləmə üçün query parametrlərini al
    const { origin, destination, departureDate, minPrice, maxPrice, airline } = req.query;

    let query = {};

    if (origin) {
        // URL decode et və düzgün şəkildə işlə
        const decodedOrigin = decodeURIComponent(origin);
        console.log('Original origin:', origin);
        console.log('Decoded origin:', decodedOrigin);
        query.origin = { $regex: decodedOrigin, $options: 'i' };
    }
    if (destination) {
        // URL decode et və düzgün şəkildə işlə
        const decodedDestination = decodeURIComponent(destination);
        console.log('Original destination:', destination);
        console.log('Decoded destination:', decodedDestination);
        query.destination = { $regex: decodedDestination, $options: 'i' };
    }
    if (departureDate) {
        // Tarix axtarışı üçün həmin günün başlanğıcından sonuna qədər olan aralığı təyin et
        const startOfDay = new Date(departureDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(departureDate);
        endOfDay.setHours(23, 59, 59, 999);

        query.departureTime = {
            $gte: startOfDay,
            $lte: endOfDay,
        };
    }
    if (minPrice) {
        query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
        query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (airline) {
        query.airline = { $regex: airline, $options: 'i' };
    }

    // Debug üçün query-ni konsola yazdır
    console.log('Search query:', JSON.stringify(query, null, 2));

    // Əvvəlcə bütün uçuşları al və debug et
    const allFlights = await Flight.find({});
    console.log('Total flights in DB:', allFlights.length);
    console.log('Sample flights:');
    allFlights.slice(0, 3).forEach((flight, index) => {
        console.log(`${index + 1}. Origin: "${flight.origin}" | Destination: "${flight.destination}"`);
    });

    // Sıralama (məsələn, qiymətə görə artan)
    const sortBy = req.query.sortBy || 'departureTime'; // Defolt olaraq gediş vaxtına görə sırala
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Artan və ya azalan

    const flights = await Flight.find(query).sort({ [sortBy]: sortOrder });

    // Debug üçün tapılan uçuşları da yazdır
    console.log('Found flights count:', flights.length);
    if (flights.length > 0) {
        console.log('First flight origin:', flights[0].origin);
        console.log('First flight destination:', flights[0].destination);
    } else {
        console.log('No flights found with current query');
    }

    res.status(200).json({
        success: true,
        count: flights.length,
        data: flights,
    });
});

// @desc    Uçuşu ID-yə görə al
// @route   GET /api/flights/:id
// @access  Public
exports.getFlightById = asyncHandler(async (req, res) => {
    const flight = await Flight.findById(req.params.id);

    if (flight) {
        res.status(200).json({
            success: true,
            data: flight,
        });
    } else {
        res.status(404);
        throw new Error('Uçuş tapılmadı.');
    }
});

// @desc    Yeni uçuş yarat
// @route   POST /api/flights
// @access  Private/Admin
exports.createFlight = asyncHandler(async (req, res) => {
    const { airline, flightNumber, origin, destination, departureTime, arrivalTime, price, totalSeats } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!airline || !flightNumber || !origin || !destination || !departureTime || !arrivalTime || !price || !totalSeats) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi sahələri daxil edin.');
    }

    // Uçuş nömrəsinin unikal olduğunu yoxla
    const flightExists = await Flight.findOne({ flightNumber });
    if (flightExists) {
        res.status(400);
        throw new Error('Bu uçuş nömrəsi ilə artıq uçuş mövcuddur.');
    }

    // availableSeats-ı totalSeats ilə eyni qoy
    const flight = await Flight.create({
        airline,
        flightNumber,
        origin,
        destination,
        departureTime,
        arrivalTime,
        price,
        totalSeats,
        availableSeats: totalSeats, // Başlanğıcda bütün yerlər mövcuddur
    });

    res.status(201).json({
        success: true,
        data: flight,
        message: 'Uçuş uğurla yaradıldı.'
    });
});

// @desc    Uçuşu yenilə
// @route   PUT /api/flights/:id
// @access  Private/Admin
exports.updateFlight = asyncHandler(async (req, res) => {
    const { airline, flightNumber, origin, destination, departureTime, arrivalTime, price, availableSeats, totalSeats, stops, status } = req.body;

    const flight = await Flight.findById(req.params.id);

    if (flight) {
        flight.airline = airline || flight.airline;
        flight.flightNumber = flightNumber || flight.flightNumber;
        flight.origin = origin || flight.origin;
        flight.destination = destination || flight.destination;
        flight.departureTime = departureTime || flight.departureTime;
        flight.arrivalTime = arrivalTime || flight.arrivalTime;
        flight.price = price || flight.price;
        flight.availableSeats = availableSeats !== undefined ? availableSeats : flight.availableSeats;
        flight.totalSeats = totalSeats || flight.totalSeats;
        flight.stops = stops !== undefined ? stops : flight.stops;
        flight.status = status || flight.status;

        const updatedFlight = await flight.save();

        res.status(200).json({
            success: true,
            data: updatedFlight,
            message: 'Uçuş uğurla yeniləndi.'
        });
    } else {
        res.status(404);
        throw new Error('Uçuş tapılmadı.');
    }
});

// @desc    Uçuşu sil
// @route   DELETE /api/flights/:id
// @access  Private/Admin
exports.deleteFlight = asyncHandler(async (req, res) => {
    const flight = await Flight.findById(req.params.id);

    if (flight) {
        await flight.deleteOne(); // Mongoose 6+ üçün .remove() yerinə .deleteOne() istifadə ed
        res.status(200).json({
            success: true,
            message: 'Uçuş uğurla silindi.'
        });
    } else {
        res.status(404);
        throw new Error('Uçuş tapılmadı.');
    }
});