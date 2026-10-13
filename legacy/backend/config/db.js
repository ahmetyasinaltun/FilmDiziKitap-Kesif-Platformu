const { Sequelize } = require('sequelize');
const path = require('path');


require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, 
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı.');
    
    
    
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error.message);
    process.exit(1); 
  }
};

module.exports = { sequelize, connectDB };