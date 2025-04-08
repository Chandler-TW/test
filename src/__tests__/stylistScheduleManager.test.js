import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StylistScheduleManager from '../components/StylistScheduleManager';

// Mock services
jest.mock('../services/scheduleService', () => ({
  getStylistsList: jest.fn(),
  getWeeklySchedule: jest.fn(),
  saveScheduleChanges: jest.fn(),
  getHolidays: jest.fn()
}));

import { 
  getStylistsList, 
  getWeeklySchedule, 
  saveScheduleChanges,
  getHolidays
} from '../services/scheduleService';

describe('StylistScheduleManager Component', () => {
  // Setup mock data
  const mockStylists = [
    { id: 1, name: '王师傅', },
    { id: 2, name: '李师傅', },
    { id: 3, name: '张师傅', }
  ];
  
  const mockWeeklySchedule = {
    startDate: '2023-07-10', // Monday
    endDate: '2023-07-16', // Sunday
    stylists: [
      {
        id: 1,
        name: '王师傅',
        schedule: [
          { date: '2023-07-10', isWorkDay: true, maxAppointments: 8 },
          { date: '2023-07-11', isWorkDay: true, maxAppointments: 8 },
          { date: '2023-07-12', isWorkDay: true, maxAppointments: 8 },
          { date: '2023-07-13', isWorkDay: false, maxAppointments: 0 },
          { date: '2023-07-14', isWorkDay: true, maxAppointments: 8 },
          { date: '2023-07-15', isWorkDay: true, maxAppointments: 6 },
          { date: '2023-07-16', isWorkDay: false, maxAppointments: 0 }
        ]
      },
      {
        id: 2,
        name: '李师傅',
        schedule: [
          { date: '2023-07-10', isWorkDay: true, maxAppointments: 6 },
          { date: '2023-07-11', isWorkDay: true, maxAppointments: 6 },
          { date: '2023-07-12', isWorkDay: false, maxAppointments: 0 },
          { date: '2023-07-13', isWorkDay: true, maxAppointments: 6 },
          { date: '2023-07-14', isWorkDay: true, maxAppointments: 6 },
          { date: '2023-07-15', isWorkDay: true, maxAppointments: 4 },
          { date: '2023-07-16', isWorkDay: false, maxAppointments: 0 }
        ]
      },
      {
        id: 3,
        name: '张师傅',
        schedule: [
          { date: '2023-07-10', isWorkDay: false, maxAppointments: 0 },
          { date: '2023-07-11', isWorkDay: true, maxAppointments: 7 },
          { date: '2023-07-12', isWorkDay: true, maxAppointments: 7 },
          { date: '2023-07-13', isWorkDay: true, maxAppointments: 7 },
          { date: '2023-07-14', isWorkDay: true, maxAppointments: 7 },
          { date: '2023-07-15', isWorkDay: true, maxAppointments: 5 },
          { date: '2023-07-16', isWorkDay: false, maxAppointments: 0 }
        ]
      }
    ]
  };
  
  const mockHolidays = [
    { date: '2023-07-15', name: '店庆日' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementation of service functions
    getStylistsList.mockResolvedValue(mockStylists);
    getWeeklySchedule.mockResolvedValue(mockWeeklySchedule);
    saveScheduleChanges.mockResolvedValue({ success: true });
    getHolidays.mockResolvedValue(mockHolidays);
  });

  test('should display weekly schedule in a visual grid', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalled();
    });
    
    // Check for week date range display
    expect(screen.getByText(/2023-07-10 至 2023-07-16/)).toBeInTheDocument();
    
    // Check for day headers (Monday to Sunday)
    expect(screen.getByText(/星期一/)).toBeInTheDocument();
    expect(screen.getByText(/星期二/)).toBeInTheDocument();
    expect(screen.getByText(/星期三/)).toBeInTheDocument();
    expect(screen.getByText(/星期四/)).toBeInTheDocument();
    expect(screen.getByText(/星期五/)).toBeInTheDocument();
    expect(screen.getByText(/星期六/)).toBeInTheDocument();
    expect(screen.getByText(/星期日/)).toBeInTheDocument();
    
    // Check for stylist names in the grid
    expect(screen.getByText('王师傅')).toBeInTheDocument();
    expect(screen.getByText('李师傅')).toBeInTheDocument();
    expect(screen.getByText('张师傅')).toBeInTheDocument();
    
    // Check for some specific schedule cells (work day and rest day)
    // Using data-testid to identify cells: stylist-{id}-date-{date}
    const wangMonday = screen.getByTestId('stylist-1-date-2023-07-10');
    expect(wangMonday).toHaveClass('work-day');
    
    const wangThursday = screen.getByTestId('stylist-1-date-2023-07-13');
    expect(wangThursday).toHaveClass('rest-day');
  });

  test('should allow batch setting of work/rest days', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalled();
    });
    
    // Find batch operations panel
    const batchPanel = screen.getByTestId('batch-operations');
    expect(batchPanel).toBeInTheDocument();
    
    // Select multiple stylists
    const wangCheckbox = screen.getByLabelText('王师傅');
    const liCheckbox = screen.getByLabelText('李师傅');
    fireEvent.click(wangCheckbox);
    fireEvent.click(liCheckbox);
    
    // Select days (Tuesday and Wednesday)
    const tuesdayCheckbox = screen.getByLabelText('星期二');
    const wednesdayCheckbox = screen.getByLabelText('星期三');
    fireEvent.click(tuesdayCheckbox);
    fireEvent.click(wednesdayCheckbox);
    
    // Set as rest days
    const setRestButton = screen.getByText('设为休息日');
    fireEvent.click(setRestButton);
    
    // Submit changes
    const saveButton = screen.getByText('保存排班');
    fireEvent.click(saveButton);
    
    // Check that saveScheduleChanges was called with updated data
    await waitFor(() => {
      expect(saveScheduleChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.arrayContaining([
            expect.objectContaining({
              stylistId: 1,
              date: '2023-07-11',
              isWorkDay: false,
              maxAppointments: 0
            }),
            expect.objectContaining({
              stylistId: 1,
              date: '2023-07-12',
              isWorkDay: false,
              maxAppointments: 0
            }),
            expect.objectContaining({
              stylistId: 2,
              date: '2023-07-11',
              isWorkDay: false,
              maxAppointments: 0
            }),
            expect.objectContaining({
              stylistId: 2,
              date: '2023-07-12',
              isWorkDay: false,
              maxAppointments: 0
            })
          ])
        })
      );
    });
  });

  test('should allow setting max appointment count for individual stylists', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalled();
    });
    
    // Find a work day cell and click on it to open the editor
    const wangMonday = screen.getByTestId('stylist-1-date-2023-07-10');
    fireEvent.click(wangMonday);
    
    // Check that max appointments input appears
    const maxAppointmentsInput = screen.getByLabelText('最大接单量');
    expect(maxAppointmentsInput).toBeInTheDocument();
    
    // Change the value from 8 to 5
    fireEvent.change(maxAppointmentsInput, { target: { value: '5' } });
    
    // Save the change
    const confirmButton = screen.getByText('确定');
    fireEvent.click(confirmButton);
    
    // Submit all changes
    const saveButton = screen.getByText('保存排班');
    fireEvent.click(saveButton);
    
    // Check that saveScheduleChanges was called with updated data
    await waitFor(() => {
      expect(saveScheduleChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.arrayContaining([
            expect.objectContaining({
              stylistId: 1,
              date: '2023-07-10',
              isWorkDay: true,
              maxAppointments: 5
            })
          ])
        })
      );
    });
  });

  test('should mark special dates (holidays) in the schedule', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getHolidays).toHaveBeenCalled();
    });
    
    // Check for holiday marker (July 15 is 店庆日)
    const holidayMarker = screen.getByText('店庆日');
    expect(holidayMarker).toBeInTheDocument();
    
    // Find Saturday cells (2023-07-15) and check for holiday class
    const wangSaturday = screen.getByTestId('stylist-1-date-2023-07-15');
    expect(wangSaturday).toHaveClass('holiday');
    
    const liSaturday = screen.getByTestId('stylist-2-date-2023-07-15');
    expect(liSaturday).toHaveClass('holiday');
    
    const zhangSaturday = screen.getByTestId('stylist-3-date-2023-07-15');
    expect(zhangSaturday).toHaveClass('holiday');
  });

  test('should navigate between weeks', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalledTimes(1);
    });
    
    // Initial week is 2023-07-10 to 2023-07-16
    expect(screen.getByText(/2023-07-10 至 2023-07-16/)).toBeInTheDocument();
    
    // Mock next week's data
    const nextWeekSchedule = {
      startDate: '2023-07-17', // Next Monday
      endDate: '2023-07-23', // Next Sunday
      stylists: mockWeeklySchedule.stylists.map(stylist => ({
        ...stylist,
        schedule: stylist.schedule.map(day => ({
          ...day,
          date: day.date.replace('07-1', '07-2').replace('07-0', '07-1')
        }))
      }))
    };
    getWeeklySchedule.mockResolvedValue(nextWeekSchedule);
    
    // Click next week button
    const nextWeekButton = screen.getByLabelText('下一周');
    fireEvent.click(nextWeekButton);
    
    // Check that getWeeklySchedule was called again with next week's date
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalledTimes(2);
      expect(getWeeklySchedule).toHaveBeenLastCalledWith('2023-07-17');
    });
    
    // Check that the new date range is displayed
    await waitFor(() => {
      expect(screen.getByText(/2023-07-17 至 2023-07-23/)).toBeInTheDocument();
    });
  });

  test('should prevent invalid max appointment values', async () => {
    render(<StylistScheduleManager />);
    
    await waitFor(() => {
      expect(getWeeklySchedule).toHaveBeenCalled();
    });
    
    // Find a work day cell and click on it to open the editor
    const wangMonday = screen.getByTestId('stylist-1-date-2023-07-10');
    fireEvent.click(wangMonday);
    
    // Try to set an invalid value (negative number)
    const maxAppointmentsInput = screen.getByLabelText('最大接单量');
    fireEvent.change(maxAppointmentsInput, { target: { value: '-3' } });
    
    // Try to save the change
    const confirmButton = screen.getByText('确定');
    fireEvent.click(confirmButton);
    
    // Should show an error
    expect(screen.getByText('最大接单量必须大于等于0')).toBeInTheDocument();
    
    // Try to set a non-numeric value
    fireEvent.change(maxAppointmentsInput, { target: { value: 'abc' } });
    fireEvent.click(confirmButton);
    
    // Should show an error
    expect(screen.getByText('请输入有效数字')).toBeInTheDocument();
    
    // Try to set a too-large value
    fireEvent.change(maxAppointmentsInput, { target: { value: '100' } });
    fireEvent.click(confirmButton);
    
    // Should show an error (assuming max is 20)
    expect(screen.getByText('最大接单量不能超过20')).toBeInTheDocument();
  });
});