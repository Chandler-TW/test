const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkHourSchema = new Schema({
  day: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const PortfolioItemSchema = new Schema({
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ServicePriceSchema = new Schema({
  serviceType: {
    type: String,
    enum: ['剪发', '染发', '护理'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
});

const BarberSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Barber name is required'],
    trim: true
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  bio: {
    type: String,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  skills: [{
    type: String,
    trim: true
  }],
  workHours: [WorkHourSchema],
  portfolio: [PortfolioItemSchema],
  servicePrices: [ServicePriceSchema],
  maxAppointmentsPerSlot: {
    type: Number,
    default: 3,
    min: 1
  },
  specialDates: [{
    date: Date,
    isAvailable: Boolean,
    reason: String
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Index for faster search by skills
BarberSchema.index({ skills: 1 });
BarberSchema.index({ isActive: 1 });

const Barber = mongoose.model('Barber', BarberSchema);

module.exports = Barber;