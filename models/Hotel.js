// backend/models/Hotel.js

const mongoose = require('mongoose');

const hotelSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Otel adı daxil etmək məcburidir.'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Otel ünvanı daxil etmək məcburidir.'],
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
        stars: {
            type: Number,
            required: [true, 'Ulduz dərəcəsi daxil etmək məcburidir.'],
            min: [1, 'Ulduz dərəcəsi ən azı 1 olmalıdır.'],
            max: [5, 'Ulduz dərəcəsi ən çox 5 ola bilər.'],
        },
        description: {
            type: String,
            required: [true, 'Təsvir daxil etmək məcburidir.'],
        },
        amenities: { // Xidmətlər (məsələn, Wi-Fi, hovuz, parkinq)
            type: [String], // String array
            default: [],
        },
        images: { // Şəkil URL-ləri
            type: [String], // String array
            default: [],
        },
        cheapestPrice: { // Ən ucuz otağın qiyməti (axtarış üçün)
            type: Number,
            required: [true, 'Ən ucuz otağın qiyməti daxil etmək məcburidir.'],
            min: [0, 'Qiymət mənfi ola bilməz.'],
        },
        // Otaqlar üçün referans (əgər hər otaq ayrıca model olaraq saxlanılacaqsa)
        // rooms: [
        //     {
        //         type: mongoose.Schema.ObjectId,
        //         ref: 'Room', // 'Room' modelinə referans
        //     },
        // ],
    },
    {
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
