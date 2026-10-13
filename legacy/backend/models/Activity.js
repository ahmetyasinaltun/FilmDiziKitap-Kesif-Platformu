const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Activity = sequelize.define('Activity', {
  type: {
    type: DataTypes.ENUM('review', 'rating', 'status_change'),
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 10 },
    allowNull: true
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Activity;
