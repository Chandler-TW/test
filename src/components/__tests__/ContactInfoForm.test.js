import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactInfoForm from '../ContactInfoForm';
import { submitAppointment, sendSmsNotification } from '../../services/appointmentService';

// Mock the services
jest.mock('../../services/appointmentService');

describe('ContactInfoForm Component', () => {
  const mockAppointmentDetails = {
    serviceId: 1,
    serviceName: 'Haircut',
    stylistId: 101,
    stylistName: 'Emma Wang',
    date: '2023-06-01',
    time: '10:30',
  };

  const mockValidContactInfo = {
    name: 'John Doe',
    phoneNumber: '13912345678',
    notes: 'Please cut my hair short'
  };

  const mockAppointmentConfirmation = {
    appointmentId: 'ABC123',
    appointmentCode: 'XYZ789',
    appointmentDetails: {
      ...mockAppointmentDetails,
      customerName: mockValidContactInfo.name,
      customerPhone: mockValidContactInfo.phoneNumber,
      customerNotes: mockValidContactInfo.notes,
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    submitAppointment.mockResolvedValue(mockAppointmentConfirmation);
    sendSmsNotification.mockResolvedValue({ success: true, messageId: 'SMS123' });
  });

  // Test case 1: Form renders with required fields
  test('renders form with required fields and optional notes', () => {
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    // Check that required fields exist
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    
    // Check that notes field exists and is marked optional
    const notesField = screen.getByLabelText(/notes/i);
    expect(notesField).toBeInTheDocument();
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
    
    // Check that submit button exists
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  // Test case 2: Phone number validation - valid input
  test('validates phone number format correctly with valid input', async () => {
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    const phoneInput = screen.getByLabelText(/phone/i);
    
    // Test valid phone numbers (11 digits)
    await userEvent.type(phoneInput, '13912345678');
    
    // Should not show validation error
    expect(screen.queryByText(/invalid phone number/i)).not.toBeInTheDocument();
  });

  // Test case 3: Phone number validation - invalid inputs
  test('shows validation error for invalid phone number formats', async () => {
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    const phoneInput = screen.getByLabelText(/phone/i);
    const submitButton = screen.getByRole('button', { name: /confirm/i });
    
    // Test too short (10 digits)
    await userEvent.type(phoneInput, '1391234567');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/phone number must be 11 digits/i)).toBeInTheDocument();
    });
    
    // Clear and test too long (12 digits)
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '139123456789');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/phone number must be 11 digits/i)).toBeInTheDocument();
    });
    
    // Clear and test non-numeric characters
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '1391234567a');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/phone number must contain only digits/i)).toBeInTheDocument();
    });
  });

  // Test case 4: Required fields validation
  test('validates required fields on form submission', async () => {
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    const submitButton = screen.getByRole('button', { name: /confirm/i });
    
    // Try to submit with empty fields
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    });
    
    // Fill only name field
    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    });
  });

  // Test case 5: Successful form submission
  test('successfully submits form with valid data and shows confirmation page', async () => {
    const mockOnSuccess = jest.fn();
    render(
      <ContactInfoForm 
        appointmentDetails={mockAppointmentDetails} 
        onSubmitSuccess={mockOnSuccess}
      />
    );
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/name/i), mockValidContactInfo.name);
    await userEvent.type(screen.getByLabelText(/phone/i), mockValidContactInfo.phoneNumber);
    await userEvent.type(screen.getByLabelText(/notes/i), mockValidContactInfo.notes);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    await waitFor(() => {
      // Check that submitAppointment was called with correct data
      expect(submitAppointment).toHaveBeenCalledWith({
        ...mockAppointmentDetails,
        customerName: mockValidContactInfo.name,
        customerPhone: mockValidContactInfo.phoneNumber,
        customerNotes: mockValidContactInfo.notes,
      });
      
      // Check that onSubmitSuccess was called with confirmation data
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAppointmentConfirmation);
    });
  });

  // Test case 6: SMS notification is sent after successful submission
  test('sends SMS notification after successful form submission', async () => {
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/name/i), mockValidContactInfo.name);
    await userEvent.type(screen.getByLabelText(/phone/i), mockValidContactInfo.phoneNumber);
    await userEvent.type(screen.getByLabelText(/notes/i), mockValidContactInfo.notes);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    await waitFor(() => {
      // Check that sendSmsNotification was called with the phone number and appointment details
      expect(sendSmsNotification).toHaveBeenCalledWith(
        mockValidContactInfo.phoneNumber,
        expect.objectContaining({
          appointmentCode: mockAppointmentConfirmation.appointmentCode,
          serviceName: mockAppointmentDetails.serviceName,
          stylistName: mockAppointmentDetails.stylistName,
          date: mockAppointmentDetails.date,
          time: mockAppointmentDetails.time,
        })
      );
    });
  });

  // Test case 7: Display error when form submission fails
  test('shows error message when form submission fails', async () => {
    // Mock a failed submission
    submitAppointment.mockRejectedValue(new Error('Network error'));
    
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/name/i), mockValidContactInfo.name);
    await userEvent.type(screen.getByLabelText(/phone/i), mockValidContactInfo.phoneNumber);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/failed to submit appointment/i)).toBeInTheDocument();
    });
    
    // SMS should not be sent when form submission fails
    expect(sendSmsNotification).not.toHaveBeenCalled();
  });

  // Test case 8: Display error when SMS notification fails
  test('shows warning when SMS notification fails but appointment is created', async () => {
    // Mock successful submission but failed SMS
    sendSmsNotification.mockRejectedValue(new Error('SMS service unavailable'));
    
    const mockOnSuccess = jest.fn();
    render(
      <ContactInfoForm 
        appointmentDetails={mockAppointmentDetails} 
        onSubmitSuccess={mockOnSuccess}
      />
    );
    
    // Fill in the form and submit
    await userEvent.type(screen.getByLabelText(/name/i), mockValidContactInfo.name);
    await userEvent.type(screen.getByLabelText(/phone/i), mockValidContactInfo.phoneNumber);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    await waitFor(() => {
      // Appointment should still be created successfully
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAppointmentConfirmation);
      
      // But SMS failure warning should be shown
      expect(screen.getByText(/could not send SMS notification/i)).toBeInTheDocument();
    });
  });

  // Test case 9: Show loading state during submission
  test('shows loading state during form submission', async () => {
    // Add delay to the mock to simulate network request
    submitAppointment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockAppointmentConfirmation), 100))
    );
    
    render(<ContactInfoForm appointmentDetails={mockAppointmentDetails} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/name/i), mockValidContactInfo.name);
    await userEvent.type(screen.getByLabelText(/phone/i), mockValidContactInfo.phoneNumber);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    // Check loading indicator is shown
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText(/submitting/i)).not.toBeInTheDocument();
    });
  });
});