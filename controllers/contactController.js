// backend/controllers/contactController.js

const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');


// @desc    Əlaqə formasını idarə et
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Bütün məcburi sahələrin daxil edildiyini yoxla
    if (!name || !email || !subject || !message) {
        res.status(400);
        throw new Error('Zəhmət olmasa bütün sahələri doldurun.');
    }

    // Burada email göndərmə və ya verilənlər bazasına yazma məntiqi əlavə edilə bilər.
    // Məsələn, Nodemailer ilə email göndərmək:
 
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

   const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Yeni Əlaqə Mesajı: ${subject}`,
    html: `<p>Göndərən: ${name} (${email})</p><p>Mövzu: ${subject}</p><p>Mesaj: ${message}</p>`
};

if (!process.env.EMAIL_USER) {
    res.status(500);
    throw new Error('Admin email ünvanı təyin edilməyib.');
}

await transporter.sendMail(mailOptions);


    res.status(200).json({
        success: true,
        message: 'Mesajınız uğurla göndərildi! Tezliklə sizinlə əlaqə saxlayacağıq.',
    });
});
