import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceAndStylistSelection from '../components/ServiceAndStylistSelection';

// Mock services
jest.mock('../services/serviceService', () => ({
  getServiceTypes: jest.fn(),
  getAvailableStylists: jest.fn()
}));

import { getServiceTypes, getAvailableStylists } from '../services/serviceService';

describe('ServiceAndStylistSelection Component', () => {
  // Setup mock data
  const mockServiceTypes = [
    { id: 1, name: '剪发', duration: 30, price: 88 },
    { id: 2, name: '染发', duration: 120, price: 298 },
    { id: 3, name: '烫发', duration: 180, price: 398 }
  ];
  
  const mockStylists = [
    {
      id: 1,
      name: '王师傅',
      photo: 'https://example.com/stylist1.jpg',
      rating: 4.8,
      serviceCount: 1250,
      specialties: [1, 2, 3]
    },
    {
      id: 2,
      name: '李师傅',
      photo: 'https://example.com/stylist2.jpg',
      rating: 4.6,
      serviceCount: 986,
      specialties: [1, 3]
    },
    {
      id: 3,
      name: '张师傅',
      photo: 'https://example.com/stylist3.jpg',
      rating: 4.9,
      serviceCount: 1542,
      specialties: [1, 2]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementation of service functions
    getServiceTypes.mockResolvedValue(mockServiceTypes);
    getAvailableStylists.mockResolvedValue(mockStylists);
  });

  test('should display list of service types', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Check if all service types are displayed
    expect(screen.getByText('剪发')).toBeInTheDocument();
    expect(screen.getByText('染发')).toBeInTheDocument();
    expect(screen.getByText('烫发')).toBeInTheDocument();
    
    // Check for service details (price and duration)
    expect(screen.getByText(/88元/)).toBeInTheDocument();
    expect(screen.getByText(/30分钟/)).toBeInTheDocument();
    expect(screen.getByText(/298元/)).toBeInTheDocument();
    expect(screen.getByText(/120分钟/)).toBeInTheDocument();
    expect(screen.getByText(/398元/)).toBeInTheDocument();
    expect(screen.getByText(/180分钟/)).toBeInTheDocument();
  });

  test('should display stylists after selecting a service type', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // No stylists should be shown initially
    expect(screen.queryByText('王师傅')).not.toBeInTheDocument();
    
    // Select a service type (剪发)
    const cutServiceCard = screen.getByText('剪发').closest('div');
    fireEvent.click(cutServiceCard);
    
    await waitFor(() => {
      expect(getAvailableStylists).toHaveBeenCalledWith(1); // Called with service ID 1
    });
    
    // Check if stylists are displayed now
    expect(screen.getByText('王师傅')).toBeInTheDocument();
    expect(screen.getByText('李师傅')).toBeInTheDocument();
    expect(screen.getByText('张师傅')).toBeInTheDocument();
  });

  test('should display filtered stylists based on selected service', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Select 染发 service (ID: 2)
    const dyeServiceCard = screen.getByText('染发').closest('div');
    fireEvent.click(dyeServiceCard);
    
    // Mock filtered stylists (only those who can do dyeing)
    const filteredStylists = mockStylists.filter(stylist => 
      stylist.specialties.includes(2)
    );
    getAvailableStylists.mockResolvedValue(filteredStylists);
    
    await waitFor(() => {
      expect(getAvailableStylists).toHaveBeenCalledWith(2); // Called with service ID 2
    });
    
    // 王师傅 and 张师傅 should be displayed (they can do dyeing)
    expect(screen.getByText('王师傅')).toBeInTheDocument();
    expect(screen.getByText('张师傅')).toBeInTheDocument();
    
    // 李师傅 should not be displayed (doesn't do dyeing)
    expect(screen.queryByText('李师傅')).not.toBeInTheDocument();
  });

  test('should display stylist details on cards', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Select a service
    const cutServiceCard = screen.getByText('剪发').closest('div');
    fireEvent.click(cutServiceCard);
    
    await waitFor(() => {
      expect(getAvailableStylists).toHaveBeenCalled();
    });
    
    // Check for stylist photo
    const stylistPhoto = screen.getAllByRole('img')[0]; // First stylist photo
    expect(stylistPhoto).toHaveAttribute('src', 'https://example.com/stylist1.jpg');
    expect(stylistPhoto).toHaveAttribute('alt', '王师傅');
    
    // Check for stylist ratings
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    
    // Check for service counts
    expect(screen.getByText('1250次服务')).toBeInTheDocument();
    expect(screen.getByText('986次服务')).toBeInTheDocument();
    expect(screen.getByText('1542次服务')).toBeInTheDocument();
  });

  test('should provide random assignment option', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Select a service
    const cutServiceCard = screen.getByText('剪发').closest('div');
    fireEvent.click(cutServiceCard);
    
    await waitFor(() => {
      expect(getAvailableStylists).toHaveBeenCalled();
    });
    
    // Check for random assignment option
    const randomOption = screen.getByText(/随机分配/);
    expect(randomOption).toBeInTheDocument();
    
    // Select random assignment
    fireEvent.click(randomOption);
    
    // Should highlight the random option
    expect(randomOption.closest('div')).toHaveClass('selected');
    
    // Check that no specific stylist is selected
    const stylistCards = screen.getAllByTestId('stylist-card');
    stylistCards.forEach(card => {
      expect(card).not.toHaveClass('selected');
    });
  });

  test('should allow selecting a specific stylist', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      expect(getServiceTypes).toHaveBeenCalled();
    });
    
    // Select a service
    const cutServiceCard = screen.getByText('剪发').closest('div');
    fireEvent.click(cutServiceCard);
    
    await waitFor(() => {
      expect(getAvailableStylists).toHaveBeenCalled();
    });
    
    // Select a specific stylist (王师傅)
    const stylistCard = screen.getByText('王师傅').closest('[data-testid="stylist-card"]');
    fireEvent.click(stylistCard);
    
    // Should highlight selected stylist
    expect(stylistCard).toHaveClass('selected');
    
    // Random option should not be selected
    const randomOption = screen.getByText(/随机分配/);
    expect(randomOption.closest('div')).not.toHaveClass('selected');
  });
});