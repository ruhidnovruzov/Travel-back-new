// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorMiddleware'); // Xəta idarəetmə middleware-i üçün

// Routes-ları daxil et
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes'); // Uçuş marşrutlarını daxil et (əgər varsa)
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const tourRoutes = require('./routes/tourRoutes'); // Yeni: Tur marşrutlarını daxil et
const bookingRoutes = require('./routes/bookingRoutes'); // Yeni: Rezervasiya marşrutlarını daxil et
const carRoutes = require('./routes/carRoutes'); // Yeni: Avtomobil marşrutlarını daxil et (əgər varsa)
const reviewRoutes = require('./routes/reviewRoutes'); // Yeni: Rəy marşrutlarını daxil et
const contactRoutes = require('./routes/contactRoutes'); // Yeni: Əlaqə marşrutlarını daxil et (əgər varsa)

// Environment dəyişənlərini yüklə
dotenv.config();

// Verilənlər bazasına qoşul
connectDB();

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://gunay-aztravel.vercel.app',
      'http://localhost:5173',
      'https://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));


// Middleware-ləri tətbiq et
app.use(express.json());
app.use(cookieParser());

// CORS ayarları

// Əsas marşrut
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Auth marşrutlarını istifadə et
app.use('/api/auth', authRoutes); // Bütün auth marşrutları '/api/auth' ilə başlayacaq
// İstifadəçi marşrutlarını daxil et
app.use('/api/users', userRoutes); // Bütün istifadəçi marşrutları '/api/users' ilə başlayacaq
// Uçuş marşrutlarını daxil et
app.use('/api/flights', flightRoutes); // Bütün uçuş marşrutları '/api/flights' ilə başlayacaq
// Hotel marşrutlarını daxil et (əgər varsa)
app.use('/api/hotels', hotelRoutes); // Bütün otel marşrutları '/api/hotels' ilə başlayacaq
// Otaq marşrutlarını daxil et (əgər varsa)
app.use('/api/rooms', roomRoutes); // Bütün otaq marşrutları '/api/rooms' ilə başlayacaq
// Tur marşrutlarını daxil et
app.use('/api/tours', tourRoutes); // Bütün tur marşrutları '/api/tours' ilə başlayacaq
// Rezervasiya marşrutlarını daxil et
app.use('/api/bookings', bookingRoutes); // Bütün rezervasiya marşrutları '/api/bookings' ilə başlayacaq
// Avtomobil marşrutlarını daxil et (əgər varsa)
app.use('/api/cars', carRoutes); // Bütün avtomobil marşrutları '/api/cars' ilə başlayacaq
// Rəy marşrutlarını daxil et
app.use('/api/reviews', reviewRoutes); // Bütün rəy marşrutları '/api/reviews' ilə başlayacaq
// Əlaqə marşrutlarını daxil et (əgər varsa)
app.use('/api/contact', contactRoutes); // Bütün əlaqə marşrutları '/


// Xəta idarəetmə middleware-i (bütün marşrutlardan sonra gəlməlidir)
// Bunu bir azdan yazacağıq
app.use(errorHandler);


// Portu təyin et
const PORT = process.env.PORT || 5000;

// Serveri dinləməyə başla
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});