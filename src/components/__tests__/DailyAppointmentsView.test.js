import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyAppointmentsView from '../DailyAppointmentsView';
import { getDailyAppointments, updateAppointmentStatus } from '../../services/appointmentService';

// Mock the services
jest.mock('../../services/appointmentService');

describe('DailyAppointmentsView Component', () => {
  // Mock data
  const mockStylists = [
    { id: 101, name: 'Emma Wang', nickname: 'Emma' },
    { id: 102, name: 'Jason Chen', nickname: 'Jay' },
    { id: 103, name: 'Sophie Lin', nickname: 'Sophie' },
  ];
  
  const mockAppointments = [
    {
      id: 'A001',
      code: 'XYZ001',
      customerName: 'John Doe',
      customerPhone: '13912345678',
      notes: 'Please use organic products',
      serviceId: 1,
      serviceName: 'Haircut',
      stylistId: 101,
      stylistName: 'Emma Wang',
      date: '2023-06-01',
      time: '10:00',
      status: 'not_arrived', // Possible values: not_arrived, in_progress, completed
      duration: 30,
    },
    {
      id: 'A002',
      code: 'XYZ002',
      customerName: 'Jane Smith',
      customerPhone: '13987654321',
      notes: '',
      serviceId: 2,
      serviceName: 'Hair Coloring',
      stylistId: 102,
      stylistName: 'Jason Chen',
      date: '2023-06-01',
      time: '11:00',
      status: 'in_progress',
      duration: 120,
    },
    {
      id: 'A003',
      code: 'XYZ003',
      customerName: 'David Wang',
      customerPhone: '13511223344',
      notes: 'First time customer',
      serviceId: 1,
      serviceName: 'Haircut',
      stylistId: 101,
      stylistName: 'Emma Wang',
      date: '2023-06-01',
      time: '14:00', // This appointment is upcoming (within 15 minutes of current time in tests)
      status: 'not_arrived',
      duration: 30,
    },
    {
      id: 'A004',
      code: 'XYZ004',
      customerName: 'Lucy Liu',
      customerPhone: '13566778899',
      notes: 'Wants to discuss perm options for next time',
      serviceId: 1,
      serviceName: 'Haircut',
      stylistId: 103,
      stylistName: 'Sophie Lin',
      date: '2023-06-01',
      time: '16:30',
      status: 'completed',
      duration: 30,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock system time to be 13:45 on June 1, 2023
    // This makes the 14:00 appointment (A003) an upcoming appointment
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-06-01T13:45:00'));
    
    // Default mock implementation
    getDailyAppointments.mockResolvedValue({
      date: '2023-06-01',
      stylists: mockStylists,
      appointments: mockAppointments
    });
    
    updateAppointmentStatus.mockImplementation((appointmentId, newStatus) => {
      return Promise.resolve({
        success: true,
        appointment: {
          ...mockAppointments.find(a => a.id === appointmentId),
          status: newStatus
        }
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test case 1: Render appointments on a timeline with correct status labels
  test('displays appointments on a timeline with appropriate status labels', async () => {
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      // Check that all appointments are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('David Wang')).toBeInTheDocument();
      expect(screen.getByText('Lucy Liu')).toBeInTheDocument();
      
      // Check that status labels are correctly displayed
      expect(screen.getByText('Not Arrived')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
    
    // Check that items are arranged in chronological order
    const timeSlots = screen.getAllByTestId('appointment-time');
    expect(timeSlots[0]).toHaveTextContent('10:00');
    expect(timeSlots[1]).toHaveTextContent('11:00');
    expect(timeSlots[2]).toHaveTextContent('14:00');
    expect(timeSlots[3]).toHaveTextContent('16:30');
  });

  // Test case 2: Filter appointments by stylist
  test('filters appointments when a stylist is selected', async () => {
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      // All appointments should be visible initially
      expect(screen.getAllByTestId('appointment-item').length).toBe(4);
    });
    
    // Select a stylist filter (Emma)
    const stylistSelect = screen.getByLabelText(/filter by stylist/i);
    fireEvent.change(stylistSelect, { target: { value: '101' } }); // Emma's ID
    
    // Only Emma's appointments should be visible
    await waitFor(() => {
      const appointmentItems = screen.getAllByTestId('appointment-item');
      expect(appointmentItems.length).toBe(2); // Emma has 2 appointments
      
      // Check that they're the right appointments
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('David Wang')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument(); // Not Emma's
      expect(screen.queryByText('Lucy Liu')).not.toBeInTheDocument(); // Not Emma's
    });
    
    // Change filter to Jason
    fireEvent.change(stylistSelect, { target: { value: '102' } }); // Jason's ID
    
    // Only Jason's appointments should be visible
    await waitFor(() => {
      const appointmentItems = screen.getAllByTestId('appointment-item');
      expect(appointmentItems.length).toBe(1); // Jason has 1 appointment
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
    
    // Reset filter (all stylists)
    fireEvent.change(stylistSelect, { target: { value: '' } });
    
    // All appointments should be visible again
    await waitFor(() => {
      expect(screen.getAllByTestId('appointment-item').length).toBe(4);
    });
  });

  // Test case 3: View appointment details when clicking on an appointment
  test('shows customer notes and detailed information when clicking on an appointment', async () => {
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      // Find John Doe's appointment and click on it
      const johnDoeAppointment = screen.getByText('John Doe').closest('[data-testid="appointment-item"]');
      fireEvent.click(johnDoeAppointment);
    });
    
    // Detailed info should be shown in a modal or detail panel
    await waitFor(() => {
      // Check for appointment details
      expect(screen.getByText(/appointment code/i)).toBeInTheDocument();
      expect(screen.getByText('XYZ001')).toBeInTheDocument(); // Appt code
      
      // Check for customer info
      expect(screen.getByText(/customer phone/i)).toBeInTheDocument();
      expect(screen.getByText('13912345678')).toBeInTheDocument();
      
      // Check for notes
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
      expect(screen.getByText('Please use organic products')).toBeInTheDocument();
      
      // Check for service and stylist info
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Emma Wang')).toBeInTheDocument();
    });
    
    // Close the details view
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // Detail view should be closed
    await waitFor(() => {
      expect(screen.queryByText(/appointment code/i)).not.toBeInTheDocument();
    });
  });

  // Test case 4: Highlight upcoming appointments
  test('automatically highlights appointments that are coming up within 15 minutes', async () => {
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      // David Wang's 14:00 appointment should be highlighted (current time is 13:45)
      const davidAppointment = screen.getByText('David Wang').closest('[data-testid="appointment-item"]');
      expect(davidAppointment).toHaveClass('upcoming'); // assuming 'upcoming' class is used
    });
    
    // Other appointments should not be highlighted
    const johnAppointment = screen.getByText('John Doe').closest('[data-testid="appointment-item"]');
    const janeAppointment = screen.getByText('Jane Smith').closest('[data-testid="appointment-item"]');
    const lucyAppointment = screen.getByText('Lucy Liu').closest('[data-testid="appointment-item"]');
    
    expect(johnAppointment).not.toHaveClass('upcoming');
    expect(janeAppointment).not.toHaveClass('upcoming');
    expect(lucyAppointment).not.toHaveClass('upcoming');
  });

  // Test case 5: Update appointment status
  test('allows updating the status of an appointment', async () => {
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      // Find John Doe's appointment (status: not_arrived) and click on it
      const johnDoeAppointment = screen.getByText('John Doe').closest('[data-testid="appointment-item"]');
      fireEvent.click(johnDoeAppointment);
    });
    
    // In the detail view, change the status to "in_progress"
    const statusDropdown = screen.getByLabelText(/change status/i);
    fireEvent.change(statusDropdown, { target: { value: 'in_progress' } });
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    
    // Check that the service was called with correct parameters
    expect(updateAppointmentStatus).toHaveBeenCalledWith('A001', 'in_progress');
    
    // After update, status should be reflected in the UI
    await waitFor(() => {
      // Close the modal if still open
      const closeButton = screen.queryByRole('button', { name: /close/i });
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      // Check that the status label is updated
      const johnDoeAppointment = screen.getByText('John Doe').closest('[data-testid="appointment-item"]');
      const statusLabel = johnDoeAppointment.querySelector('.status-label');
      expect(statusLabel).toHaveTextContent('In Progress');
    });
  });

  // Test case 6: Real-time updates
  test('updates the view when new appointments data is received', async () => {
    // Set up mock polling for real-time updates
    const originalGetDailyAppointments = getDailyAppointments;
    const updatedAppointments = [...mockAppointments];
    
    // Simulate a new appointment being added
    const newAppointment = {
      id: 'A005',
      code: 'XYZ005',
      customerName: 'New Customer',
      customerPhone: '13500001111',
      notes: 'Last minute booking',
      serviceId: 1,
      serviceName: 'Haircut',
      stylistId: 102,
      stylistName: 'Jason Chen',
      date: '2023-06-01',
      time: '17:30',
      status: 'not_arrived',
      duration: 30,
    };
    
    // Mock implementation that returns updated data after first call
    let callCount = 0;
    getDailyAppointments.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          date: '2023-06-01',
          stylists: mockStylists,
          appointments: mockAppointments
        });
      } else {
        return Promise.resolve({
          date: '2023-06-01',
          stylists: mockStylists,
          appointments: [...mockAppointments, newAppointment]
        });
      }
    });
    
    render(<DailyAppointmentsView refreshInterval={1000} />); // Set poll interval to 1 second
    
    // Initial render should show 4 appointments
    await waitFor(() => {
      expect(screen.getAllByTestId('appointment-item').length).toBe(4);
    });
    
    // Fast-forward time by 1 second to trigger the polling
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // After polling update, should show 5 appointments
    await waitFor(() => {
      expect(screen.getAllByTestId('appointment-item').length).toBe(5);
      expect(screen.getByText('New Customer')).toBeInTheDocument();
    });
  });

  // Test case 7: No appointments view
  test('shows appropriate message when there are no appointments for the day', async () => {
    // Mock empty appointments list
    getDailyAppointments.mockResolvedValue({
      date: '2023-06-01',
      stylists: mockStylists,
      appointments: []
    });
    
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      expect(screen.getByText(/no appointments scheduled/i)).toBeInTheDocument();
    });
  });

  // Test case 8: Error handling
  test('shows error message when appointments cannot be loaded', async () => {
    // Mock API error
    getDailyAppointments.mockRejectedValue(new Error('Network error'));
    
    render(<DailyAppointmentsView />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading appointments/i)).toBeInTheDocument();
    });
  });

  // Test case 9: Date selection changes appointments view
  test('loads new appointments when selected date is changed', async () => {
    // First call is for current date, second call will be for a new date
    getDailyAppointments.mockImplementationOnce(() => 
      Promise.resolve({
        date: '2023-06-01',
        stylists: mockStylists,
        appointments: mockAppointments
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        date: '2023-06-02',
        stylists: mockStylists,
        appointments: [
          {
            id: 'B001',
            code: 'XYZ101',
            customerName: 'Tomorrow Customer',
            customerPhone: '13500009999',
            notes: 'For tomorrow',
            serviceId: 1,
            serviceName: 'Haircut',
            stylistId: 101,
            stylistName: 'Emma Wang',
            date: '2023-06-02',
            time: '10:30',
            status: 'not_arrived',
            duration: 30,
          }
        ]
      })
    );
    
    render(<DailyAppointmentsView />);
    
    // Verify initial appointments are loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Change the date to tomorrow
    const datePicker = screen.getByLabelText(/select date/i);
    fireEvent.change(datePicker, { target: { value: '2023-06-02' } });
    
    // Should load new appointments for tomorrow
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Tomorrow Customer')).toBeInTheDocument();
    });
  });
});