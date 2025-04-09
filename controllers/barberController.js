const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// @desc    Get all barbers
// @route   GET /api/barbers
// @access  Public
exports.getBarbers = async (req, res) => {
  try {
    const { skill } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (skill) {
      filter.skills = skill;
    }
    
    const barbers = await Barber.find(filter).select('name photo bio yearsOfExperience skills portfolio');
    
    res.status(200).json({
      success: true,
      count: barbers.length,
      data: barbers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Get single barber
// @route   GET /api/barbers/:id
// @access  Public
exports.getBarber = async (req, res) => {
  try {
    const barber = await Barber.findOne({
      _id: req.params.id,
      isActive: true
    }).select('-specialDates');
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: barber
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Get barber availability
// @route   GET /api/barbers/:id/availability
// @access  Public
exports.getBarberAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }
    
    // Get barber
    const barber = await Barber.findOne({
      _id: req.params.id,
      isActive: true
    });
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    // Set up date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date(start);
    if (!endDate) {
      // If no end date, default to 7 days
      end.setDate(start.getDate() + 7);
    }
    end.setHours(23, 59, 59, 999);
    
    // Get all appointments for this barber in the date range
    const appointments = await Appointment.find({
      barberId: req.params.id,
      datetime: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    }).select('datetime');
    
    // Generate availability data
    const availability = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Check if there are any special dates for this barber
      const specialDate = barber.specialDates.find(sd => {
        const sdDate = new Date(sd.date);
        return sdDate.toDateString() === currentDate.toDateString();
      });
      
      // Skip if barber has a special date that's marked as unavailable
      if (specialDate && !specialDate.isAvailable) {
        const dateObj = {
          date: new Date(currentDate).toISOString(),
          isAvailable: false,
          reason: specialDate.reason || 'Not available on this day'
        };
        
        availability.push(dateObj);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Get work hours for this day
      const dayOfWeek = currentDate.getDay(); // 0-6, Sunday-Saturday
      const workHour = barber.workHours.find(wh => wh.day === dayOfWeek && wh.isActive);
      
      if (!workHour) {
        const dateObj = {
          date: new Date(currentDate).toISOString(),
          isAvailable: false,
          reason: 'Not working on this day'
        };
        
        availability.push(dateObj);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Parse work hours
      const [startHour, startMinute] = workHour.startTime.split(':').map(Number);
      const [endHour, endMinute] = workHour.endTime.split(':').map(Number);
      
      // Set work hours
      const dayStart = new Date(currentDate);
      dayStart.setHours(startHour, startMinute, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMinute, 0, 0);
      
      // Check appointments for this day
      const dayAppointments = appointments.filter(a => {
        const appDate = new Date(a.datetime);
        return appDate.toDateString() === currentDate.toDateString();
      });
      
      // Create slots every 30 minutes
      const slots = [];
      let slotTime = new Date(dayStart);
      
      while (slotTime < dayEnd) {
        // For past slots on current day, mark as unavailable
        const now = new Date();
        if (slotTime < now && slotTime.toDateString() === now.toDateString()) {
          slotTime = new Date(slotTime.getTime() + 30 * 60000); // Add 30 minutes
          continue;
        }
        
        // Count appointments in this slot
        const slotAppointments = dayAppointments.filter(a => {
          const appTime = new Date(a.datetime);
          return appTime.getTime() === slotTime.getTime();
        });
        
        slots.push({
          time: new Date(slotTime).toISOString(),
          isAvailable: slotAppointments.length < barber.maxAppointmentsPerSlot,
          slotsRemaining: barber.maxAppointmentsPerSlot - slotAppointments.length
        });
        
        slotTime = new Date(slotTime.getTime() + 30 * 60000); // Add 30 minutes
      }
      
      availability.push({
        date: new Date(currentDate).toISOString(),
        isAvailable: true,
        slots
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Create new barber
// @route   POST /api/barbers
// @access  Private (Admin)
exports.createBarber = async (req, res) => {
  try {
    const barber = await Barber.create(req.body);
    
    res.status(201).json({
      success: true,
      data: barber
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Update barber
// @route   PUT /api/barbers/:id
// @access  Private (Admin)
exports.updateBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: barber
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Delete barber
// @route   DELETE /api/barbers/:id
// @access  Private (Admin)
exports.deleteBarber = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check for upcoming appointments
    const pendingAppointments = await Appointment.countDocuments({
      barberId: req.params.id,
      datetime: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (pendingAppointments > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot delete barber with ${pendingAppointments} upcoming appointments. Please reassign or cancel these appointments first.`
      });
    }
    
    // Instead of deleting, set isActive to false
    const barber = await Barber.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true, session }
    );
    
    if (!barber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      data: {}
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

// @desc    Upload barber photo
// @route   PUT /api/barbers/:id/photo
// @access  Private (Admin)
exports.uploadBarberPhoto = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    
    const file = req.files.photo;
    
    // Validate file type
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }
    
    // Validate file size
    const maxSize = 1024 * 1024 * 2; // 2MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 2MB'
      });
    }
    
    // Create custom filename
    file.name = `barber_${barber._id}${path.extname(file.name)}`;
    
    // Create upload directory if it doesn't exist
    const uploadPath = path.join(__dirname, '../public/uploads/barbers');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Move file to upload directory
    file.mv(`${uploadPath}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Problem with file upload'
        });
      }
      
      // Update barber photo path
      await Barber.findByIdAndUpdate(req.params.id, {
        photo: `/uploads/barbers/${file.name}`,
        updatedAt: new Date()
      });
      
      res.status(200).json({
        success: true,
        data: `/uploads/barbers/${file.name}`
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Add portfolio item
// @route   POST /api/barbers/:id/portfolio
// @access  Private (Admin)
exports.addPortfolioItem = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }
    
    const file = req.files.image;
    
    // Validate file type
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }
    
    // Validate file size
    const maxSize = 1024 * 1024 * 2; // 2MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 2MB'
      });
    }
    
    // Create custom filename
    file.name = `portfolio_${barber._id}_${Date.now()}${path.extname(file.name)}`;
    
    // Create upload directory if it doesn't exist
    const uploadPath = path.join(__dirname, '../public/uploads/portfolio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Move file to upload directory
    file.mv(`${uploadPath}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Problem with file upload'
        });
      }
      
      // Add to portfolio
      const portfolioItem = {
        imageUrl: `/uploads/portfolio/${file.name}`,
        description: req.body.description || ''
      };
      
      barber.portfolio.push(portfolioItem);
      await barber.save();
      
      res.status(200).json({
        success: true,
        data: portfolioItem
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

// @desc    Remove portfolio item
// @route   DELETE /api/barbers/:id/portfolio/:itemId
// @access  Private (Admin)
exports.removePortfolioItem = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    // Find the portfolio item
    const portfolioItem = barber.portfolio.id(req.params.itemId);
    
    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }
    
    // Get the file path
    const filePath = path.join(__dirname, '../public', portfolioItem.imageUrl);
    
    // Try to delete the image file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from portfolio
    portfolioItem.remove();
    await barber.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};