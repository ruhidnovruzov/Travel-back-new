// backend/models/Review.js

const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Rəyin başlığı ən çox 100 simvol ola bilər.'],
        },
        text: {
            type: String,
            required: [true, 'Rəy mətni daxil etmək məcburidir.'],
            maxlength: [500, 'Rəy mətni ən çox 500 simvol ola bilər.'],
        },
        rating: {
            type: Number,
            min: [1, 'Reytinq ən azı 1 olmalıdır.'],
            max: [5, 'Reytinq ən çox 5 ola bilər.'],
            required: [true, 'Reytinq daxil etmək məcburidir.'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        // Rəyin hansı obyektə aid olduğunu göstərir (Flight, Hotel, Tour, Car)
        onModel: {
            type: String,
            required: true,
            enum: ['Flight', 'Hotel', 'Tour', 'Car'], // Mümkün modellər
        },
        item: {
            type: mongoose.Schema.ObjectId,
            required: true,
            refPath: 'onModel', // 'onModel' sahəsinin dəyərinə görə hansı modelə referans olduğunu dinamik təyin edir
        },
    },
    {
        toJSON: { virtuals: true }, // Virtual sahələri JSON-a daxil et
        toObject: { virtuals: true }, // Virtual sahələri obyektə daxil et
        timestamps: true, // Yaradılma və yenilənmə tarixlərini avtomatik əlavə edir
    }
);

// Hər istifadəçi yalnız bir obyekt üçün bir rəy yaza bilər
reviewSchema.index({ user: 1, item: 1 }, { unique: true });

// Statik metod: Obyektin orta reytinqini hesabla
reviewSchema.statics.getAverageRating = async function (itemId, onModel) {
    const obj = await this.aggregate([
        {
            $match: { item: itemId, onModel: onModel },
        },
        {
            $group: {
                _id: '$item',
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        // Mongoose modelini dinamik olaraq tap
        const Model = mongoose.model(onModel);
        if (obj.length > 0) {
            await Model.findByIdAndUpdate(itemId, {
                ratingsAverage: obj[0].averageRating,
                ratingsQuantity: obj[0].numOfReviews,
            });
        } else {
            // Rəylər silinərsə, reytinqləri sıfırla
            await Model.findByIdAndUpdate(itemId, {
                ratingsAverage: 0,
                ratingsQuantity: 0,
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// save() metodundan sonra orta reytinqi hesabla
reviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.item, this.onModel);
});

// remove() metodundan sonra orta reytinqi hesabla
reviewSchema.post('deleteOne', async function () {
    // Mongoose 6+ deleteOne() istifadə edərkən this.constructor-a birbaşa daxil olmaq üçün
    // bu şəkildə yazılır.
    await this.model.getAverageRating(this.item, this.onModel);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
