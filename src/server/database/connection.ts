/**
 * Database connection module
 * 
 * Note: This is a placeholder. In a real application, you would implement
 * the actual database connection logic here. For the purpose of this example,
 * we're just exporting a mock database object.
 */

import config from '../config/config';

// This is a placeholder. In a real app, you would implement actual database connections
export const db = {
  async query(sql: string, params?: any[]) {
    console.log(`Running query: ${sql}`);
    console.log('With parameters:', params);
    
    // Mock user data - in a real app, this would be in the database
    const mockUsers = [
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        // This would be a properly hashed password in a real application
        password: '$2a$12$9VVVvuFgcLtGHxorwf9FSuoqcKNuLx.9UtB0LFz3y8kVJFzI9YY0.',
        isActive: true,
        failedLoginAttempts: 0,
        lastLoginAttempt: null,
        lastSuccessfulLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Simulate a simple select query for user lookup
    if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('from users')) {
      const whereClause = sql.toLowerCase().split('where')[1];
      
      if (whereClause && whereClause.includes('username')) {
        const username = params?.[0];
        return { 
          rows: mockUsers.filter(user => user.username === username),
          rowCount: mockUsers.filter(user => user.username === username).length
        };
      }
      
      return { rows: mockUsers, rowCount: mockUsers.length };
    }
    
    // Simulate update query for login attempts
    if (sql.toLowerCase().includes('update users')) {
      if (sql.toLowerCase().includes('failed_login_attempts')) {
        console.log('Updating failed login attempts');
      } else if (sql.toLowerCase().includes('last_successful_login')) {
        console.log('Updating last successful login');
      }
      
      return { rowCount: 1, rows: [] };
    }
    
    return { rows: [], rowCount: 0 };
  },
  
  async connect() {
    console.log(`Connected to database ${config.database.database} at ${config.database.host}:${config.database.port}`);
  },
  
  async disconnect() {
    console.log('Disconnected from database');
  }
};

// Initialize database connection
export const initDatabase = async () => {
  try {
    await db.connect();
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
};

export default { db, initDatabase };