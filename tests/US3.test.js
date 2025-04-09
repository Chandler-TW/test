const BarberProfileService = require('../src/BarberProfileService');
const BarberFilterService = require('../src/BarberFilterService');
const BarberAvailabilityService = require('../src/BarberAvailabilityService');
const { mockBarberData } = require('./testUtils');

describe('US3: Barber Profile Card Details', () => {
  let barberProfileService;
  
  beforeEach(() => {
    // Sample barber data for testing
    const barbers = [
      {
        id: '1',
        name: 'Tony',
        photo: 'tony.jpg',
        yearsOfExperience: 5,
        specialties: ['短发', '商务发型', '渐变'],
        portfolio: ['work1.jpg', 'work2.jpg', 'work3.jpg', 'work4.jpg']
      },
      {
        id: '2',
        name: 'Mike',
        photo: 'mike.jpg',
        yearsOfExperience: 8,
        specialties: ['染发', '烫发', '长发'],
        portfolio: ['work5.jpg', 'work6.jpg', 'work7.jpg']
      }
    ];
    
    barberProfileService = new BarberProfileService(barbers);
  });
  
  test('should include photo in barber profile card', () => {
    const profile = barberProfileService.getBarberProfile('1');
    expect(profile.photo).toBe('tony.jpg');
  });
  
  test('should include years of experience in barber profile card', () => {
    const profile = barberProfileService.getBarberProfile('1');
    expect(profile.yearsOfExperience).toBe(5);
  });
  
  test('should include specialties as tag cloud in barber profile card', () => {
    const profile = barberProfileService.getBarberProfile('1');
    expect(profile.specialties).toEqual(['短发', '商务发型', '渐变']);
  });
  
  test('should include portfolio with 3-6 images in barber profile card', () => {
    const profile1 = barberProfileService.getBarberProfile('1');
    const profile2 = barberProfileService.getBarberProfile('2');
    
    expect(profile1.portfolio.length).toBe(4);
    expect(profile1.portfolio).toEqual(['work1.jpg', 'work2.jpg', 'work3.jpg', 'work4.jpg']);
    
    expect(profile2.portfolio.length).toBe(3);
    expect(profile2.portfolio).toEqual(['work5.jpg', 'work6.jpg', 'work7.jpg']);
  });
  
  test('should throw an error if portfolio has less than 3 images', () => {
    const invalidBarber = {
      id: '3',
      name: 'John',
      photo: 'john.jpg',
      yearsOfExperience: 3,
      specialties: ['短发', '儿童发型'],
      portfolio: ['work8.jpg', 'work9.jpg'] // Only 2 images
    };
    
    expect(() => {
      barberProfileService.validateBarberData(invalidBarber);
    }).toThrow('发型师作品集必须包含3-6张图片');
  });
  
  test('should throw an error if portfolio has more than 6 images', () => {
    const invalidBarber = {
      id: '4',
      name: 'Sarah',
      photo: 'sarah.jpg',
      yearsOfExperience: 10,
      specialties: ['婚礼发型', '编发'],
      portfolio: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg', 'f.jpg', 'g.jpg'] // 7 images
    };
    
    expect(() => {
      barberProfileService.validateBarberData(invalidBarber);
    }).toThrow('发型师作品集必须包含3-6张图片');
  });
});

describe('US3: Barber Filtering Capability', () => {
  let barberFilterService;
  
  beforeEach(() => {
    // Sample barber data for testing
    const barbers = [
      {
        id: '1',
        name: 'Tony',
        specialties: ['短发', '商务发型', '渐变']
      },
      {
        id: '2',
        name: 'Mike',
        specialties: ['染发', '烫发', '长发']
      },
      {
        id: '3',
        name: 'Lucy',
        specialties: ['短发', '染发', '儿童发型']
      }
    ];
    
    barberFilterService = new BarberFilterService(barbers);
  });
  
  test('should filter barbers by specialty', () => {
    const shortHairBarbers = barberFilterService.filterBarbersBySpecialty('短发');
    expect(shortHairBarbers.length).toBe(2);
    expect(shortHairBarbers[0].name).toBe('Tony');
    expect(shortHairBarbers[1].name).toBe('Lucy');
  });
  
  test('should return empty array when no barbers match specialty', () => {
    const barbers = barberFilterService.filterBarbersBySpecialty('非主流');
    expect(barbers).toEqual([]);
  });
  
  test('should filter barbers by multiple specialties (AND logic)', () => {
    const filteredBarbers = barberFilterService.filterBarbersByMultipleSpecialties(['短发', '染发']);
    expect(filteredBarbers.length).toBe(1);
    expect(filteredBarbers[0].name).toBe('Lucy');
  });
  
  test('should get unique list of all available specialties', () => {
    const allSpecialties = barberFilterService.getAllSpecialties();
    expect(allSpecialties).toContain('短发');
    expect(allSpecialties).toContain('商务发型');
    expect(allSpecialties).toContain('渐变');
    expect(allSpecialties).toContain('染发');
    expect(allSpecialties).toContain('烫发');
    expect(allSpecialties).toContain('长发');
    expect(allSpecialties).toContain('儿童发型');
    expect(allSpecialties.length).toBe(7); // No duplicates
  });
  
  test('should sort barbers by number of matching specialties', () => {
    // Add another barber with more matching specialties
    barberFilterService.addBarber({
      id: '4',
      name: 'Emma',
      specialties: ['短发', '染发', '渐变', '商务发型']
    });
    
    const filteredBarbers = barberFilterService.filterAndSortBySpecialties(['短发', '商务发型', '染发']);
    expect(filteredBarbers[0].name).toBe('Emma'); // 3 matches
    expect(filteredBarbers[1].name).toBe('Tony'); // 2 matches
    expect(filteredBarbers[2].name).toBe('Lucy'); // 2 matches
  });
});

describe('US3: Barber Availability Status Display', () => {
  let availabilityService;
  
  beforeEach(() => {
    // Sample availability data for testing
    const barbersAvailability = {
      '1': { // Tony
        available: true,
        nextAvailableSlot: '2023-07-01T10:00:00'
      },
      '2': { // Mike
        available: false, 
        nextAvailableSlot: '2023-07-01T14:00:00'
      }
    };
    
    availabilityService = new BarberAvailabilityService(barbersAvailability);
  });
  
  test('should show available status as green for available barbers', () => {
    const status = availabilityService.getBarberAvailabilityStatus('1');
    expect(status.isAvailable).toBe(true);
    expect(status.statusColor).toBe('green');
  });
  
  test('should show unavailable status as gray for fully booked barbers', () => {
    const status = availabilityService.getBarberAvailabilityStatus('2');
    expect(status.isAvailable).toBe(false);
    expect(status.statusColor).toBe('gray');
  });
  
  test('should provide next available time slot for unavailable barbers', () => {
    const status = availabilityService.getBarberAvailabilityStatus('2');
    expect(status.nextAvailableSlot).toBe('2023-07-01T14:00:00');
  });
  
  test('should update real-time availability when a booking is made', () => {
    // Initially available
    expect(availabilityService.getBarberAvailabilityStatus('1').isAvailable).toBe(true);
    
    // Make a booking for all of Tony's slots
    availabilityService.updateAvailability('1', false, '2023-07-01T15:00:00');
    
    // Should now be unavailable
    const updatedStatus = availabilityService.getBarberAvailabilityStatus('1');
    expect(updatedStatus.isAvailable).toBe(false);
    expect(updatedStatus.statusColor).toBe('gray');
    expect(updatedStatus.nextAvailableSlot).toBe('2023-07-01T15:00:00');
  });
  
  test('should update real-time availability when a booking is cancelled', () => {
    // Initially unavailable
    expect(availabilityService.getBarberAvailabilityStatus('2').isAvailable).toBe(false);
    
    // Cancel a booking
    availabilityService.updateAvailability('2', true, null);
    
    // Should now be available
    const updatedStatus = availabilityService.getBarberAvailabilityStatus('2');
    expect(updatedStatus.isAvailable).toBe(true);
    expect(updatedStatus.statusColor).toBe('green');
    expect(updatedStatus.nextAvailableSlot).toBeNull();
  });
  
  test('should provide availability for specific time', () => {
    // Add detailed availability by time slots
    availabilityService.setDetailedAvailability('1', [
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: false },
      { time: '10:30', available: false }
    ]);
    
    const morningAvailability = availabilityService.getAvailabilityForTimeSlot('1', '09:00');
    expect(morningAvailability).toBe(true);
    
    const lateAvailability = availabilityService.getAvailabilityForTimeSlot('1', '10:00');
    expect(lateAvailability).toBe(false);
  });
});