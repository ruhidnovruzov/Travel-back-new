// backend/models/Flight.js

const mongoose = require('mongoose');

const flightSchema = mongoose.Schema(
    {
        airline: {
            type: String,
            required: [true, 'Aviaşirkət adı daxil etmək məcburidir.'],
            trim: true, // Boşluqları kəsmək üçün
        },
        flightNumber: {
            type: String,
            required: [true, 'Uçuş nömrəsi daxil etmək məcburidir.'],
            unique: true, // Hər uçuş nömrəsi unikal olmalıdır
            trim: true,
        },
        origin: {
            type: String,
            required: [true, 'Gediş şəhəri daxil etmək məcburidir.'],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, 'Çatış şəhəri daxil etmək məcburidir.'],
            trim: true,
        },
        departureTime: {
            type: Date,
            required: [true, 'Gediş tarixi və vaxtı daxil etmək məcburidir.'],
        },
        arrivalTime: {
            type: Date,
            required: [true, 'Çatış tarixi və vaxtı daxil etmək məcburidir.'],
        },
        price: {
            type: Number,
            required: [true, 'Qiymət daxil etmək məcburidir.'],
            min: [0, 'Qiymət mənfi ola bilməz.'],
        },
        availableSeats: {
            type: Number,
            required: [true, 'Mövcud yer sayı daxil etmək məcburidir.'],
            min: [0, 'Yer sayı mənfi ola bilməz.'],
        },
        totalSeats: {
            type: Number,
            required: [true, 'Ümumi yer sayı daxil etmək məcburidir.'],
            min: [1, 'Ümumi yer sayı ən azı 1 olmalıdır.'],
        },
        // Əlavə sahələr
        duration: {
            type: String, // Məsələn, "2h 30m"
            trim: true,
        },
        stops: {
            type: Number,
            default: 0,
            min: [0, 'Dayanacaq sayı mənfi ola bilməz.'],
        },
        // Uçuşun statusu (məsələn, 'scheduled', 'delayed', 'cancelled', 'departed', 'arrived')
        status: {
            type: String,
            enum: ['scheduled', 'delayed', 'cancelled', 'departed', 'arrived'],
            default: 'scheduled',
        },
    },
    {
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

// Uçuşun müddətini hesablamaq üçün virtual sahə (əgər hələ daxil edilməyibsə)
flightSchema.virtual('calculatedDuration').get(function() {
    if (this.departureTime && this.arrivalTime) {
        const diffMs = this.arrivalTime.getTime() - this.departureTime.getTime(); // Millisaniyələrdə fərq
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60)); // Saat
        const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60)); // Dəqiqə
        return `${diffHrs}h ${diffMins}m`;
    }
    return undefined;
});

// Uçuşun müddətini qeyd etməzdən əvvəl hesablamaq üçün pre-save hook
flightSchema.pre('save', function (next) {
    if (this.isModified('departureTime') || this.isModified('arrivalTime')) {
        if (this.departureTime && this.arrivalTime) {
            const diffMs = this.arrivalTime.getTime() - this.departureTime.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            this.duration = `${diffHrs}h ${diffMins}m`;
        }
    }
    next();
});


const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
