const nodemailer = require('nodemailer');
require('dotenv').config(); // .env faylını yükləmək üçün

const sendEmail = async ({ to, subject, resetUrl}) => {
 const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Şifrəni sıfırla</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <table width="100%" style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 20px; background-color: #4caf50; color: white; text-align: center;">
              <h2>Şifrə sıfırlama tələbi</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p>Salam,</p>
              <p>Siz <strong>şifrə sıfırlama</strong> tələbi göndərmisiniz.</p>
              <p>Aşağıdakı düyməyə klik edərək yeni şifrə təyin edə bilərsiniz:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="padding: 12px 24px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Şifrəni sıfırla
                </a>
              </div>
              <p>Əgər siz bu tələbi etməmisinizsə, bu emaili nəzərə almayın.</p>
              <p style="margin-top: 40px;">Təşəkkürlər,<br /><strong>TravelAZ</strong> komandası</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"TravelAZ" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
    });
};

module.exports = sendEmail;