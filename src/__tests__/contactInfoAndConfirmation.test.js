import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactInfoAndConfirmation from '../components/ContactInfoAndConfirmation';

// Mock services
jest.mock('../services/appointmentService', () => ({
  createAppointment: jest.fn(),
  sendConfirmationSMS: jest.fn()
}));

import { createAppointment, sendConfirmationSMS } from '../services/appointmentService';

describe('ContactInfoAndConfirmation Component', () => {
  // Setup mock appointment data that would be passed as props
  const mockAppointmentData = {
    serviceId: 1,
    serviceName: '剪发',
    stylistId: 2,
    stylistName: '李师傅',
    date: '2023-07-10',
    timeSlot: '14:00'
  };
  
  const mockAppointmentResponse = {
    id: 12345,
    appointmentCode: 'HC2307100025', // Hair salon Code + Date + sequence number
    customerName: '张三',
    phoneNumber: '13800138000',
    note: '希望剪短一点',
    ...mockAppointmentData
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementation of service functions
    createAppointment.mockResolvedValue(mockAppointmentResponse);
    sendConfirmationSMS.mockResolvedValue({ success: true });
  });

  test('should display contact information form with required fields', () => {
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    // Check for form fields
    expect(screen.getByLabelText(/姓名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/手机号/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/备注/i)).toBeInTheDocument();
    
    // Check that name and phone are required
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/手机号/i);
    expect(nameInput).toBeRequired();
    expect(phoneInput).toBeRequired();
    
    // Check that note is optional
    const noteInput = screen.getByLabelText(/备注/i);
    expect(noteInput).not.toBeRequired();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /确认预约/i })).toBeInTheDocument();
  });

  test('should validate phone number format', async () => {
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/手机号/i);
    const submitButton = screen.getByRole('button', { name: /确认预约/i });
    
    // Fill name but enter invalid phone number
    userEvent.type(nameInput, '张三');
    userEvent.type(phoneInput, '123'); // Too short
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(await screen.findByText(/手机号格式不正确/i)).toBeInTheDocument();
    expect(createAppointment).not.toHaveBeenCalled();
    
    // Clear and enter non-numeric phone
    userEvent.clear(phoneInput);
    userEvent.type(phoneInput, '1380013800a');
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(await screen.findByText(/手机号必须为数字/i)).toBeInTheDocument();
    expect(createAppointment).not.toHaveBeenCalled();
    
    // Clear and enter valid phone
    userEvent.clear(phoneInput);
    userEvent.type(phoneInput, '13800138000');
    fireEvent.click(submitButton);
    
    // Should not show validation error
    await waitFor(() => {
      expect(screen.queryByText(/手机号格式不正确/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/手机号必须为数字/i)).not.toBeInTheDocument();
    });
    
    // The service should be called with valid data
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({
        customerName: '张三',
        phoneNumber: '13800138000'
      }));
    });
  });

  test('should submit form and show confirmation page with appointment code', async () => {
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/手机号/i);
    const noteInput = screen.getByLabelText(/备注/i);
    const submitButton = screen.getByRole('button', { name: /确认预约/i });
    
    // Fill form with valid data
    userEvent.type(nameInput, '张三');
    userEvent.type(phoneInput, '13800138000');
    userEvent.type(noteInput, '希望剪短一点');
    fireEvent.click(submitButton);
    
    // Should call createAppointment with correct data
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        customerName: '张三',
        phoneNumber: '13800138000',
        note: '希望剪短一点',
        ...mockAppointmentData
      });
    });
    
    // Should show confirmation page with appointment code
    expect(await screen.findByText('预约成功')).toBeInTheDocument();
    expect(screen.getByText('HC2307100025')).toBeInTheDocument(); // Appointment code
    expect(screen.getByText(/张三/)).toBeInTheDocument();
    expect(screen.getByText(/13800138000/)).toBeInTheDocument();
    expect(screen.getByText(/剪发/)).toBeInTheDocument();
    expect(screen.getByText(/李师傅/)).toBeInTheDocument();
    expect(screen.getByText(/2023-07-10/)).toBeInTheDocument();
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  test('should send SMS notification after successful appointment', async () => {
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/手机号/i);
    const submitButton = screen.getByRole('button', { name: /确认预约/i });
    
    // Fill form with valid data
    userEvent.type(nameInput, '张三');
    userEvent.type(phoneInput, '13800138000');
    fireEvent.click(submitButton);
    
    // Wait for appointment creation
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalled();
    });
    
    // Should call sendConfirmationSMS with appointment ID
    await waitFor(() => {
      expect(sendConfirmationSMS).toHaveBeenCalledWith(12345);
    });
    
    // Should show SMS notification success message
    expect(await screen.findByText(/短信通知已发送/)).toBeInTheDocument();
  });

  test('should handle SMS notification failure', async () => {
    // Mock SMS failure
    sendConfirmationSMS.mockResolvedValue({ success: false, error: '短信发送失败' });
    
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/手机号/i);
    const submitButton = screen.getByRole('button', { name: /确认预约/i });
    
    // Fill form with valid data
    userEvent.type(nameInput, '张三');
    userEvent.type(phoneInput, '13800138000');
    fireEvent.click(submitButton);
    
    // Wait for appointment creation
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalled();
    });
    
    // Should still show appointment confirmation
    expect(await screen.findByText('预约成功')).toBeInTheDocument();
    
    // Should show SMS notification failure message
    expect(await screen.findByText(/短信通知发送失败/)).toBeInTheDocument();
  });

  test('should display appointment details in the form', () => {
    render(<ContactInfoAndConfirmation appointmentData={mockAppointmentData} />);
    
    // Check that appointment details are shown
    expect(screen.getByText(/剪发/)).toBeInTheDocument();
    expect(screen.getByText(/李师傅/)).toBeInTheDocument();
    expect(screen.getByText(/2023-07-10/)).toBeInTheDocument();
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });
});