// backend/models/Room.js

const mongoose = require('mongoose');

const roomSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Otaq adı daxil etmək məcburidir.'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Otağın qiyməti daxil etmək məcburidir.'],
            min: [0, 'Qiymət mənfi ola bilməz.'],
        },
        maxPeople: {
            type: Number,
            required: [true, 'Maksimum adam sayı daxil etmək məcburidir.'],
            min: [1, 'Maksimum adam sayı ən azı 1 olmalıdır.'],
        },
        desc: {
            type: String,
            required: [true, 'Təsvir daxil etmək məcburidir.'],
        },
        roomNumbers: [{ number: Number, unavailableDates: { type: [Date] } }],
        // Hər bir otaq növü üçün unikal otaq nömrələri və onların mövcud olmayan tarixləri
        // Məsələn: [{ number: 101, unavailableDates: ["2025-07-20", "2025-07-21"] }]
        hotel: {
            type: mongoose.Schema.ObjectId,
            ref: 'Hotel', // Hansı hotelə aid olduğunu göstərir
            required: true,
        },
    },
    {
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
