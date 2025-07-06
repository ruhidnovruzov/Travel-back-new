// backend/models/Booking.js

const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        bookingType: {
            type: String,
            enum: ['Flight', 'Hotel', 'Tour', 'Car', 'flight', 'hotel', 'tour', 'car'], // Həm böyük, həm kiçik hərfləri dəstəklə
            required: true,
            // Getter əlavə edirik ki, həmişə böyük hərflə başlasın
            get: function(value) {
                if (!value) return value;
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            },
            // Setter əlavə edirik ki, saxlayarkən düzgün formata çevirilsin
            set: function(value) {
                if (!value) return value;
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            }
        },
        bookedItem: {
            type: mongoose.Schema.ObjectId,
            required: true,
            refPath: 'bookingTypeCapitalized', // Yeni virtual field istifadə edirik
        },
        room: {
            type: mongoose.Schema.ObjectId,
            ref: 'Room',
            required: function() { return this.bookingType === 'Hotel'; }
        },
        roomNumber: {
            type: Number,
            required: function() { return this.bookingType === 'Hotel'; }
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: function() { return this.bookingType === 'Hotel' || this.bookingType === 'Car'; }
        },
        totalPrice: {
            type: Number,
            required: true,
            min: [0, 'Ümumi qiymət mənfi ola bilməz.'],
        },
        passengers: {
            type: Number,
            min: [1, 'Sərnişin/iştirakçı sayı ən azı 1 olmalıdır.'],
            required: function() { return this.bookingType === 'Flight' || this.bookingType === 'Tour'; }
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        paymentId: {
            type: String,
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true }, // JSON-a çevirərkən getter-ləri istifadə et
        toObject: { getters: true } // Object-ə çevirərkən getter-ləri istifadə et
    }
);

// Virtual field əlavə edirik populate üçün
bookingSchema.virtual('bookingTypeCapitalized').get(function() {
    if (!this.bookingType) return this.bookingType;
    return this.bookingType.charAt(0).toUpperCase() + this.bookingType.slice(1).toLowerCase();
});

// Pre-save middleware - save etməzdən əvvəl bookingType-ni düzəlt
bookingSchema.pre('save', function(next) {
    if (this.bookingType && this.isModified('bookingType')) {
        this.bookingType = this.bookingType.charAt(0).toUpperCase() + this.bookingType.slice(1).toLowerCase();
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;