/**
 * AWS Lambda Handler for AI Agent
 * 
 * This file provides the Lambda handler for serverless deployment.
 * It wraps the Express app to work with AWS Lambda and API Gateway.
 */

import serverlessExpress from '@codegenie/serverless-express';
import app from './server.js';

// Create the Lambda handler
const handler = serverlessExpress({ app });

export { handler };
