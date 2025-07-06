// backend/controllers/bookingController.js

const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Tour = require('../models/Tour');
const Car = require('../models/Car'); // Avtomobil icarəsi modulu əlavə edildikdə buraya daxil ediləcək
const asyncHandler = require('express-async-handler');

// @desc    Yeni rezervasiya yarat
// @route   POST /api/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res) => {
    const { bookingType, bookedItemId, startDate, endDate, totalPrice, passengers, roomNumber, roomId } = req.body;
    const userId = req.user._id; // Autentikasiya olunmuş istifadəçi ID-si

    // Ümumi məcburi sahələri yoxla
    if (!bookingType || !bookedItemId || !startDate || !totalPrice) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün məcburi rezervasiya sahələrini daxil edin.');
    }

    let bookedItemDoc;
    let updateData = {}; // Mövcudluq üçün yeniləmə datası

    switch (bookingType) {
        case 'flight':
            bookedItemDoc = await Flight.findById(bookedItemId);
            if (!bookedItemDoc || bookedItemDoc.availableSeats < passengers) {
                res.status(400);
                throw new Error('Uçuş mövcud deyil və ya kifayət qədər yer yoxdur.');
            }
            // Yerləri azaltmağı createBooking-də deyil, ödəniş təsdiqləndikdən sonra etmək daha məntiqlidir.
            // Hələlik bunu saxlayıram, lakin gələcəkdə ödəniş axını ilə birləşdirilə bilər.
            updateData = { $inc: { availableSeats: -passengers } }; // Yerləri azalt
            await Flight.findByIdAndUpdate(bookedItemId, updateData);
            break;
        case 'hotel':
            bookedItemDoc = await Hotel.findById(bookedItemId);
            if (!bookedItemDoc || !roomNumber || !roomId || !endDate) {
                res.status(400);
                throw new Error('Hotel, otaq nömrəsi, otaq ID-si və ya bitmə tarixi məcburidir.');
            }
            const roomDoc = await Room.findById(roomId);
            if (!roomDoc) {
                res.status(404);
                throw new Error('Otaq tapılmadı.');
            }
            // Otağın mövcudluğunu yoxla
            const datesToBook = getDatesInRange(new Date(startDate), new Date(endDate));
            const isRoomAvailable = roomDoc.roomNumbers.some(r =>
                r.number === roomNumber &&
                datesToBook.every(date => !r.unavailableDates.map(d => d.toISOString().split('T')[0]).includes(date.toISOString().split('T')[0]))
            );

            if (!isRoomAvailable) {
                res.status(400);
                throw new Error('Seçilmiş tarixlərdə bu otaq nömrəsi mövcud deyil.');
            }

            // Otağın mövcud olmayan tarixlərini burada yeniləmirik, ödəniş təsdiqləndikdən sonra yeniləyəcəyik.
            // await Room.findOneAndUpdate(
            //     { '_id': roomId, 'roomNumbers.number': roomNumber },
            //     { $push: { 'roomNumbers.$.unavailableDates': { $each: datesToBook } } },
            //     { new: true }
            // );
            break;
        case 'tour':
            bookedItemDoc = await Tour.findById(bookedItemId);
            if (!bookedItemDoc || bookedItemDoc.availableDates.length === 0 || !bookedItemDoc.availableDates.some(d => d.toISOString().split('T')[0] === new Date(startDate).toISOString().split('T')[0])) {
                res.status(400);
                throw new Error('Tur mövcud deyil və ya seçilmiş tarixdə yer yoxdur.');
            }
            // Tur üçün yerləri azaltmağa ehtiyac yoxdur, sadəcə tarixi rezervasiya etdik.
            // Gələcəkdə turda mövcud yer sayı əlavə edilə bilər.
            break;
        case 'car':
            bookedItemDoc = await Car.findById(bookedItemId);
            if (!bookedItemDoc || !endDate) {
                res.status(400);
                throw new Error('Avtomobil və ya bitmə tarixi məcburidir.');
            }
            // Avtomobilin mövcudluğunu yoxla
            const carDatesToBook = getDatesInRange(new Date(startDate), new Date(endDate));
            const isCarAvailable = carDatesToBook.every(date =>
                !bookedItemDoc.unavailableDates.map(d => d.toISOString().split('T')[0]).includes(date.toISOString().split('T')[0])
            );
            if (!isCarAvailable) {
                res.status(400);
                throw new Error('Seçilmiş tarixlərdə bu avtomobil mövcud deyil.');
            }
            // Avtomobilin mövcud olmayan tarixlərini burada yeniləmirik, ödəniş təsdiqləndikdən sonra yeniləyəcəyik.
            // await Car.findByIdAndUpdate(
            //     bookedItemId,
            //     { $push: { unavailableDates: { $each: carDatesToBook } } }
            // );
            break;
        default:
            res.status(400);
            throw new Error('Yanlış rezervasiya növü.');
    }

    // Yeni rezervasiya yarat
    const booking = await Booking.create({
        user: userId,
        bookingType,
        bookedItem: bookedItemId,
        room: bookingType === 'hotel' ? roomId : undefined,
        roomNumber: bookingType === 'hotel' ? roomNumber : undefined,
        startDate: new Date(startDate),
        endDate: bookingType === 'hotel' || bookingType === 'car' ? new Date(endDate) : undefined,
        totalPrice,
        passengers: passengers || 1, // Əgər yoxdursa 1
        status: 'pending', // Başlanğıcda pending
        paymentStatus: 'pending',
    });

    res.status(201).json({
        success: true,
        data: booking,
        message: 'Rezervasiya uğurla yaradıldı. Ödəniş gözlənilir.',
    });
});

// Tarix aralığındakı bütün tarixləri almaq üçün köməkçi funksiya
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};


// @desc    İstifadəçinin öz rezervasiyalarını al
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('bookedItem') // Rezervasiya olunan obyekti gətir
        .populate('room'); // Hotel rezervasiyasıdırsa otağı da gətir

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    });
});

// @desc    Rezervasiyanı ID-yə görə al
// @route   GET /api/bookings/:id
// @access  Private (Admin və ya rezervasiyanı edən istifadəçi)
exports.getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('bookedItem')
        .populate('room');

    if (!booking) {
        res.status(404);
        throw new Error('Rezervasiya tapılmadı.');
    }

    // Yalnız admin və ya rezervasiyanı edən istifadəçi baxa bilər
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bu rezervasiyaya baxmaq üçün icazəniz yoxdur.');
    }

    res.status(200).json({
        success: true,
        data: booking,
    });
});

// @desc    Rezervasiyanın statusunu yenilə (yalnız admin)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Rezervasiya tapılmadı.');
    }

    booking.status = status || booking.status;
    booking.paymentStatus = paymentStatus || booking.paymentStatus;

    const updatedBooking = await booking.save();

    res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Rezervasiya statusu uğurla yeniləndi.',
    });
});

// @desc    Rezervasiyanı ləğv et
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Admin və ya rezervasiyanı edən istifadəçi)
exports.cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Rezervasiya tapılmadı.');
    }

    // Yalnız admin və ya rezervasiyanı edən istifadəçi ləğv edə bilər
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bu rezervasiyanı ləğv etmək üçün icazəniz yoxdur.');
    }

    // Əgər artıq ləğv edilibsə
    if (booking.status === 'cancelled') {
        res.status(400);
        throw new Error('Bu rezervasiya artıq ləğv edilmişdir.');
    }

    booking.status = 'cancelled';
    // Əgər ödəniş edilibsə, paymentStatus-u 'refunded' olaraq yeniləyə bilərsiniz
    if (booking.paymentStatus === 'paid') {
        booking.paymentStatus = 'refunded';
        // Burada geri ödəmə məntiqi əlavə edilə bilər (ödəniş qapısı API-si ilə)
    }

    const cancelledBooking = await booking.save();

    // Rezervasiya ləğv edildikdə mövcudluğu geri qaytar
    switch (cancelledBooking.bookingType) {
        case 'flight':
            await Flight.findByIdAndUpdate(cancelledBooking.bookedItem, { $inc: { availableSeats: cancelledBooking.passengers } });
            break;
        case 'hotel':
            // Otağın mövcud olmayan tarixlərini geri qaytar
            const datesToUnbook = getDatesInRange(cancelledBooking.startDate, cancelledBooking.endDate);
            await Room.findOneAndUpdate(
                { '_id': cancelledBooking.room, 'roomNumbers.number': cancelledBooking.roomNumber },
                { $pullAll: { 'roomNumbers.$.unavailableDates': datesToUnbook } }
            );
            break;
        case 'tour':
            // Tur üçün yerləri geri qaytarmağa ehtiyac yoxdur, əgər turda yer sayı idarə edilmirsə
            break;
        case 'car':
            // Avtomobil üçün mövcudluğu geri qaytar
            await Car.findByIdAndUpdate(cancelledBooking.bookedItem, { $pullAll: { unavailableDates: getDatesInRange(cancelledBooking.startDate, cancelledBooking.endDate) } });
            break;
    }

    res.status(200).json({
        success: true,
        data: cancelledBooking,
        message: 'Rezervasiya uğurla ləğv edildi.',
    });
});

// @desc    Bütün rezervasiyaları al (yalnız admin)
// @route   GET /api/bookings
// @access  Private/Admin
exports.getAllBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({})
        .populate('user', 'name email') // İstifadəçi adını və emailini gətir
        .populate('bookedItem')
        .populate('room');

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    });
});

// @desc    Rezervasiya üçün ödənişi təsdiqlə (saxta ödəniş)
// @route   PUT /api/bookings/:id/confirm-payment
// @access  Private
exports.confirmBookingPayment = asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const { cardNumber, expiryDate, cvc } = req.body; // Saxta ödəniş məlumatları

    // Ödəniş məlumatlarının daxil edildiyini yoxla
    if (!cardNumber || !expiryDate || !cvc) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün ödəniş məlumatlarını daxil edin.');
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404);
        throw new Error('Rezervasiya tapılmadı.');
    }

    // Yalnız rezervasiyanı edən istifadəçi və ya admin təsdiq edə bilər
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bu rezervasiyanın ödənişini təsdiqləmək üçün icazəniz yoxdur.');
    }

    // Əgər rezervasiya artıq təsdiqlənibsə və ya ləğv edilibsə
    if (booking.status !== 'pending' || booking.paymentStatus !== 'pending') {
        res.status(400);
        throw new Error('Bu rezervasiya artıq ödənilmiş və ya ləğv edilmişdir.');
    }

    // Saxta ödəniş təsdiqi
    const fakePaymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.paymentId = fakePaymentId; // Saxta ödəniş ID-si

    const updatedBooking = await booking.save();

    // Rezervasiya təsdiqləndikdə mövcudluğu yenilə
    switch (updatedBooking.bookingType) {
        case 'flight':
            // Uçuş yerlərini azalt (əgər createBooking-də edilməyibsə)
            // Bu hissə createBooking-də edildiyi üçün burada təkrarlamırıq.
            // Əgər createBooking sadəcə "pending" yaradırsa, burada yerləri azaltmalıyıq.
            // Mövcud kodunuzda createBooking-də azaldılır, lakin ödəniş axını üçün burada da ola bilər.
            // Məsələn: await Flight.findByIdAndUpdate(updatedBooking.bookedItem, { $inc: { availableSeats: -updatedBooking.passengers } });
            break;
        case 'hotel':
            // Otağın mövcud olmayan tarixlərini yenilə
            const hotelDatesToBook = getDatesInRange(updatedBooking.startDate, updatedBooking.endDate);
            await Room.findOneAndUpdate(
                { '_id': updatedBooking.room, 'roomNumbers.number': updatedBooking.roomNumber },
                { $push: { 'roomNumbers.$.unavailableDates': { $each: hotelDatesToBook } } }
            );
            break;
        case 'car':
            // Avtomobilin mövcud olmayan tarixlərini yenilə
            const carDatesToBook = getDatesInRange(updatedBooking.startDate, updatedBooking.endDate);
            await Car.findByIdAndUpdate(
                updatedBooking.bookedItem,
                { $push: { unavailableDates: { $each: carDatesToBook } } }
            );
            break;
        case 'tour':
            // Tur üçün əlavə yer idarəetməsi varsa, burada yenilə
            break;
    }

    res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Ödəniş uğurla təsdiqləndi və rezervasiya təsdiqləndi!',
    });
});
