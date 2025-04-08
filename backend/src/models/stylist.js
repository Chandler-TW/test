const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stylist = sequelize.define('Stylist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    specialty: {
      type: DataTypes.JSON, // Array of service IDs the stylist can perform
      allowNull: false,
      defaultValue: '[]',
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
      validate: { min: 1.0, max: 5.0 },
    },
    serviceCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxDailyAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return Stylist;
};