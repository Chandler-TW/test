const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessHourSchema = new Schema({
  day: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  },
  closeTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  }
});

const SpecialDateSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  openTime: {
    type: String,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  },
  closeTime: {
    type: String,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format should be HH:MM (24 hour format)']
  },
  description: {
    type: String,
    trim: true
  }
});

const BusinessSettingSchema = new Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{10,11}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  logo: {
    type: String,
    default: 'default-logo.jpg'
  },
  description: {
    type: String,
    trim: true
  },
  businessHours: [BusinessHourSchema],
  specialDates: [SpecialDateSchema],
  appointmentSettings: {
    maxDaysInAdvance: {
      type: Number,
      default: 30,
      min: 1
    },
    appointmentDuration: {
      type: Number,
      default: 30, // in minutes
      enum: [15, 30, 45, 60, 90, 120]
    },
    minTimeBeforeCancel: {
      type: Number,
      default: 120, // in minutes (2 hours)
      min: 0
    },
    minTimeBeforeEdit: {
      type: Number,
      default: 120, // in minutes (2 hours)
      min: 0
    }
  },
  smsSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    apiKey: String,
    reminders: {
      enabled: {
        type: Boolean,
        default: true
      },
      timeBefore: {
        type: Number,
        default: 1440 // in minutes (24 hours)
      }
    }
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Only one business setting should exist
BusinessSettingSchema.statics.findOrCreate = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      businessName: 'Hair Salon',
      phone: '1234567890',
      email: 'info@hairsalon.com',
      businessHours: [
        { day: 0, isOpen: false, openTime: '09:00', closeTime: '18:00' },  // Sunday
        { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },   // Monday
        { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },   // Tuesday
        { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },   // Wednesday
        { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },   // Thursday
        { day: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },   // Friday
        { day: 6, isOpen: true, openTime: '10:00', closeTime: '16:00' }    // Saturday
      ]
    });
  }
  return settings;
};

const BusinessSetting = mongoose.model('BusinessSetting', BusinessSettingSchema);

module.exports = BusinessSetting;