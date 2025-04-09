const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const BusinessSetting = require('../models/BusinessSetting');
const mongoose = require('mongoose');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (Admin/Barber)
exports.getAppointments = async (req, res) => {
  try {
    const { date, status, barberId } = req.query;
    const filter = {};

    // Build filter object based on query parameters
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      filter.datetime = { $gte: startDate, $lte: endDate };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (barberId) {
      filter.barberId = barberId;
    }

    // For barbers, only show their own appointments
    if (req.user.role === 'barber') {
      filter.barberId = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('barberId', 'name')
      .sort({ datetime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('barberId', 'name photo skills');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if the user is authorized to view this appointment
    if (req.user.role === 'customer' && 
        appointment.phone !== req.user.phone) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Public
exports.createAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerName, phone, barberId, serviceType, datetime } = req.body;

    // Check if barber exists
    const barber = await Barber.findById(barberId);
    if (!barber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    // Get business settings
    const settings = await BusinessSetting.findOrCreate();
    
    // Validate appointment time
    const appointmentTime = new Date(datetime);
    
    // Check if appointment is in the future
    if (appointmentTime < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Appointment time must be in the future'
      });
    }

    // Check if appointment is at 30-minute intervals
    if (appointmentTime.getMinutes() !== 0 && appointmentTime.getMinutes() !== 30) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Appointment time must be at 30-minute intervals'
      });
    }

    // Check if the day is a business day
    const day = appointmentTime.getDay();
    const businessHours = settings.businessHours.find(h => h.day === day);
    
    if (!businessHours || !businessHours.isOpen) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'The salon is closed on this day'
      });
    }

    // Check if the time is within business hours
    const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
    
    const openTime = new Date(appointmentTime);
    openTime.setHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(appointmentTime);
    closeTime.setHours(closeHour, closeMinute, 0, 0);
    
    if (appointmentTime < openTime || appointmentTime >= closeTime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `The salon is open from ${businessHours.openTime} to ${businessHours.closeTime} on this day`
      });
    }

    // Check if barber has too many appointments at the same time
    const existingAppointments = await Appointment.countDocuments({
      barberId,
      datetime: appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointments >= barber.maxAppointmentsPerSlot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This time slot is fully booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create([{
      customerName,
      phone,
      barberId,
      serviceType,
      datetime: appointmentTime,
      status: 'pending'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // TODO: Send SMS notification

    res.status(201).json({
      success: true,
      data: appointment[0]
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const { barberId, serviceType, datetime, status } = req.body;
    
    // Find appointment
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is authorized to update
    if (req.user.role === 'customer' && appointment.phone !== req.user.phone) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // For customers, only allow updates before the specified time limit
    if (req.user.role === 'customer') {
      const settings = await BusinessSetting.findOrCreate();
      const minTimeBeforeEdit = settings.appointmentSettings.minTimeBeforeEdit || 120; // in minutes
      
      const currentTime = new Date();
      const appointmentTime = new Date(appointment.datetime);
      const timeDiffInMinutes = (appointmentTime - currentTime) / (1000 * 60);
      
      if (timeDiffInMinutes < minTimeBeforeEdit) {
        return res.status(400).json({
          success: false,
          message: `Appointments can only be modified ${minTimeBeforeEdit / 60} hours before the scheduled time`
        });
      }
      
      // Customers cannot change status directly
      if (status && status !== appointment.status) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change appointment status'
        });
      }
    }

    // If date/time or barber is changing, validate availability
    if ((datetime && datetime !== appointment.datetime.toISOString()) || 
        (barberId && barberId !== appointment.barberId.toString())) {
      
      const newDateTime = datetime ? new Date(datetime) : appointment.datetime;
      const newBarberId = barberId || appointment.barberId;
      
      // Check if barber exists
      const barber = await Barber.findById(newBarberId);
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barber not found'
        });
      }
      
      // Get business settings
      const settings = await BusinessSetting.findOrCreate();
      
      // Check if appointment is at 30-minute intervals
      if (newDateTime.getMinutes() !== 0 && newDateTime.getMinutes() !== 30) {
        return res.status(400).json({
          success: false,
          message: 'Appointment time must be at 30-minute intervals'
        });
      }
      
      // Check if the day is a business day
      const day = newDateTime.getDay();
      const businessHours = settings.businessHours.find(h => h.day === day);
      
      if (!businessHours || !businessHours.isOpen) {
        return res.status(400).json({
          success: false,
          message: 'The salon is closed on this day'
        });
      }
      
      // Check if the time is within business hours
      const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
      
      const openTime = new Date(newDateTime);
      openTime.setHours(openHour, openMinute, 0, 0);
      
      const closeTime = new Date(newDateTime);
      closeTime.setHours(closeHour, closeMinute, 0, 0);
      
      if (newDateTime < openTime || newDateTime >= closeTime) {
        return res.status(400).json({
          success: false,
          message: `The salon is open from ${businessHours.openTime} to ${businessHours.closeTime} on this day`
        });
      }
      
      // Check if barber has too many appointments at the same time
      const existingAppointments = await Appointment.countDocuments({
        _id: { $ne: req.params.id }, // Exclude the current appointment
        barberId: newBarberId,
        datetime: newDateTime,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      if (existingAppointments >= barber.maxAppointmentsPerSlot) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is fully booked'
        });
      }
    }
    
    // Update appointment
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    // TODO: Send SMS notification for changes
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    
    // Find appointment
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is authorized to cancel
    if (req.user.role === 'customer' && appointment.phone !== req.user.phone) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }
    
    // For customers, only allow cancellation before the specified time limit
    if (req.user.role === 'customer') {
      const settings = await BusinessSetting.findOrCreate();
      const minTimeBeforeCancel = settings.appointmentSettings.minTimeBeforeCancel || 120; // in minutes
      
      const currentTime = new Date();
      const appointmentTime = new Date(appointment.datetime);
      const timeDiffInMinutes = (appointmentTime - currentTime) / (1000 * 60);
      
      if (timeDiffInMinutes < minTimeBeforeCancel) {
        return res.status(400).json({
          success: false,
          message: `Appointments can only be cancelled ${minTimeBeforeCancel / 60} hours before the scheduled time`
        });
      }
    }
    
    // Update to cancelled status instead of deleting
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'canceled', 
        cancelReason: cancelReason || '', 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    // TODO: Send SMS notification for cancellation
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Check available time slots
// @route   GET /api/appointments/available
// @access  Public
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { date, barberId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }
    
    // Get business settings
    const settings = await BusinessSetting.findOrCreate();
    
    // Get start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    // Get end of day
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Check if the day is a business day
    const day = startDate.getDay();
    const businessHours = settings.businessHours.find(h => h.day === day);
    
    if (!businessHours || !businessHours.isOpen) {
      return res.status(200).json({
        success: true,
        message: 'The salon is closed on this day',
        data: []
      });
    }
    
    // Get opening/closing times
    const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
    
    const openTime = new Date(startDate);
    openTime.setHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(startDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);
    
    // Get all barbers or a specific barber
    let barbers = [];
    if (barberId) {
      const barber = await Barber.findById(barberId);
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barber not found'
        });
      }
      barbers = [barber];
    } else {
      barbers = await Barber.find({ isActive: true });
    }
    
    // Get all appointments for the day
    const appointments = await Appointment.find({
      datetime: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Generate time slots
    const timeSlots = [];
    const slotDuration = settings.appointmentSettings.appointmentDuration || 30; // in minutes
    
    // Current time
    const now = new Date();
    
    // Start from opening time
    let currentTime = new Date(openTime);
    
    while (currentTime < closeTime) {
      // Skip past time slots for today
      if (currentTime.toDateString() === now.toDateString() && currentTime < now) {
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
        continue;
      }
      
      const slot = {
        time: currentTime.toISOString(),
        availableBarbers: []
      };
      
      // Check availability for each barber
      for (const barber of barbers) {
        const barberAppointments = appointments.filter(
          a => a.barberId.toString() === barber._id.toString() && 
               a.datetime.getTime() === currentTime.getTime()
        );
        
        if (barberAppointments.length < barber.maxAppointmentsPerSlot) {
          slot.availableBarbers.push({
            id: barber._id,
            name: barber.name,
            slotsRemaining: barber.maxAppointmentsPerSlot - barberAppointments.length
          });
        }
      }
      
      if (slot.availableBarbers.length > 0) {
        timeSlots.push(slot);
      }
      
      // Move to next time slot
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }
    
    res.status(200).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Get appointments by phone number and appointment ID
// @route   GET /api/appointments/lookup
// @access  Public
exports.lookupAppointment = async (req, res) => {
  try {
    const { phone, appointmentId } = req.query;
    
    if (!phone || !appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and appointment ID are required'
      });
    }
    
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      phone
    }).populate('barberId', 'name photo skills');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found. Please check your phone number and appointment ID'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};