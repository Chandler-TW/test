import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceAndStylistSelection from '../ServiceAndStylistSelection';
import { getServices, getStylistsByService } from '../../services/appointmentService';

// Mock the services
jest.mock('../../services/appointmentService');

describe('ServiceAndStylistSelection Component', () => {
  const mockServices = [
    { id: 1, name: 'Haircut', duration: 30, price: 200 },
    { id: 2, name: 'Hair Coloring', duration: 120, price: 800 },
    { id: 3, name: 'Perm', duration: 180, price: 1200 },
  ];

  const mockStylists = [
    {
      id: 101,
      name: 'Emma Wang',
      nickname: 'Emma',
      photo: 'emma.jpg',
      rating: 4.8,
      serviceCount: 342,
      services: [1, 2, 3]
    },
    {
      id: 102,
      name: 'Jason Chen',
      nickname: 'Jay',
      photo: 'jason.jpg',
      rating: 4.6,
      serviceCount: 215,
      services: [1, 3]
    },
    {
      id: 103,
      name: 'Sophie Lin',
      nickname: 'Sophie',
      photo: 'sophie.jpg',
      rating: 4.9,
      serviceCount: 428,
      services: [1, 2]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    getServices.mockResolvedValue(mockServices);
    getStylistsByService.mockImplementation((serviceId) => {
      // Filter stylists based on service ID
      const filteredStylists = mockStylists.filter(
        stylist => stylist.services.includes(parseInt(serviceId))
      );
      return Promise.resolve(filteredStylists);
    });
  });

  // Test case 1: Display all service types from backend
  test('displays service type list from backend', async () => {
    render(<ServiceAndStylistSelection />);
    
    await waitFor(() => {
      mockServices.forEach(service => {
        expect(screen.getByText(service.name)).toBeInTheDocument();
      });
    });
    
    // Check that we have the right number of services
    const serviceElements = screen.getAllByTestId('service-option');
    expect(serviceElements.length).toBe(mockServices.length);
  });

  // Test case 2: Show stylists after selecting a service
  test('displays available hairstylists after selecting a service', async () => {
    render(<ServiceAndStylistSelection />);
    
    // Initially, no stylists should be shown
    expect(screen.queryByTestId('stylist-card')).not.toBeInTheDocument();
    
    // Wait for services to load and select the first one (Haircut)
    await waitFor(() => {
      const haircutService = screen.getByText('Haircut');
      fireEvent.click(haircutService);
    });
    
    // All stylists should be shown for haircut service (all 3 in our mock)
    await waitFor(() => {
      const stylistCards = screen.getAllByTestId('stylist-card');
      expect(stylistCards.length).toBe(3); // All 3 stylists offer haircut
      
      mockStylists.forEach(stylist => {
        expect(screen.getByText(stylist.nickname)).toBeInTheDocument();
      });
    });
    
    // Select another service (Perm - only 2 stylists offer this)
    const permService = screen.getByText('Perm');
    fireEvent.click(permService);
    
    // Only 2 stylists should now be shown
    await waitFor(() => {
      const stylistCards = screen.getAllByTestId('stylist-card');
      expect(stylistCards.length).toBe(2); // Only 2 stylists offer perm
      
      // Check the right stylists are shown
      expect(screen.getByText('Emma')).toBeInTheDocument(); // Emma offers perm
      expect(screen.getByText('Jay')).toBeInTheDocument(); // Jay offers perm
      expect(screen.queryByText('Sophie')).not.toBeInTheDocument(); // Sophie doesn't offer perm
    });
  });

  // Test case 3: Hairstylist card displays correct information
  test('hairstylist cards display correct information (photo, nickname, rating, service count)', async () => {
    render(<ServiceAndStylistSelection />);
    
    // Select Haircut service to show all stylists
    await waitFor(() => {
      const haircutService = screen.getByText('Haircut');
      fireEvent.click(haircutService);
    });
    
    await waitFor(() => {
      // Check one stylist card in detail (Emma)
      const emmaCard = screen.getByText('Emma').closest('[data-testid="stylist-card"]');
      
      // Check image
      const stylistImage = emmaCard.querySelector('img');
      expect(stylistImage).toBeInTheDocument();
      expect(stylistImage).toHaveAttribute('src', expect.stringContaining('emma.jpg'));
      expect(stylistImage).toHaveAttribute('alt', expect.stringContaining('Emma'));
      
      // Check nickname
      expect(emmaCard).toHaveTextContent('Emma');
      
      // Check rating
      expect(emmaCard).toHaveTextContent('4.8'); // Emma's rating
      
      // Check service count
      expect(emmaCard).toHaveTextContent('342'); // Emma's service count
    });
  });

  // Test case 4: Support random assignment option
  test('supports random assignment option', async () => {
    const onSelectionChange = jest.fn();
    render(<ServiceAndStylistSelection onSelectionChange={onSelectionChange} />);
    
    // Select Haircut service first
    await waitFor(() => {
      const haircutService = screen.getByText('Haircut');
      fireEvent.click(haircutService);
    });
    
    await waitFor(() => {
      // Check that random assignment option exists
      const randomOption = screen.getByText(/random assignment/i);
      expect(randomOption).toBeInTheDocument();
      
      // Select random assignment
      fireEvent.click(randomOption);
      
      // Callback should be called with the service and random assignment flag
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 1, // Haircut ID
          randomStylist: true,
          stylistId: null // No specific stylist ID when random
        })
      );
    });
  });

  // Test case 5: Selecting a specific hairstylist
  test('allows selection of a specific hairstylist', async () => {
    const onSelectionChange = jest.fn();
    render(<ServiceAndStylistSelection onSelectionChange={onSelectionChange} />);
    
    // Select Haircut service first
    await waitFor(() => {
      const haircutService = screen.getByText('Haircut');
      fireEvent.click(haircutService);
    });
    
    await waitFor(() => {
      // Find and click on Emma's card
      const emmaCard = screen.getByText('Emma').closest('[data-testid="stylist-card"]');
      fireEvent.click(emmaCard);
      
      // Callback should be called with the service and stylist ID
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 1, // Haircut ID
          randomStylist: false,
          stylistId: 101 // Emma's ID
        })
      );
    });
  });

  // Test case 6: Service selection resets stylist selection
  test('resets stylist selection when changing service type', async () => {
    const onSelectionChange = jest.fn();
    render(<ServiceAndStylistSelection onSelectionChange={onSelectionChange} />);
    
    // Select Haircut service and a stylist
    await waitFor(() => {
      const haircutService = screen.getByText('Haircut');
      fireEvent.click(haircutService);
    });
    
    await waitFor(() => {
      const emmaCard = screen.getByText('Emma').closest('[data-testid="stylist-card"]');
      fireEvent.click(emmaCard);
    });
    
    // Now change the service to Perm
    const permService = screen.getByText('Perm');
    fireEvent.click(permService);
    
    // Stylist selection should be reset
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        serviceId: 3, // Perm ID
        randomStylist: false,
        stylistId: null // Reset to null
      })
    );
    
    // Stylist cards should still be visible but none selected
    await waitFor(() => {
      const stylistCards = screen.getAllByTestId('stylist-card');
      stylistCards.forEach(card => {
        expect(card).not.toHaveClass('selected');
      });
    });
  });

  // Test case 7: No available stylists for a service
  test('shows message when no stylists available for selected service', async () => {
    // Mock a scenario where no stylists are available for a specific service
    getStylistsByService.mockImplementation((serviceId) => {
      if (serviceId === '2') { // Hair Coloring has no stylists in this mock
        return Promise.resolve([]);
      }
      return Promise.resolve(mockStylists.filter(
        stylist => stylist.services.includes(parseInt(serviceId))
      ));
    });
    
    render(<ServiceAndStylistSelection />);
    
    // Select Hair Coloring service which has no stylists
    await waitFor(() => {
      const coloringService = screen.getByText('Hair Coloring');
      fireEvent.click(coloringService);
    });
    
    // Should show a message that no stylists are available
    await waitFor(() => {
      expect(screen.getByText(/no hairstylists available/i)).toBeInTheDocument();
    });
  });
});