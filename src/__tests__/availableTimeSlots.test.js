import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import AvailableTimeSlots from '../components/AvailableTimeSlots';

// Mock services
jest.mock('../services/appointmentService', () => ({
  getAvailableDates: jest.fn(),
  getAvailableTimeSlots: jest.fn(),
  getServiceTypes: jest.fn()
}));

import { getAvailableDates, getAvailableTimeSlots, getServiceTypes } from '../services/appointmentService';

describe('AvailableTimeSlots Component', () => {
  // Setup mock data
  const mockAvailableDates = [
    '2023-07-01',
    '2023-07-02',
    '2023-07-03',
    '2023-07-05',
    '2023-07-06',
    '2023-07-07',
    '2023-07-08'
  ]; // Note: July 4th is excluded as a shop holiday
  
  const mockTimeSlots = {
    '2023-07-01': [
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: false }, // booked
      { time: '10:30', available: true },
      // ... more time slots
    ]
  };
  
  const mockServiceTypes = [
    { id: 1, name: '剪发', duration: 30 },
    { id: 2, name: '染发', duration: 120 },
    { id: 3, name: '烫发', duration: 180 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementation of service functions
    getAvailableDates.mockResolvedValue(mockAvailableDates);
    getAvailableTimeSlots.mockResolvedValue(mockTimeSlots);
    getServiceTypes.mockResolvedValue(mockServiceTypes);
  });

  test('should display next 7 available dates excluding shop holidays', async () => {
    render(<AvailableTimeSlots />);
    
    await waitFor(() => {
      expect(getAvailableDates).toHaveBeenCalled();
    });
    
    // Check if all 7 available dates are displayed
    mockAvailableDates.forEach(date => {
      const formattedDate = moment(date).format('MM/DD');
      expect(screen.getByText(new RegExp(formattedDate))).toBeInTheDocument();
    });
    
    // Ensure shop holiday is not displayed
    const holidayDate = moment('2023-07-04').format('MM/DD');
    expect(screen.queryByText(new RegExp(holidayDate))).not.toBeInTheDocument();
  });

  test('should display time slots from 9:00 to 20:00 with 30-minute intervals', async () => {
    render(<AvailableTimeSlots />);
    
    // Select a date to view time slots
    await waitFor(() => {
      expect(screen.getByText(/07\/01/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/07\/01/));
    
    await waitFor(() => {
      expect(getAvailableTimeSlots).toHaveBeenCalledWith('2023-07-01', undefined);
    });
    
    // Check if time slots are displayed with correct intervals
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    // ... more assertions for time slots
    expect(screen.getByText('19:30')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  test('should display booked time slots as disabled (gray)', async () => {
    render(<AvailableTimeSlots />);
    
    // Select a date to view time slots
    await waitFor(() => {
      expect(screen.getByText(/07\/01/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/07\/01/));
    
    await waitFor(() => {
      expect(getAvailableTimeSlots).toHaveBeenCalled();
    });
    
    // Check if booked time slot is disabled
    const bookedTimeSlot = screen.getByText('10:00').closest('button');
    expect(bookedTimeSlot).toHaveAttribute('disabled');
    expect(bookedTimeSlot).toHaveClass('disabled'); // Assuming 'disabled' class for gray appearance
    
    // Check if available time slot is not disabled
    const availableTimeSlot = screen.getByText('09:00').closest('button');
    expect(availableTimeSlot).not.toHaveAttribute('disabled');
    expect(availableTimeSlot).not.toHaveClass('disabled');
  });

  test('should filter time slots based on selected service type', async () => {
    render(<AvailableTimeSlots />);
    
    // Wait for service types to load
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Service type select should be available
    const serviceTypeSelect = screen.getByLabelText(/服务类型/i);
    expect(serviceTypeSelect).toBeInTheDocument();
    
    // Select a service type (染发 - 120min duration)
    userEvent.selectOptions(serviceTypeSelect, '2');
    
    // Select a date
    fireEvent.click(screen.getByText(/07\/01/));
    
    // Verify getAvailableTimeSlots was called with correct service type
    await waitFor(() => {
      expect(getAvailableTimeSlots).toHaveBeenCalledWith('2023-07-01', 2);
    });
    
    // Mock the response for a specific service type
    const mockFilteredTimeSlots = {
      '2023-07-01': [
        { time: '09:00', available: true },
        { time: '09:30', available: false }, // Not enough time for 染发 (2h)
        { time: '10:00', available: false }, // booked
        { time: '10:30', available: false }, // Not available due to previous service
      ]
    };
    
    getAvailableTimeSlots.mockResolvedValue(mockFilteredTimeSlots);
    
    // Re-select to trigger new data fetch
    fireEvent.click(screen.getByText(/07\/01/));
    
    await waitFor(() => {
      const availableSlot = screen.getByText('09:00').closest('button');
      expect(availableSlot).not.toHaveAttribute('disabled');
      
      const notAvailableSlot = screen.getByText('09:30').closest('button');
      expect(notAvailableSlot).toHaveAttribute('disabled');
    });
  });
});