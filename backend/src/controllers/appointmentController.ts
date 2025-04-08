import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { 
  Appointment, 
  Customer, 
  Service, 
  Stylist, 
  StylistSchedule,
  AppointmentChangeLog
} from '../models';
import { generateAppointmentCode, isTimeSlotAvailable, checkStylistAvailability } from '../utils/appointmentUtils';
import { sendAppointmentConfirmationSMS } from '../utils/smsService';

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const { date, stylistId, status } = req.query;
    
    let whereClause: any = {};
    
    if (date) {
      whereClause.date = date;
    }
    
    if (stylistId) {
      whereClause.stylistId = stylistId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const appointments = await Appointment.findAll({
      where: whereClause,
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    return res.status(500).json({ message: 'Failed to get appointments', error });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    return res.status(500).json({ message: 'Failed to get appointment', error });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      serviceId,
      stylistId,
      date,
      startTime,
      endTime,
      notes
    } = req.body;
    
    // Validate required fields
    if (!customerName || !customerPhone || !serviceId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate phone format (Chinese mobile number pattern)
    const phoneRegex = /^1[3456789]\d{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    
    // Check if service exists
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if stylist exists and is available if specified
    let stylist = null;
    if (stylistId) {
      stylist = await Stylist.findByPk(stylistId);
      if (!stylist) {
        return res.status(404).json({ message: 'Stylist not found' });
      }
      
      // Check if stylist is available for the requested time
      const isAvailable = await checkStylistAvailability(stylistId, date, startTime, endTime);
      if (!isAvailable) {
        return res.status(409).json({ message: 'Stylist is not available for the requested time' });
      }
    }
    
    // Check if the time slot is available
    const isAvailable = await isTimeSlotAvailable(date, startTime, endTime, stylistId);
    if (!isAvailable) {
      return res.status(409).json({ message: 'Time slot is not available' });
    }
    
    // Find or create customer
    let customer = await Customer.findOne({ where: { phone: customerPhone } });
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        phone: customerPhone
      });
    }
    
    // If no stylist is specified, find an available one
    let assignedStylistId = stylistId;
    let assignedStylistName = stylist?.name;
    
    if (!assignedStylistId) {
      // Find available stylists who can do this service
      const availableStylists = await Stylist.findAll({
        where: {
          isActive: true
        },
        include: [
          {
            model: StylistSchedule,
            as: 'schedules',
            where: {
              date,
              isWorkDay: true
            },
            required: true
          }
        ]
      });
      
      // Filter stylists by those who specialize in this service
      const eligibleStylists = availableStylists.filter(s => {
        const specialties = s.getDataValue('specialty');
        return specialties.includes(serviceId.toString());
      });
      
      if (eligibleStylists.length === 0) {
        return res.status(409).json({ message: 'No available stylists for this service' });
      }
      
      // Randomly select a stylist
      const randomIndex = Math.floor(Math.random() * eligibleStylists.length);
      assignedStylistId = eligibleStylists[randomIndex].id;
      assignedStylistName = eligibleStylists[randomIndex].name;
    }
    
    // Generate appointment code
    const appointmentCode = generateAppointmentCode();
    
    // Create appointment
    const appointment = await Appointment.create({
      customerId: customer.id,
      customerName,
      customerPhone,
      serviceId,
      serviceName: service.name,
      stylistId: assignedStylistId,
      stylistName: assignedStylistName,
      date,
      startTime,
      endTime,
      notes,
      status: 'pending',
      appointmentCode
    });
    
    // Log the creation
    await AppointmentChangeLog.create({
      appointmentId: appointment.id,
      changedBy: 'customer',
      oldValues: JSON.stringify({}),
      newValues: JSON.stringify(appointment.toJSON()),
      changeType: 'create'
    });
    
    // Send confirmation SMS
    try {
      await sendAppointmentConfirmationSMS(
        customerPhone,
        appointmentCode,
        date,
        startTime,
        service.name,
        assignedStylistName || '未指定'
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
      // Don't fail the request if SMS fails
    }
    
    return res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Failed to create appointment', error });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      serviceId,
      serviceName,
      stylistId,
      stylistName,
      date,
      startTime,
      endTime,
      notes,
      status
    } = req.body;
    
    // Fetch the existing appointment
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Store old values for logging
    const oldValues = appointment.toJSON();
    
    // Check if time or stylist changed, and if so check availability
    if ((date && date !== appointment.date) || 
        (startTime && startTime !== appointment.startTime) || 
        (endTime && endTime !== appointment.endTime) ||
        (stylistId && stylistId !== appointment.stylistId)) {
      
      const newDate = date || appointment.date;
      const newStartTime = startTime || appointment.startTime;
      const newEndTime = endTime || appointment.endTime;
      const newStylistId = stylistId || appointment.stylistId;
      
      // Check if the time slot is available (excluding current appointment)
      const isAvailable = await isTimeSlotAvailable(
        newDate, 
        newStartTime, 
        newEndTime, 
        newStylistId, 
        parseInt(id)
      );
      
      if (!isAvailable) {
        return res.status(409).json({ message: 'Time slot is not available' });
      }
      
      // If stylist changed, check if the new stylist is available
      if (newStylistId && newStylistId !== appointment.stylistId) {
        const isAvailable = await checkStylistAvailability(
          newStylistId, 
          newDate, 
          newStartTime, 
          newEndTime
        );
        
        if (!isAvailable) {
          return res.status(409).json({ message: 'Stylist is not available for the requested time' });
        }
      }
    }
    
    // Update appointment
    const updatedAppointment = await appointment.update({
      customerName: customerName || appointment.customerName,
      customerPhone: customerPhone || appointment.customerPhone,
      serviceId: serviceId || appointment.serviceId,
      serviceName: serviceName || appointment.serviceName,
      stylistId: stylistId || appointment.stylistId,
      stylistName: stylistName || appointment.stylistName,
      date: date || appointment.date,
      startTime: startTime || appointment.startTime,
      endTime: endTime || appointment.endTime,
      notes: notes !== undefined ? notes : appointment.notes,
      status: status || appointment.status
    });
    
    // Log the update
    await AppointmentChangeLog.create({
      appointmentId: appointment.id,
      changedBy: req.user?.username || 'system',
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(updatedAppointment.toJSON()),
      changeType: 'update'
    });
    
    return res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ message: 'Failed to update appointment', error });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Store old values for logging
    const oldValues = appointment.toJSON();
    
    // Update status
    await appointment.update({ status });
    
    // If appointment is completed, increment stylist appointment count
    if (status === 'completed' && appointment.stylistId) {
      await Stylist.increment('appointmentCount', {
        by: 1,
        where: { id: appointment.stylistId }
      });
    }
    
    // Log the status change
    await AppointmentChangeLog.create({
      appointmentId: appointment.id,
      changedBy: req.user?.username || 'system',
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify({ ...oldValues, status }),
      changeType: 'status_change'
    });
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ message: 'Failed to update appointment status', error });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appointmentCode } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If appointment code is provided, validate it
    if (appointmentCode && appointment.appointmentCode !== appointmentCode) {
      return res.status(403).json({ message: 'Invalid appointment code' });
    }
    
    // Store old values for logging
    const oldValues = appointment.toJSON();
    
    // Update status to cancelled
    await appointment.update({ status: 'cancelled' });
    
    // Log the cancellation
    await AppointmentChangeLog.create({
      appointmentId: appointment.id,
      changedBy: req.user?.username || 'customer',
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify({ ...oldValues, status: 'cancelled' }),
      changeType: 'cancel'
    });
    
    return res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ message: 'Failed to cancel appointment', error });
  }
};

export const getAvailableTimeSlots = async (req: Request, res: Response) => {
  try {
    const { date, serviceId, stylistId } = req.query;
    
    if (!date || !serviceId) {
      return res.status(400).json({ message: 'Date and serviceId are required' });
    }
    
    // Get service duration
    const service = await Service.findByPk(serviceId as string);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Find working stylists for the date
    const whereClause: any = {
      date: date,
      isWorkDay: true
    };
    
    if (stylistId) {
      whereClause.stylistId = stylistId;
    }
    
    const schedules = await StylistSchedule.findAll({
      where: whereClause,
      include: [{
        model: Stylist,
        as: 'stylist',
        where: { isActive: true }
      }]
    });
    
    if (schedules.length === 0) {
      return res.status(200).json([]);
    }
    
    // Generate time slots
    const timeSlots = [];
    let slotId = 1;
    
    for (const schedule of schedules) {
      const startTime = schedule.startTime!; // e.g., "09:00"
      const endTime = schedule.endTime!; // e.g., "20:00"
      
      // Convert time strings to minutes for easier calculation
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      
      // Generate 30-minute slots
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotStartTime = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
        const slotEndMinutes = minutes + service.duration;
        
        // Skip if the service would end after the stylist's end time
        if (slotEndMinutes > endMinutes) {
          continue;
        }
        
        const slotEndTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
        
        // Check if the slot is available
        const isAvailable = await isTimeSlotAvailable(
          date as string, 
          slotStartTime, 
          slotEndTime, 
          stylistId as string | undefined
        );
        
        timeSlots.push({
          id: slotId++,
          date: date as string,
          startTime: slotStartTime,
          endTime: slotEndTime,
          isAvailable,
          stylistId: schedule.stylistId
        });
      }
    }
    
    return res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return res.status(500).json({ message: 'Failed to get available time slots', error });
  }
};

export const verifyAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentCode, phone } = req.body;
    
    if (!appointmentCode || !phone) {
      return res.status(400).json({ message: 'Appointment code and phone number are required' });
    }
    
    const appointment = await Appointment.findOne({
      where: {
        appointmentCode,
        customerPhone: phone
      }
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or code incorrect' });
    }
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error('Error verifying appointment:', error);
    return res.status(500).json({ message: 'Failed to verify appointment', error });
  }
};

// Helper types for TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}