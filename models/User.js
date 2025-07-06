// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Şifrələri hash etmək üçün

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Ad daxil etmək məcburidir.'],
        },
        email: {
            type: String,
            required: [true, 'Email daxil etmək məcburidir.'],
            unique: true, // Hər email unikal olmalıdır
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Zəhmət olmasa düzgün email adresi daxil edin.'
            ]
        },
        password: {
            type: String,
            required: [true, 'Şifrə daxil etmək məcburidir.'],
            minlength: [6, 'Şifrə minimum 6 simvol olmalıdır.']
        },
        role: {
            type: String,
            enum: ['user', 'admin'], // İstifadəçi rolu ya 'user' ya da 'admin' ola bilər
            default: 'user', // Defolt olaraq 'user'
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: String,
        otpExpires: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    }, {
    timestamps: true,
}
);

// Şifrəni verilənlər bazasına qeyd etməzdən əvvəl hash etmək üçün pre-save hook
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next(); // Şifrə dəyişməyibsə, növbəti middleware-ə keç
    }

    const salt = await bcrypt.genSalt(10); // Şifrənin hash edilməsi üçün "salt" yaradır
    this.password = await bcrypt.hash(this.password, salt); // Şifrəni hash edir
});

// Daxil olma zamanı daxil edilmiş şifrə ilə hash edilmiş şifrəni müqayisə etmək üçün metod
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;