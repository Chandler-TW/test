const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const appointmentRoutes = require('./routes/appointments');
const barberRoutes = require('./routes/barbers');
const userRoutes = require('./routes/users');
const businessRoutes = require('./routes/business');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for production)
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/business', businessRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Default route
app.get('/', (req, res) => {
  res.send('Hair Salon Appointment API');
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: err.message || 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Database connection
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hairsalon';
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For testing purposes
module.exports = { app, server };