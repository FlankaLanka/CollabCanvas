#!/bin/bash

# AWS AI Agent Deployment Script with LangSmith Integration
# This script deploys the AWS AI agent with LangSmith tracing enabled

set -e

echo "🚀 Deploying AWS AI Agent with LangSmith Integration..."

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    echo "   Set it with: export OPENAI_API_KEY='your-openai-api-key'"
    exit 1
fi

if [ -z "$LANGCHAIN_API_KEY" ]; then
    echo "❌ Error: LANGCHAIN_API_KEY environment variable is not set"
    echo "   Set it with: export LANGCHAIN_API_KEY='your-langsmith-api-key'"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Deploy to AWS Lambda
echo "🚀 Deploying to AWS Lambda..."
npx serverless deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Your AI agent is now running with LangSmith tracing enabled"
echo "📊 Check your LangSmith dashboard at: https://smith.langchain.com/"
echo "📊 Project: ${LANGCHAIN_PROJECT:-aws-ai-agent}"
echo ""
echo "🧪 Test your deployment:"
echo "   curl https://your-api-gateway-url/health"
echo ""
echo "📈 Monitor traces in LangSmith dashboard"
