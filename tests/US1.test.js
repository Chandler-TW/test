const BookingForm = require('../src/BookingForm');
const BookingConfirmation = require('../src/BookingConfirmation');
const TimeSlotSelector = require('../src/TimeSlotSelector');
const SMSNotification = require('../src/SMSNotification');
const { mockBookingData, mockTimeSlots } = require('./testUtils');

// Mock dependencies
jest.mock('../src/SMSNotification');

describe('US1: Booking Form Requirements', () => {
  let bookingForm;
  
  beforeEach(() => {
    bookingForm = new BookingForm();
    jest.clearAllMocks();
  });
  
  describe('Form validation', () => {
    test('should validate form with all required fields filled correctly', () => {
      const validData = {
        customerName: 'John Doe',
        phoneNumber: '13800138000',
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00'
      };
      
      expect(bookingForm.validateForm(validData)).toBe(true);
    });
    
    test('should reject form when customer name is missing', () => {
      const invalidData = {
        customerName: '',
        phoneNumber: '13800138000',
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00'
      };
      
      expect(bookingForm.validateForm(invalidData)).toBe(false);
      expect(bookingForm.getErrors()).toContain('客户姓名为必填项');
    });
    
    test('should reject form when phone number is missing', () => {
      const invalidData = {
        customerName: 'John Doe',
        phoneNumber: '',
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00'
      };
      
      expect(bookingForm.validateForm(invalidData)).toBe(false);
      expect(bookingForm.getErrors()).toContain('联系电话为必填项');
    });
    
    test('should reject form when phone number format is invalid', () => {
      const invalidData = {
        customerName: 'John Doe',
        phoneNumber: '123', // Invalid format
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00'
      };
      
      expect(bookingForm.validateForm(invalidData)).toBe(false);
      expect(bookingForm.getErrors()).toContain('联系电话格式不正确');
    });
    
    test('should reject form when barber is not selected', () => {
      const invalidData = {
        customerName: 'John Doe',
        phoneNumber: '13800138000',
        barber: '',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00'
      };
      
      expect(bookingForm.validateForm(invalidData)).toBe(false);
      expect(bookingForm.getErrors()).toContain('发型师选择为必选项');
    });
  });
  
  describe('Service type options', () => {
    test('should provide service type options including cut and color', () => {
      const serviceTypes = bookingForm.getServiceTypes();
      
      expect(serviceTypes).toContain('剪发');
      expect(serviceTypes).toContain('染发');
    });
  });
  
  describe('Appointment time selection', () => {
    test('should only allow time selection in 30-minute intervals', () => {
      const timeOptions = bookingForm.getTimeOptions('2023-07-01');
      
      // Check some random times to ensure 30-min intervals
      expect(timeOptions).toContain('09:00');
      expect(timeOptions).toContain('09:30');
      expect(timeOptions).toContain('10:00');
      expect(timeOptions).toContain('10:30');
      
      // Should not contain non-30-min intervals
      expect(timeOptions).not.toContain('09:15');
      expect(timeOptions).not.toContain('10:45');
    });
  });
});

describe('US1: Time Slot Exclusion Rules', () => {
  let timeSlotSelector;
  
  beforeEach(() => {
    timeSlotSelector = new TimeSlotSelector({
      businessHours: { start: '09:00', end: '18:00' },
      bookedSlots: [
        '2023-07-01T10:00:00',
        '2023-07-01T10:30:00',
        '2023-07-01T14:00:00'
      ]
    });
  });
  
  test('should exclude already booked time slots', () => {
    const availableSlots = timeSlotSelector.getAvailableSlots('2023-07-01');
    
    expect(availableSlots).not.toContainEqual({
      time: '10:00',
      available: true
    });
    expect(availableSlots).not.toContainEqual({
      time: '10:30',
      available: true
    });
  });
  
  test('should exclude non-business hours', () => {
    const availableSlots = timeSlotSelector.getAvailableSlots('2023-07-01');
    
    // Before business hours
    expect(availableSlots).not.toContainEqual({
      time: '08:00',
      available: true
    });
    
    // After business hours
    expect(availableSlots).not.toContainEqual({
      time: '18:30',
      available: true
    });
  });
  
  test('should exclude historical times', () => {
    // Mock current date to be 2023-07-01T12:00:00
    const realDateNow = Date.now;
    global.Date.now = jest.fn(() => new Date('2023-07-01T12:00:00').getTime());
    
    const availableSlots = timeSlotSelector.getAvailableSlots('2023-07-01');
    
    // Past times on the same day should be excluded
    expect(availableSlots).not.toContainEqual({
      time: '09:00',
      available: true
    });
    expect(availableSlots).not.toContainEqual({
      time: '11:30',
      available: true
    });
    
    // Future times on the same day should be available (if not booked)
    expect(availableSlots).toContainEqual({
      time: '12:30',
      available: true
    });
    
    // Restore original Date.now
    global.Date.now = realDateNow;
  });
  
  test('should not allow selection of past dates', () => {
    // Mock current date to be 2023-07-02
    const realDateNow = Date.now;
    global.Date.now = jest.fn(() => new Date('2023-07-02T12:00:00').getTime());
    
    expect(timeSlotSelector.isDateSelectable('2023-07-01')).toBe(false);
    expect(timeSlotSelector.isDateSelectable('2023-07-02')).toBe(true);
    expect(timeSlotSelector.isDateSelectable('2023-07-03')).toBe(true);
    
    // Restore original Date.now
    global.Date.now = realDateNow;
  });
});

describe('US1: Booking Confirmation Process', () => {
  let bookingConfirmation;
  let smsNotification;
  
  beforeEach(() => {
    bookingConfirmation = new BookingConfirmation();
    smsNotification = new SMSNotification();
    SMSNotification.mockClear();
  });
  
  test('should generate confirmation page with booking number after submission', async () => {
    const bookingData = {
      customerName: 'John Doe',
      phoneNumber: '13800138000',
      barber: 'Tony',
      serviceType: '剪发',
      appointmentTime: '2023-07-01T14:30:00'
    };
    
    const confirmation = await bookingConfirmation.generateConfirmation(bookingData);
    
    expect(confirmation.bookingNumber).toBeDefined();
    expect(confirmation.bookingNumber.length).toBeGreaterThanOrEqual(6);
    expect(confirmation.customerName).toBe('John Doe');
    expect(confirmation.appointmentTime).toBe('2023-07-01T14:30:00');
  });
  
  test('should send SMS notification after booking confirmation', async () => {
    const bookingData = {
      customerName: 'John Doe',
      phoneNumber: '13800138000',
      barber: 'Tony',
      serviceType: '剪发',
      appointmentTime: '2023-07-01T14:30:00'
    };
    
    const confirmation = await bookingConfirmation.generateConfirmation(bookingData);
    
    expect(SMSNotification).toHaveBeenCalledTimes(1);
    expect(SMSNotification.mock.instances[0].sendBookingConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: '13800138000',
        bookingNumber: confirmation.bookingNumber
      })
    );
  });
  
  test('should include all booking details in the confirmation page', async () => {
    const bookingData = {
      customerName: 'John Doe',
      phoneNumber: '13800138000',
      barber: 'Tony',
      serviceType: '剪发',
      appointmentTime: '2023-07-01T14:30:00'
    };
    
    const confirmation = await bookingConfirmation.generateConfirmation(bookingData);
    
    expect(confirmation).toEqual(
      expect.objectContaining({
        customerName: 'John Doe',
        phoneNumber: '13800138000',
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00',
        bookingNumber: expect.any(String)
      })
    );
  });
});