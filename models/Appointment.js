const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{10,11}$/, 'Please enter a valid phone number']
  },
  barberId: {
    type: Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'Barber selection is required']
  },
  serviceType: {
    type: String,
    enum: ['剪发', '染发', '护理'],
    required: [true, 'Service type is required']
  },
  datetime: {
    type: Date,
    required: [true, 'Appointment time is required'],
    validate: {
      validator: function(v) {
        return v > new Date(); // Appointment must be in the future
      },
      message: 'Appointment time must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'canceled'],
    default: 'pending'
  },
  cancelReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookup by phone and date
AppointmentSchema.index({ phone: 1, datetime: 1 });
AppointmentSchema.index({ barberId: 1, datetime: 1 });

// Validate that appointment time is at 30-minute intervals
AppointmentSchema.path('datetime').validate(function(value) {
  const minutes = value.getMinutes();
  return minutes === 0 || minutes === 30;
}, 'Appointment time must be at 30-minute intervals');

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;