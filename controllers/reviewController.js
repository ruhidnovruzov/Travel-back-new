// backend/controllers/reviewController.js

const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');

// @desc    Bütün rəyləri al
// @route   GET /api/reviews
// @route   GET /api/:onModel/:itemId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res) => {
    let query;

    // Əgər URL-də onModel və itemId varsa, ona görə filtrlə
    if (req.params.onModel && req.params.itemId) {
        query = Review.find({ item: req.params.itemId, onModel: req.params.onModel });
    } else {
        query = Review.find();
    }

    // İstifadəçi məlumatlarını da gətir
    const reviews = await query.populate({
        path: 'user',
        select: 'name email',
    });

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    });
});

// @desc    Rəyi ID-yə görə al
// @route   GET /api/reviews/:id
// @access  Public
exports.getReviewById = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'user',
        select: 'name email',
    });

    if (!review) {
        res.status(404);
        throw new Error('Rəy tapılmadı.');
    }

    res.status(200).json({
        success: true,
        data: review,
    });
});

// @desc    Yeni rəy yarat
// @route   POST /api/:onModel/:itemId/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
    // onModel və itemId URL parametrlərindən alınır
    req.body.onModel = req.params.onModel;
    req.body.item = req.params.itemId;
    req.body.user = req.user._id; // Daxil olmuş istifadəçinin ID-si

    const { title, text, rating, onModel, item, user } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!text || !rating || !onModel || !item || !user) {
        res.status(400);
        throw new Error('Zəhmət olmasa rəy mətni, reytinq və obyekt məlumatlarını daxil edin.');
    }

    // Obyektin mövcudluğunu yoxla (məsələn, Hotel, Flight, Tour, Car)
    const Model = mongoose.model(onModel);
    const existingItem = await Model.findById(item);
    if (!existingItem) {
        res.status(404);
        throw new Error(`${onModel} tapılmadı.`);
    }

    // İstifadəçinin artıq bu obyekt üçün rəy yazıb-yazmadığını yoxla (unique index ilə də qorunur)
    const existingReview = await Review.findOne({ user: user, item: item, onModel: onModel });
    if (existingReview) {
        res.status(400);
        throw new Error('Siz artıq bu obyekt üçün rəy yazmısınız.');
    }

    const review = await Review.create(req.body);

    res.status(201).json({
        success: true,
        data: review,
        message: 'Rəy uğurla yaradıldı.',
    });
});

// @desc    Rəyi yenilə
// @route   PUT /api/reviews/:id
// @access  Private (Yalnız rəyi yazan istifadəçi və ya admin)
exports.updateReview = asyncHandler(async (req, res) => {
    const { title, text, rating } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Rəy tapılmadı.');
    }

    // Yalnız rəyi yazan istifadəçi və ya admin yeniləyə bilər
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Bu rəyi yeniləmək üçün icazəniz yoxdur.');
    }

    review.title = title || review.title;
    review.text = text || review.text;
    review.rating = rating !== undefined ? rating : review.rating;

    review = await review.save();

    res.status(200).json({
        success: true,
        data: review,
        message: 'Rəy uğurla yeniləndi.',
    });
});

// @desc    Rəyi sil
// @route   DELETE /api/reviews/:id
// @access  Private (Yalnız rəyi yazan istifadəçi və ya admin)
exports.deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Rəy tapılmadı.');
    }

    // Yalnız rəyi yazan istifadəçi və ya admin silə bilər
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Bu rəyi silmək üçün icazəniz yoxdur.');
    }

    await review.deleteOne(); // Mongoose 6+ üçün .remove() yerinə .deleteOne() istifadə edin

    res.status(200).json({
        success: true,
        message: 'Rəy uğurla silindi.',
    });
});
