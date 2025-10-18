#!/bin/bash

# AWS AI Agent Setup Script
# This script sets up the AWS AI agent for deployment

echo "🚀 Setting up AWS AI Agent..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file and set your OPENAI_API_KEY"
    echo "   nano .env"
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable is not set"
    echo "   Set it with: export OPENAI_API_KEY='your-api-key-here'"
    echo "   Or edit the .env file"
fi

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set your OpenAI API key: export OPENAI_API_KEY='your-key-here'"
echo "2. For Lambda deployment: npx serverless deploy"
echo "3. For EC2 deployment: pm2 start server.js --name 'ai-agent'"
echo "4. Test: curl http://localhost:3000/health"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
