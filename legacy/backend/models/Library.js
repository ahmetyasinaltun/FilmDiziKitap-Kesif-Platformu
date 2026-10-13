const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Library = sequelize.define('Library', {
  status: {
    type: DataTypes.ENUM('watched', 'plan_to_watch', 'read', 'reading', 'dropped', 'on_hold'),
    allowNull: false
  }
});

module.exports = Library;
