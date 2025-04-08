// Common types used across the application

export interface Service {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  imageUrl?: string;
}

export interface Stylist {
  id: number;
  name: string;
  imageUrl: string;
  specialty: string[]; // services they specialize in
  rating: number; // average rating
  appointmentCount: number; // number of completed appointments
  workSchedule: {
    [date: string]: {
      start: string;
      end: string;
      maxAppointments: number;
    };
  };
}

export interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  stylistId?: number;
}

export interface Appointment {
  id: number;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  serviceId: number;
  serviceName?: string;
  stylistId?: number;
  stylistName?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  appointmentCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
}

export interface ScheduleDay {
  date: string;
  isWorkDay: boolean;
  startTime?: string;
  endTime?: string;
  maxAppointments?: number;
  isHoliday?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'stylist' | 'customer';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}