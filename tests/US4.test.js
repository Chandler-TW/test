const BookingDashboard = require('../src/BookingDashboard');
const { mockBookingData } = require('./testUtils');

describe('US4: Booking Dashboard Details', () => {
  let bookingDashboard;
  
  beforeEach(() => {
    // Sample bookings data for testing
    const bookings = [
      {
        id: 'BK123456',
        customerName: 'John Doe',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T10:00:00',
        status: 'pending' // 待确认
      },
      {
        id: 'BK123457',
        customerName: 'Jane Smith',
        serviceType: '染发',
        appointmentTime: '2023-07-01T11:00:00',
        status: 'completed' // 已完成
      },
      {
        id: 'BK123458',
        customerName: 'Bob Johnson',
        serviceType: '烫发',
        appointmentTime: '2023-07-01T14:00:00',
        status: 'canceled', // 已取消
        cancellationReason: '个人安排有变'
      },
      {
        id: 'BK123459',
        customerName: 'Alice Brown',
        serviceType: '剪发',
        appointmentTime: '2023-07-02T10:00:00', // Next day
        status: 'pending'
      }
    ];
    
    bookingDashboard = new BookingDashboard(bookings);
  });
  
  test('should display booking list for current day by default', () => {
    // Mock today as 2023-07-01
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-01T00:00:00'));
    
    const todayBookings = bookingDashboard.getTodayBookings();
    
    expect(todayBookings.length).toBe(3); // Should exclude next day booking
    expect(todayBookings[0].id).toBe('BK123456');
    expect(todayBookings[1].id).toBe('BK123457');
    expect(todayBookings[2].id).toBe('BK123458');
    
    jest.useRealTimers();
  });
  
  test('should display customer name for each booking', () => {
    const todayBookings = bookingDashboard.getBookingsByDate('2023-07-01');
    
    expect(todayBookings[0].customerName).toBe('John Doe');
    expect(todayBookings[1].customerName).toBe('Jane Smith');
    expect(todayBookings[2].customerName).toBe('Bob Johnson');
  });
  
  test('should display service type for each booking', () => {
    const todayBookings = bookingDashboard.getBookingsByDate('2023-07-01');
    
    expect(todayBookings[0].serviceType).toBe('剪发');
    expect(todayBookings[1].serviceType).toBe('染发');
    expect(todayBookings[2].serviceType).toBe('烫发');
  });
  
  test('should display appointment time for each booking', () => {
    const todayBookings = bookingDashboard.getBookingsByDate('2023-07-01');
    
    expect(todayBookings[0].appointmentTime).toBe('2023-07-01T10:00:00');
    expect(todayBookings[1].appointmentTime).toBe('2023-07-01T11:00:00');
    expect(todayBookings[2].appointmentTime).toBe('2023-07-01T14:00:00');
  });
  
  test('should display status for each booking', () => {
    const todayBookings = bookingDashboard.getBookingsByDate('2023-07-01');
    
    expect(todayBookings[0].status).toBe('pending'); // 待确认
    expect(todayBookings[1].status).toBe('completed'); // 已完成
    expect(todayBookings[2].status).toBe('canceled'); // 已取消
  });
  
  test('should allow filtering bookings by status', () => {
    const pendingBookings = bookingDashboard.getBookingsByStatus('pending');
    const completedBookings = bookingDashboard.getBookingsByStatus('completed');
    const canceledBookings = bookingDashboard.getBookingsByStatus('canceled');
    
    expect(pendingBookings.length).toBe(2);
    expect(pendingBookings[0].id).toBe('BK123456');
    expect(pendingBookings[1].id).toBe('BK123459');
    
    expect(completedBookings.length).toBe(1);
    expect(completedBookings[0].id).toBe('BK123457');
    
    expect(canceledBookings.length).toBe(1);
    expect(canceledBookings[0].id).toBe('BK123458');
  });
  
  test('should allow filtering bookings by date range', () => {
    const bookingsInRange = bookingDashboard.getBookingsByDateRange('2023-07-01', '2023-07-02');
    
    expect(bookingsInRange.length).toBe(4);
  });
  
  test('should sort bookings by appointment time by default', () => {
    // Add a booking with earlier time but later insertion
    bookingDashboard.addBooking({
      id: 'BK123460',
      customerName: 'Early Bird',
      serviceType: '剪发',
      appointmentTime: '2023-07-01T09:00:00', // Earliest time
      status: 'pending'
    });
    
    const todayBookings = bookingDashboard.getBookingsByDate('2023-07-01');
    
    // Should be sorted by time regardless of insertion order
    expect(todayBookings[0].id).toBe('BK123460'); // 09:00
    expect(todayBookings[1].id).toBe('BK123456'); // 10:00
    expect(todayBookings[2].id).toBe('BK123457'); // 11:00
    expect(todayBookings[3].id).toBe('BK123458'); // 14:00
  });
  
  test('should allow updating booking status', () => {
    const bookingId = 'BK123456';
    const initialStatus = bookingDashboard.getBookingById(bookingId).status;
    expect(initialStatus).toBe('pending');
    
    bookingDashboard.updateBookingStatus(bookingId, 'completed');
    
    const updatedStatus = bookingDashboard.getBookingById(bookingId).status;
    expect(updatedStatus).toBe('completed');
  });
  
  test('should allow searching bookings by customer name', () => {
    const searchResults = bookingDashboard.searchBookings('John');
    
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].id).toBe('BK123456');
    expect(searchResults[0].customerName).toBe('John Doe');
  });
  
  test('should provide booking counts by status', () => {
    const statusCounts = bookingDashboard.getBookingCountsByStatus();
    
    expect(statusCounts.pending).toBe(2);
    expect(statusCounts.completed).toBe(1);
    expect(statusCounts.canceled).toBe(1);
  });
  
  test('should allow exporting dashboard data', () => {
    const exportData = bookingDashboard.exportBookingData('2023-07-01');
    
    expect(exportData).toEqual([
      {
        bookingId: 'BK123456',
        customerName: 'John Doe',
        serviceType: '剪发',
        appointmentTime: '2023-07-01T10:00:00',
        status: 'pending'
      },
      {
        bookingId: 'BK123457',
        customerName: 'Jane Smith',
        serviceType: '染发',
        appointmentTime: '2023-07-01T11:00:00',
        status: 'completed'
      },
      {
        bookingId: 'BK123458',
        customerName: 'Bob Johnson',
        serviceType: '烫发',
        appointmentTime: '2023-07-01T14:00:00',
        status: 'canceled',
        cancellationReason: '个人安排有变'
      }
    ]);
  });
});