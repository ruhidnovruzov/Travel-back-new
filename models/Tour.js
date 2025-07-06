// backend/models/Tour.js

const mongoose = require('mongoose');

const tourSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Tur adı daxil etmək məcburidir.'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'Şəhər daxil etmək məcburidir.'],
            trim: true,
        },
        country: {
            type: String,
            required: [true, 'Ölkə daxil etmək məcburidir.'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Təsvir daxil etmək məcburidir.'],
        },
        price: {
            type: Number,
            required: [true, 'Qiymət daxil etmək məcburidir.'],
            min: [0, 'Qiymət mənfi ola bilməz.'],
        },
        duration: {
            type: String, // Məsələn, "3 gün", "1 həftə"
            required: [true, 'Müddət daxil etmək məcburidir.'],
            trim: true,
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'Maksimum qrup ölçüsü daxil etmək məcburidir.'],
            min: [1, 'Maksimum qrup ölçüsü ən azı 1 olmalıdır.'],
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'], // Çətinlik dərəcəsi
            default: 'easy',
        },
        ratingsAverage: {
            type: Number,
            default: 0,
            min: [0, 'Reytinq 0-dan az ola bilməz.'],
            max: [5, 'Reytinq 5-dən çox ola bilməz.'],
            set: val => Math.round(val * 10) / 10 // Reytinqi 1 onluq rəqəmə yuvarla
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        images: {
            type: [String], // Şəkil URL-ləri
            default: [],
        },
        // Gələcəkdə rezervasiya üçün mövcud tarixlər əlavə edilə bilər
        availableDates: {
            type: [Date],
            default: [],
        }
    },
    {
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
