const BookingRetrieval = require('../src/BookingRetrieval');
const BookingModification = require('../src/BookingModification');
const BookingCancellation = require('../src/BookingCancellation');
const TimeSlotSelector = require('../src/TimeSlotSelector');
const { mockBookingData } = require('./testUtils');

describe('US2: Booking Details Retrieval Method', () => {
  let bookingRetrieval;
  
  beforeEach(() => {
    bookingRetrieval = new BookingRetrieval();
    
    // Mock reservation in system
    bookingRetrieval.mockDatabase = {
      'BK123456': {
        customerName: 'John Doe',
        phoneNumber: '13800138000',
        barber: 'Tony',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T14:30:00',
        bookingNumber: 'BK123456'
      }
    };
  });
  
  test('should retrieve booking details when valid phone number and booking number are provided', async () => {
    const result = await bookingRetrieval.retrieveBooking({
      phoneNumber: '13800138000',
      bookingNumber: 'BK123456'
    });
    
    expect(result).toEqual({
      customerName: 'John Doe',
      phoneNumber: '13800138000',
      barber: 'Tony',
      serviceType: '剪发',
      appointmentTime: '2023-07-01T14:30:00',
      bookingNumber: 'BK123456'
    });
  });
  
  test('should return error when invalid booking number is provided', async () => {
    await expect(bookingRetrieval.retrieveBooking({
      phoneNumber: '13800138000',
      bookingNumber: 'INVALID'
    })).rejects.toThrow('预约号不存在');
  });
  
  test('should return error when phone number does not match booking record', async () => {
    await expect(bookingRetrieval.retrieveBooking({
      phoneNumber: '13900139000', // Different phone number
      bookingNumber: 'BK123456'
    })).rejects.toThrow('手机号与预约记录不匹配');
  });
  
  test('should validate phone number format during retrieval', async () => {
    await expect(bookingRetrieval.retrieveBooking({
      phoneNumber: '123', // Invalid format
      bookingNumber: 'BK123456'
    })).rejects.toThrow('手机号格式不正确');
  });
});

describe('US2: Booking Modification Rules', () => {
  let bookingModification;
  let timeSlotSelector;
  const originalBooking = {
    customerName: 'John Doe',
    phoneNumber: '13800138000',
    barber: 'Tony',
    serviceType: '剪发',
    appointmentTime: '2023-07-01T14:30:00',
    bookingNumber: 'BK123456'
  };
  
  beforeEach(() => {
    // Mock current time as 2023-07-01T10:00:00 (4.5 hours before appointment)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-01T10:00:00'));
    
    timeSlotSelector = new TimeSlotSelector({
      businessHours: { start: '09:00', end: '18:00' },
      bookedSlots: [
        '2023-07-01T11:00:00', // This slot is already booked by someone else
        '2023-07-01T11:30:00'
      ]
    });
    
    bookingModification = new BookingModification(timeSlotSelector);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should allow modification of appointment time when more than 2 hours before appointment', async () => {
    const modificationsRequest = {
      ...originalBooking,
      appointmentTime: '2023-07-01T16:30:00', // New time
    };
    
    const result = await bookingModification.modifyBooking(modificationsRequest);
    
    expect(result.appointmentTime).toBe('2023-07-01T16:30:00');
    expect(result.barber).toBe('Tony'); // Unchanged
  });
  
  test('should allow modification of barber when more than 2 hours before appointment', async () => {
    const modificationsRequest = {
      ...originalBooking,
      barber: 'Mike', // New barber
    };
    
    const result = await bookingModification.modifyBooking(modificationsRequest);
    
    expect(result.barber).toBe('Mike');
    expect(result.appointmentTime).toBe('2023-07-01T14:30:00'); // Unchanged
  });
  
  test('should not allow modification when less than 2 hours before appointment', async () => {
    // Change system time to be only 1 hour before appointment
    jest.setSystemTime(new Date('2023-07-01T13:30:00'));
    
    const modificationsRequest = {
      ...originalBooking,
      barber: 'Mike',
    };
    
    await expect(bookingModification.modifyBooking(modificationsRequest))
      .rejects.toThrow('预约前2小时内不能修改预约');
  });
  
  test('should validate availability when modifying appointment time', async () => {
    const modificationsRequest = {
      ...originalBooking,
      appointmentTime: '2023-07-01T11:00:00', // Already booked time slot
    };
    
    await expect(bookingModification.modifyBooking(modificationsRequest))
      .rejects.toThrow('所选时段已被预约');
  });
  
  test('should validate availability when modifying barber and keeping same time', async () => {
    // Mock that the new barber is already booked at the original time
    timeSlotSelector.barberBookings = {
      'Mike': ['2023-07-01T14:30:00'] // Original appointment time
    };
    
    const modificationsRequest = {
      ...originalBooking,
      barber: 'Mike',
    };
    
    await expect(bookingModification.modifyBooking(modificationsRequest))
      .rejects.toThrow('所选发型师在此时段已有预约');
  });
  
  test('should successfully modify both barber and time when both are available', async () => {
    const modificationsRequest = {
      ...originalBooking,
      barber: 'Mike',
      appointmentTime: '2023-07-01T15:00:00',
    };
    
    const result = await bookingModification.modifyBooking(modificationsRequest);
    
    expect(result.barber).toBe('Mike');
    expect(result.appointmentTime).toBe('2023-07-01T15:00:00');
  });
});

describe('US2: Booking Cancellation Requirement', () => {
  let bookingCancellation;
  const originalBooking = {
    customerName: 'John Doe',
    phoneNumber: '13800138000',
    barber: 'Tony',
    serviceType: '剪发',
    appointmentTime: '2023-07-01T14:30:00',
    bookingNumber: 'BK123456'
  };
  
  beforeEach(() => {
    bookingCancellation = new BookingCancellation();
  });
  
  test('should allow cancellation without providing a reason', async () => {
    const cancellationRequest = {
      bookingNumber: 'BK123456',
      phoneNumber: '13800138000'
    };
    
    const result = await bookingCancellation.cancelBooking(cancellationRequest);
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('已取消');
    expect(result.cancellationReason).toBeUndefined();
  });
  
  test('should store optional cancellation reason if provided', async () => {
    const cancellationRequest = {
      bookingNumber: 'BK123456',
      phoneNumber: '13800138000',
      cancellationReason: '个人安排有变'
    };
    
    const result = await bookingCancellation.cancelBooking(cancellationRequest);
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('已取消');
    expect(result.cancellationReason).toBe('个人安排有变');
  });
  
  test('should validate booking details before cancellation', async () => {
    const cancellationRequest = {
      bookingNumber: 'INVALID', // Invalid booking number
      phoneNumber: '13800138000'
    };
    
    await expect(bookingCancellation.cancelBooking(cancellationRequest))
      .rejects.toThrow('预约号不存在');
  });
  
  test('should validate phone number matches booking before cancellation', async () => {
    const cancellationRequest = {
      bookingNumber: 'BK123456',
      phoneNumber: '13900139000' // Different phone number
    };
    
    await expect(bookingCancellation.cancelBooking(cancellationRequest))
      .rejects.toThrow('手机号与预约记录不匹配');
  });
  
  test('should send cancellation confirmation after successful cancellation', async () => {
    // Mock the notification method
    bookingCancellation.sendCancellationConfirmation = jest.fn().mockResolvedValue(true);
    
    const cancellationRequest = {
      bookingNumber: 'BK123456',
      phoneNumber: '13800138000',
      cancellationReason: '个人安排有变'
    };
    
    await bookingCancellation.cancelBooking(cancellationRequest);
    
    expect(bookingCancellation.sendCancellationConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingNumber: 'BK123456',
        phoneNumber: '13800138000'
      })
    );
  });
});