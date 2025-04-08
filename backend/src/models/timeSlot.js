const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimeSlot = sequelize.define('TimeSlot', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    stylistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Stylists',
        key: 'id',
      },
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Appointments',
        key: 'id',
      },
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

  return TimeSlot;
};