const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Content = sequelize.define('Content', {
  apiId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('movie', 'book'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  poster: {
    type: DataTypes.TEXT   
  },

  description: {
    type: DataTypes.TEXT
  },

  releaseDate: {
    type: DataTypes.STRING
  },

  genre: {
    type: DataTypes.TEXT   
  },

  author: {
    type: DataTypes.TEXT
  },

  director: {
    type: DataTypes.STRING
  },

  duration: {
    type: DataTypes.INTEGER 
  },

  pageCount: {
    type: DataTypes.INTEGER
  },

  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

module.exports = Content;
