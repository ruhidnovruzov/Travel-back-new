// backend/middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
    // Əgər cavab statusu artıq qoyulmayıbsa, default olaraq 500 (Server Xətası) qoy
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Productionda stack trace-i göstərmə
    });
};

module.exports = errorHandler;