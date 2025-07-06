// backend/config/db.js

const mongoose = require('mongoose');
require('dotenv').config(); // .env faylındakı dəyişənləri yükləyir

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Prosesi xəta ilə sonlandırır
    }
};

module.exports = connectDB;