import { Op } from 'sequelize';
import { Appointment, StylistSchedule } from '../models';

/**
 * Generates a unique appointment code
 * Format: 2 letters + 6 numbers (e.g., AB123456)
 */
export const generateAppointmentCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letterPart = 
    letters.charAt(Math.floor(Math.random() * letters.length)) + 
    letters.charAt(Math.floor(Math.random() * letters.length));
  
  // Generate 6 random digits
  const numberPart = Math.floor(100000 + Math.random() * 900000).toString();
  
  return letterPart + numberPart;
};

/**
 * Checks if a time slot is available for booking
 * @param date Date string in YYYY-MM-DD format
 * @param startTime Time string in HH:MM format
 * @param endTime Time string in HH:MM format
 * @param stylistId Optional stylist ID to check for specific stylist availability
 * @param excludeAppointmentId Optional appointment ID to exclude from the check (for updates)
 * @returns Boolean indicating if the time slot is available
 */
export const isTimeSlotAvailable = async (
  date: string,
  startTime: string,
  endTime: string,
  stylistId?: string | undefined,
  excludeAppointmentId?: number
): Promise<boolean> => {
  try {
    // Build where clause
    const whereClause: any = {
      date,
      status: {
        [Op.notIn]: ['cancelled']
      },
      // Time ranges overlap if:
      // - New start time is before existing end time AND
      // - New end time is after existing start time
      [Op.or]: [
        {
          [Op.and]: [
            { startTime: { [Op.lte]: endTime } },
            { endTime: { [Op.gte]: startTime } }
          ]
        }
      ]
    };
    
    // Add stylist filter if provided
    if (stylistId) {
      whereClause.stylistId = stylistId;
    }
    
    // Exclude the appointment being updated
    if (excludeAppointmentId) {
      whereClause.id = { [Op.ne]: excludeAppointmentId };
    }
    
    // Check for conflicting appointments
    const conflictingAppointments = await Appointment.findAll({
      where: whereClause,
      limit: 1
    });
    
    return conflictingAppointments.length === 0;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    throw error;
  }
};

/**
 * Checks if a stylist is available for a given date and time
 * @param stylistId Stylist ID
 * @param date Date string in YYYY-MM-DD format
 * @param startTime Time string in HH:MM format
 * @param endTime Time string in HH:MM format
 * @returns Boolean indicating if the stylist is available
 */
export const checkStylistAvailability = async (
  stylistId: string | number,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  try {
    // First check if stylist is working on that day
    const schedule = await StylistSchedule.findOne({
      where: {
        stylistId,
        date,
        isWorkDay: true
      }
    });
    
    if (!schedule) {
      // Stylist is not working that day
      return false;
    }
    
    // Check if the requested time is within the stylist's working hours
    const scheduleStartTime = schedule.startTime!;
    const scheduleEndTime = schedule.endTime!;
    
    if (startTime < scheduleStartTime || endTime > scheduleEndTime) {
      // Outside of working hours
      return false;
    }
    
    // Check if stylist already has too many appointments for the day
    const appointmentCount = await Appointment.count({
      where: {
        stylistId,
        date,
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });
    
    if (schedule.maxAppointments && appointmentCount >= schedule.maxAppointments) {
      // Exceeds maximum appointments for the day
      return false;
    }
    
    // Finally check for time conflicts with existing appointments
    return await isTimeSlotAvailable(date, startTime, endTime, String(stylistId));
  } catch (error) {
    console.error('Error checking stylist availability:', error);
    throw error;
  }
};