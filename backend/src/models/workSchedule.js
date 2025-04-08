const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkSchedule = sequelize.define('WorkSchedule', {
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
      defaultValue: '09:00:00',
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '20:00:00',
    },
    maxAppointments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    isHoliday: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSpecialDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    specialNote: {
      type: DataTypes.STRING,
      allowNull: true,
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

  return WorkSchedule;
};