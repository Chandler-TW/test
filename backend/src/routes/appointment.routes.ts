import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableTimeSlots,
  verifyAppointment
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/appointments', createAppointment);
router.get('/timeslots', getAvailableTimeSlots);
router.post('/appointments/verify', verifyAppointment);

// Customer routes (authenticated as customer)
router.post('/appointments/:id/cancel', authenticate, cancelAppointment);

// Admin and stylist routes (authenticated with proper role)
router.get('/appointments', authenticate, authorize(['admin', 'stylist']), getAllAppointments);
router.get('/appointments/:id', authenticate, authorize(['admin', 'stylist']), getAppointmentById);
router.put('/appointments/:id/status', authenticate, authorize(['admin', 'stylist']), updateAppointmentStatus);

// Admin only routes
router.put('/appointments/:id', authenticate, authorize(['admin']), updateAppointment);

export default router;