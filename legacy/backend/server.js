const path = require('path');

const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '.env') });

if (dotenvResult.error) {
    console.error('Error loading .env file:', dotenvResult.error);
}


if (process.env.EMAIL_USER) {
    console.log('EMAIL_USER loaded successfully:', process.env.EMAIL_USER);
} else {
    console.warn('WARNING: EMAIL_USER is NOT loaded. Current directory:', __dirname);
    console.log('Environment variables loaded:', Object.keys(process.env));
}

const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const { sequelize } = require('./models');


connectDB().then(() => {
  sequelize.sync({ alter: true })
    .then(() => console.log('Veritabanı tabloları senkronize edildi.'))
    .catch(err => console.error('Senkronizasyon hatası:', err));
});

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));


app.get('/', (req, res) => {
  res.send('SocialLib API is running...');
});


app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: 'Sunucu hatası!' });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
