// backend/controllers/roomController.js

const Room = require('../models/Room');
const Hotel = require('../models/Hotel'); // Otağı hotelə bağlamaq üçün Hotel modelinə ehtiyac var
const asyncHandler = require('express-async-handler');

// @desc    Yeni otaq yarat
// @route   POST /api/hotels/:hotelId/rooms
// @access  Private/Admin
exports.createRoom = asyncHandler(async (req, res) => {
    const hotelId = req.params.hotelId;
    const { title, price, maxPeople, desc, roomNumbers } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!title || !price || !maxPeople || !desc || !roomNumbers || roomNumbers.length === 0) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi sahələri daxil edin (otaq nömrələri daxil olmaqla).');
    }

    // Hotelin mövcudluğunu yoxla
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
        res.status(404);
        throw new Error('Otel tapılmadı.');
    }

    // Yeni otaq yarat
    const newRoom = await Room.create({
        title,
        price,
        maxPeople,
        desc,
        roomNumbers, // roomNumbers array-i birbaşa qeyd edilir
        hotel: hotelId, // Otağı hotelə bağla
    });

    // Otaq yaradıldıqdan sonra, əgər hotelin ən ucuz qiyməti yenilənməyibsə, yenilə
    if (newRoom.price < hotel.cheapestPrice) {
        hotel.cheapestPrice = newRoom.price;
        await hotel.save();
    }

    res.status(201).json({
        success: true,
        data: newRoom,
        message: 'Otaq uğurla yaradıldı.',
    });
});

// @desc    Bütün otaqları al (filtrlərlə)
// @route   GET /api/rooms
// @access  Public
exports.getRooms = asyncHandler(async (req, res) => {
    const { hotelId, minPrice, maxPrice, maxPeople } = req.query;
    let query = {};

    if (hotelId) {
        query.hotel = hotelId;
    }
    if (minPrice) {
        query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
        query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (maxPeople) {
        query.maxPeople = { ...query.maxPeople, $gte: parseInt(maxPeople) };
    }

    const rooms = await Room.find(query).populate('hotel', 'name city'); // Hotel adını və şəhərini də gətir

    res.status(200).json({
        success: true,
        count: rooms.length,
        data: rooms,
    });
});

// @desc    Otağı ID-yə görə al
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoomById = asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id).populate('hotel', 'name city'); // Hotel məlumatlarını da gətir

    if (room) {
        res.status(200).json({
            success: true,
            data: room,
        });
    } else {
        res.status(404);
        throw new Error('Otaq tapılmadı.');
    }
});

// @desc    Otağı yenilə
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = asyncHandler(async (req, res) => {
    const { title, price, maxPeople, desc, roomNumbers } = req.body;

    const room = await Room.findById(req.params.id);

    if (room) {
        room.title = title || room.title;
        room.price = price !== undefined ? price : room.price;
        room.maxPeople = maxPeople !== undefined ? maxPeople : room.maxPeople;
        room.desc = desc || room.desc;
        room.roomNumbers = roomNumbers || room.roomNumbers; // Otaq nömrələrini yenilə

        const updatedRoom = await room.save();

        // Hotelin ən ucuz qiymətini yenidən hesabla (əgər bu otağın qiyməti dəyişibsə)
        const hotel = await Hotel.findById(updatedRoom.hotel);
        if (hotel) {
            const cheapestRoom = await Room.findOne({ hotel: hotel._id }).sort('price');
            if (cheapestRoom && cheapestRoom.price !== hotel.cheapestPrice) {
                hotel.cheapestPrice = cheapestRoom.price;
                await hotel.save();
            }
        }

        res.status(200).json({
            success: true,
            data: updatedRoom,
            message: 'Otaq uğurla yeniləndi.',
        });
    } else {
        res.status(404);
        throw new Error('Otaq tapılmadı.');
    }
});

// @desc    Otağın mövcud olmayan tarixlərini yenilə (rezervasiya zamanı istifadə olunur)
// @route   PUT /api/rooms/availability/:id
// @access  Private (Booking system) - booking zamanı istifadə olunacaq
exports.updateRoomAvailability = asyncHandler(async (req, res) => {
    const { dates, roomNumber } = req.body; // dates array-i (məsələn, ["2025-07-20", "2025-07-21"])

    if (!dates || !Array.isArray(dates) || dates.length === 0 || !roomNumber) {
        res.status(400);
        throw new Error('Zəhmət olmasa mövcud olmayan tarixləri və otaq nömrəsini daxil edin.');
    }

    const room = await Room.findOneAndUpdate(
        { '_id': req.params.id, 'roomNumbers.number': roomNumber },
        {
            $push: {
                'roomNumbers.$.unavailableDates': { $each: dates.map(d => new Date(d)) }
            }
        },
        { new: true, runValidators: true } // Yenilənmiş sənədi qaytar, validasiyaları işə sal
    );

    if (room) {
        res.status(200).json({
            success: true,
            message: 'Otaq mövcudluğu uğurla yeniləndi.',
            data: room
        });
    } else {
        res.status(404);
        throw new Error('Otaq və ya otaq nömrəsi tapılmadı.');
    }
});


// @desc    Otağı sil
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const room = await Room.findById(roomId);

    if (room) {
        const hotelId = room.hotel;
        await room.deleteOne();

        // Otaq silindikdən sonra hotelin ən ucuz qiymətini yenidən hesabla
        const hotel = await Hotel.findById(hotelId);
        if (hotel) {
            const cheapestRoom = await Room.findOne({ hotel: hotel._id }).sort('price');
            hotel.cheapestPrice = cheapestRoom ? cheapestRoom.price : 0; // Əgər otaq qalmayıbsa 0 qoy
            await hotel.save();
        }

        res.status(200).json({
            success: true,
            message: 'Otaq uğurla silindi.',
        });
    } else {
        res.status(404);
        throw new Error('Otaq tapılmadı.');
    }
});

// @desc    Bir hotelin bütün otaqlarını al
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
exports.getHotelRooms = asyncHandler(async (req, res) => {
    const hotelId = req.params.hotelId;
    const rooms = await Room.find({ hotel: hotelId });

    if (rooms) {
        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms,
        });
    } else {
        res.status(404);
        throw new Error('Bu hotel üçün otaqlar tapılmadı.');
    }
});
