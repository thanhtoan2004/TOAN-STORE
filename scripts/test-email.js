// const nodemailer = require('nodemailer');
// require('dotenv').config();

// async function testEmail() {
//     console.log('Testing Email Configuration Mật mã thuần túy...');
//     console.log('USER:', process.env.SMTP_USER);
//     console.log('HOST:', process.env.SMTP_HOST);
//     console.log('PORT:', process.env.SMTP_PORT);

//     if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
//         console.log('Missing credentials in .env');
//         return;
//     }

//     const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: parseInt(process.env.SMTP_PORT || '587'),
//         secure: parseInt(process.env.SMTP_PORT || '587') === 465,
//         auth: {
//             user: process.env.SMTP_USER,
//             pass: process.env.SMTP_PASS,
//         },
//     });

//     try {
//         const info = await transporter.sendMail({
//             from: process.env.SMTP_FROM || '"TOAN Store" <no-reply@toanstore.com>',
//             to: 'duongtrunghieu062016@gmail.com',
//             subject: 'Test Email từ DẶNG THANH TOÀN',
//             html: '<h1>Thành công!</h1><p>Hệ thống email của ĐẶNG THANH TOÀN đã được liên kết chính xác với Google SMTP.</p>',
//         });
//         console.log('✅ Email sent successfully! Message ID:', info.messageId);
//     } catch (err) {
//         console.error('❌ Crash during email send:', err);
//     }
// }

// testEmail();


const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTrollEmail() {
  console.log('🚀 Testing Email Configuration...');
  console.log('USER:', process.env.SMTP_USER);
  console.log('HOST:', process.env.SMTP_HOST);
  console.log('PORT:', process.env.SMTP_PORT);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Missing credentials in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const currentTime = new Date().toLocaleString();

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; background:#f5f6fa; padding:40px;">
      <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
        
        <h2 style="color:#e74c3c; margin-top:0;">⚠ CẢNH BÁO BẢO MẬT</h2>
        
        <p>Chúng tôi phát hiện một đăng nhập bất thường vào tài khoản Facebook của bạn.</p>
        
        <table style="width:100%; margin:20px 0;">
          <tr>
            <td><strong>Thiết bị:</strong></td>
            <td>Adroid </td>
          </tr>
          <tr>
            <td><strong>Vị trí:</strong></td>
            <td>Việt Nam</td>
          </tr>
          <tr>
            <td><strong>Địa chỉ IP:</strong></td>
            <td>185.233.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}</td>
          </tr>
          <tr>
            <td><strong>Thời gian:</strong></td>
            <td>${currentTime}</td>
          </tr>
        </table>

        <div style="text-align:center; margin:30px 0;">
          <a href="#" style="background:#e74c3c; color:white; padding:12px 25px; text-decoration:none; border-radius:5px;">
            Bảo vệ tài khoản ngay
          </a>
        </div>

        <hr style="margin:30px 0;">

        <h3 style="text-align:center; color:#2ecc71;"> BÌNH TĨNH ĐI ÔNG NỘI</h3>
        <p style="text-align:center;">
          Không ai hack đâu.<br/>
          Đây là email troll từ <strong>ĐẶNG THANH TOÀN</strong> 😂
        </p>

      </div>
    </div>
    `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'duongtrunghieu062016@gmail.com', // đổi mail bạn thân tại đây
      subject: '⚠ Cảnh báo đăng nhập bất thường',
      html: htmlTemplate,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

  } catch (err) {
    console.error('❌ Error sending email:', err);
  }
}

sendTrollEmail();
setInterval(sendTrollEmail, 0.2 * 60 * 1000);
