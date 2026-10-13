const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', 
    pass: process.env.EMAIL_PASS || 'your-password'
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'SocialLib <noreply@sociallib.com>',
    to,
    subject,
    text
  };

  try {
    
    if (!process.env.EMAIL_USER) {
        console.warn('UYARI: EMAIL_USER .env dosyasında tanımlı değil. E-posta gönderilemedi.');
        return;
    }

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email gönderilemedi');
  }
};

module.exports = sendEmail;