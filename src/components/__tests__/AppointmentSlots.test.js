import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentSlots from '../AppointmentSlots';
import { getAvailableSlots } from '../../services/appointmentService';

// Mock the service
jest.mock('../../services/appointmentService');

describe('AppointmentSlots Component', () => {
  const mockAvailableDates = [
    { date: '2023-06-01', isOpen: true },
    { date: '2023-06-02', isOpen: true },
    { date: '2023-06-03', isOpen: true },
    { date: '2023-06-04', isOpen: false }, // Shop closure day
    { date: '2023-06-05', isOpen: true },
    { date: '2023-06-06', isOpen: true },
    { date: '2023-06-07', isOpen: true },
  ];

  const mockTimeSlots = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false }, // Booked slot
    { time: '10:30', available: true },
    // More slots would be here in reality
    { time: '19:30', available: true },
  ];

  const mockServices = [
    { id: 1, name: 'Haircut', duration: 30 },
    { id: 2, name: 'Hair Coloring', duration: 120 },
    { id: 3, name: 'Perm', duration: 180 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    getAvailableSlots.mockResolvedValue({
      dates: mockAvailableDates,
      timeSlots: mockTimeSlots,
    });
    
    // Mock date to ensure consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-06-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test case 1: Display available appointment dates for the next 7 days
  test('displays available appointment dates for the next 7 days excluding shop closure days', async () => {
    render(<AppointmentSlots />);
    
    await waitFor(() => {
      mockAvailableDates.forEach(dateInfo => {
        if (dateInfo.isOpen) {
          expect(screen.getByText(new RegExp(dateInfo.date))).toBeInTheDocument();
        } else {
          const closedDate = screen.queryByText(new RegExp(dateInfo.date));
          if (closedDate) {
            expect(closedDate).toHaveClass('closed-day');
          } else {
            // Alternative if the closed day is not rendered at all
            expect(screen.queryByText(new RegExp(dateInfo.date))).not.toBeInTheDocument();
          }
        }
      });
    });
  });

  // Test case 2: Show time slots from 9:00-20:00 with 30-minute intervals
  test('shows time slots from 9:00 to 20:00 with 30-minute intervals', async () => {
    render(<AppointmentSlots />);
    
    // Select a date first to view time slots
    await waitFor(() => {
      const firstAvailableDate = screen.getByText(new RegExp(mockAvailableDates[0].date));
      fireEvent.click(firstAvailableDate);
    });
    
    // Check for some key time slots
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.getByText('19:30')).toBeInTheDocument();
    
    // Verify the 30-minute interval pattern by checking a few slots
    const timeSlots = screen.getAllByTestId('time-slot');
    expect(timeSlots.length).toBeGreaterThanOrEqual(22); // At least 22 slots (9:00-20:00)
  });

  // Test case 3: Display booked slots as non-selectable (gray)
  test('displays booked slots as non-selectable (gray)', async () => {
    render(<AppointmentSlots />);
    
    // Select a date first to view time slots
    await waitFor(() => {
      const firstAvailableDate = screen.getByText(new RegExp(mockAvailableDates[0].date));
      fireEvent.click(firstAvailableDate);
    });
    
    // Find the booked time slot (10:00 in our mock data)
    const bookedSlot = screen.getByText('10:00').closest('[data-testid="time-slot"]');
    
    // Check if it has the correct styling or class indicating it's non-selectable
    expect(bookedSlot).toHaveClass('booked'); // assuming 'booked' class is used
    expect(bookedSlot).toHaveAttribute('aria-disabled', 'true');
  });

  // Test case 4: Support filtering available time slots by service type
  test('filters available time slots based on service type selection', async () => {
    getAvailableSlots.mockImplementation((date, serviceId) => {
      // Different time slot availability based on service type
      let filteredTimeSlots = [...mockTimeSlots];
      
      if (serviceId === 2) { // Hair Coloring (120 min)
        // Fewer slots available for longer services
        filteredTimeSlots = filteredTimeSlots.filter((_, index) => index % 4 === 0);
      } else if (serviceId === 3) { // Perm (180 min)
        // Even fewer slots for the longest service
        filteredTimeSlots = filteredTimeSlots.filter((_, index) => index % 6 === 0);
      }
      
      return Promise.resolve({
        dates: mockAvailableDates,
        timeSlots: filteredTimeSlots
      });
    });

    render(<AppointmentSlots services={mockServices} />);
    
    // Select a date first
    await waitFor(() => {
      const firstAvailableDate = screen.getByText(new RegExp(mockAvailableDates[0].date));
      fireEvent.click(firstAvailableDate);
    });
    
    // Initial service (haircut) should show many time slots
    const initialSlots = screen.getAllByTestId('time-slot');
    const initialCount = initialSlots.length;
    
    // Select the hair coloring service
    const serviceSelect = screen.getByLabelText(/service type/i);
    userEvent.selectOptions(serviceSelect, '2'); // Hair Coloring
    
    await waitFor(() => {
      // Should have fewer slots available for longer service
      const coloringSlots = screen.getAllByTestId('time-slot');
      expect(coloringSlots.length).toBeLessThan(initialCount);
    });
    
    // Select the perm service
    userEvent.selectOptions(serviceSelect, '3'); // Perm
    
    await waitFor(() => {
      // Should have even fewer slots available for the longest service
      const permSlots = screen.getAllByTestId('time-slot');
      expect(permSlots.length).toBeLessThan(initialCount);
    });
  });

  // Test case 5: Time slot selection works correctly
  test('allows selection of available time slot', async () => {
    const onSlotSelect = jest.fn();
    render(<AppointmentSlots onSlotSelect={onSlotSelect} />);
    
    // Select a date first
    await waitFor(() => {
      const firstAvailableDate = screen.getByText(new RegExp(mockAvailableDates[0].date));
      fireEvent.click(firstAvailableDate);
    });
    
    // Find an available time slot (9:00 in our mock data)
    const availableSlot = screen.getByText('09:00').closest('[data-testid="time-slot"]');
    
    // Click on the available slot
    fireEvent.click(availableSlot);
    
    // Check if the slot selection callback was called with correct data
    expect(onSlotSelect).toHaveBeenCalledWith({
      date: mockAvailableDates[0].date,
      time: '09:00'
    });
  });

  // Test case 6: Cannot select booked slots
  test('prevents selection of booked time slots', async () => {
    const onSlotSelect = jest.fn();
    render(<AppointmentSlots onSlotSelect={onSlotSelect} />);
    
    // Select a date first
    await waitFor(() => {
      const firstAvailableDate = screen.getByText(new RegExp(mockAvailableDates[0].date));
      fireEvent.click(firstAvailableDate);
    });
    
    // Find the booked time slot (10:00 in our mock data)
    const bookedSlot = screen.getByText('10:00').closest('[data-testid="time-slot"]');
    
    // Try to click on the booked slot
    fireEvent.click(bookedSlot);
    
    // Callback should not be called for booked slots
    expect(onSlotSelect).not.toHaveBeenCalled();
  });
});