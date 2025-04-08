const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'salon_appointment_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+08:00',
  }
);

// Import models
const Stylist = require('./stylist')(sequelize);
const Service = require('./service')(sequelize);
const Appointment = require('./appointment')(sequelize);
const TimeSlot = require('./timeSlot')(sequelize);
const WorkSchedule = require('./workSchedule')(sequelize);
const AppointmentLog = require('./appointmentLog')(sequelize);

// Define relationships
Stylist.hasMany(Appointment);
Appointment.belongsTo(Stylist);

Service.hasMany(Appointment);
Appointment.belongsTo(Service);

Stylist.hasMany(WorkSchedule);
WorkSchedule.belongsTo(Stylist);

Appointment.hasMany(AppointmentLog);
AppointmentLog.belongsTo(Appointment);

module.exports = {
  sequelize,
  Stylist,
  Service,
  Appointment,
  TimeSlot,
  WorkSchedule,
  AppointmentLog,
};