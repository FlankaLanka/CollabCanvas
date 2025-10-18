import express from 'express';
import cors from 'cors';
import serverlessExpress from '@codegenie/serverless-express';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Export for serverless
export const handler = serverlessExpress({ app });
