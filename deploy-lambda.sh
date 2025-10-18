#!/bin/bash

# Deploy CollabCanvas AI Agent to AWS Lambda
echo "🚀 Deploying CollabCanvas AI Agent to AWS Lambda..."

# Create deployment directory
mkdir -p lambda-deployment
cd lambda-deployment

# Copy Lambda handler
cp ../lambda-handler.js ./index.js
cp ../lambda-package.json ./package.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../collabcanvas-lambda.zip . -x "*.git*" "node_modules/.cache/*"

cd ..

# Deploy to AWS Lambda
echo "🚀 Deploying to AWS Lambda..."

# Create the Lambda function
aws lambda create-function \
  --function-name collabcanvas-ai-agent \
  --runtime nodejs18.x \
  --role arn:aws:iam::971422717446:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://collabcanvas-lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables='{OPENAI_API_KEY='$OPENAI_API_KEY'}' \
  --region us-east-1 || echo "Function may already exist, updating..."

# Update function code if it already exists
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://collabcanvas-lambda.zip \
  --region us-east-1

# Update function configuration
aws lambda update-function-configuration \
  --function-name collabcanvas-ai-agent \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables='{OPENAI_API_KEY='$OPENAI_API_KEY'}' \
  --region us-east-1

# Create API Gateway
echo "🌐 Creating API Gateway..."
aws apigatewayv2 create-api \
  --name collabcanvas-ai-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:971422717446:function:collabcanvas-ai-agent \
  --region us-east-1 || echo "API may already exist"

# Get the API ID
API_ID=$(aws apigatewayv2 get-apis --query 'Items[?Name==`collabcanvas-ai-api`].ApiId' --output text --region us-east-1)
echo "API ID: $API_ID"

# Create routes
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /api/ai-chat' \
  --target "integrations/$(aws apigatewayv2 create-integration --api-id $API_ID --integration-type AWS_PROXY --integration-method POST --integration-uri arn:aws:lambda:us-east-1:971422717446:function:collabcanvas-ai-agent --region us-east-1 --query 'IntegrationId' --output text)" \
  --region us-east-1

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'GET /health' \
  --target "integrations/$(aws apigatewayv2 create-integration --api-id $API_ID --integration-type AWS_PROXY --integration-method GET --integration-uri arn:aws:lambda:us-east-1:971422717446:function:collabcanvas-ai-agent --region us-east-1 --query 'IntegrationId' --output text)" \
  --region us-east-1

# Deploy the API
aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name prod \
  --region us-east-1

# Get the API endpoint
ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text --region us-east-1)
echo "🎉 Deployment complete!"
echo "📡 API Endpoint: $ENDPOINT"
echo "🔗 AI Chat: $ENDPOINT/api/ai-chat"
echo "❤️  Health Check: $ENDPOINT/health"

# Clean up
rm -rf lambda-deployment
rm collabcanvas-lambda.zip

echo "✅ Deployment completed successfully!"
