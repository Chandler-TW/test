import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/config';
import authRoutes from './routes/authRoutes';

// Create Express server
const app = express();

// Express configuration
app.set('port', config.server.port);

// Apply middleware
app.use(morgan('dev')); // Logging
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Configure CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: err.type || 'SERVER_ERROR',
    message
  });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(app.get('port'), () => {
    console.log(
      `Server running at http://localhost:${app.get('port')} in ${config.server.nodeEnv} mode`
    );
  });
}

// For testing purposes
export default app;