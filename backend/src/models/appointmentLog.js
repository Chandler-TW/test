const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AppointmentLog = sequelize.define('AppointmentLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Appointments',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'cancel', 'complete', 'reschedule', 'no_show'),
      allowNull: false,
    },
    previousStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
    changedFields: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.STRING, // Could be 'customer', 'admin', 'stylist', 'system'
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    timestamps: false, // Only need createdAt
  });

  return AppointmentLog;
};