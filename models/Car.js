// backend/models/Car.js

const mongoose = require('mongoose');

const carSchema = mongoose.Schema(
    {
        brand: {
            type: String,
            required: [true, 'Avtomobil markası daxil etmək məcburidir.'],
            trim: true,
        },
        model: {
            type: String,
            required: [true, 'Avtomobil modeli daxil etmək məcburidir.'],
            trim: true,
        },
        year: {
            type: Number,
            required: [true, 'İstehsal ili daxil etmək məcburidir.'],
            min: [1900, 'İl 1900-dən az ola bilməz.'],
            max: [new Date().getFullYear() + 1, 'İl gələcəkdən çox ola bilməz.'],
        },
        licensePlate: {
            type: String,
            required: [true, 'Nömrə nişanı daxil etmək məcburidir.'],
            unique: true, // Hər nömrə nişanı unikal olmalıdır
            trim: true,
        },
        dailyRate: {
            type: Number,
            required: [true, 'Günlük qiymət daxil etmək məcburidir.'],
            min: [0, 'Qiymət mənfi ola bilməz.'],
        },
        fuelType: {
            type: String,
            enum: ['petrol', 'diesel', 'electric', 'hybrid'],
            default: 'petrol',
        },
        transmission: {
            type: String,
            enum: ['manual', 'automatic'],
            default: 'automatic',
        },
        seats: {
            type: Number,
            required: [true, 'Yer sayı daxil etmək məcburidir.'],
            min: [1, 'Yer sayı ən azı 1 olmalıdır.'],
        },
        description: {
            type: String,
            required: [true, 'Təsvir daxil etmək məcburidir.'],
        },
        images: {
            type: [String], // Şəkil URL-ləri
            default: [],
        },
        location: { // Avtomobilin icarəyə götürüləcəyi yer
            type: String,
            required: [true, 'Məkan daxil etmək məcburidir.'],
            trim: true,
        },
        unavailableDates: { // Avtomobilin mövcud olmadığı tarixlər
            type: [Date],
            default: [],
        },
        isAvailable: { // Ümumi mövcudluq statusu
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
