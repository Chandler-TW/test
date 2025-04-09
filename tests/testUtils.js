/**
 * Test utilities and mock data for haircut booking system tests
 */

// Mock booking data for tests
const mockBookingData = {
  'BK123456': {
    customerName: 'John Doe',
    phoneNumber: '13800138000',
    barber: 'Tony',
    serviceType: '剪发',
    appointmentTime: '2023-07-01T14:30:00',
    bookingNumber: 'BK123456',
    status: 'pending'
  },
  'BK123457': {
    customerName: 'Jane Smith',
    phoneNumber: '13900139000',
    barber: 'Mike',
    serviceType: '染发',
    appointmentTime: '2023-07-01T15:30:00',
    bookingNumber: 'BK123457',
    status: 'confirmed'
  }
};

// Mock time slot data
const mockTimeSlots = {
  '2023-07-01': [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: true },
    { time: '10:30', available: false },
    { time: '11:00', available: false },
    { time: '11:30', available: true },
    { time: '12:00', available: true },
    { time: '12:30', available: true },
    { time: '13:00', available: true },
    { time: '13:30', available: true },
    { time: '14:00', available: true },
    { time: '14:30', available: false },
    { time: '15:00', available: true },
    { time: '15:30', available: false },
    { time: '16:00', available: true },
    { time: '16:30', available: true },
    { time: '17:00', available: true },
    { time: '17:30', available: true }
  ]
};

// Mock barber data
const mockBarberData = [
  {
    id: '1',
    name: 'Tony',
    photo: 'tony.jpg',
    yearsOfExperience: 5,
    specialties: ['短发', '商务发型', '渐变'],
    portfolio: ['tony_work1.jpg', 'tony_work2.jpg', 'tony_work3.jpg', 'tony_work4.jpg'],
    availability: {
      available: true,
      nextAvailableSlot: null
    }
  },
  {
    id: '2',
    name: 'Mike',
    photo: 'mike.jpg',
    yearsOfExperience: 8,
    specialties: ['染发', '烫发', '长发'],
    portfolio: ['mike_work1.jpg', 'mike_work2.jpg', 'mike_work3.jpg'],
    availability: {
      available: false,
      nextAvailableSlot: '2023-07-01T14:00:00'
    }
  },
  {
    id: '3',
    name: 'Lucy',
    photo: 'lucy.jpg',
    yearsOfExperience: 3,
    specialties: ['短发', '染发', '儿童发型'],
    portfolio: ['lucy_work1.jpg', 'lucy_work2.jpg', 'lucy_work3.jpg', 'lucy_work4.jpg', 'lucy_work5.jpg'],
    availability: {
      available: true,
      nextAvailableSlot: null
    }
  }
];

module.exports = {
  mockBookingData,
  mockTimeSlots,
  mockBarberData
};