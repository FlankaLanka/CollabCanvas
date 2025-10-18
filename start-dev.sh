#!/bin/bash

# Start development servers with OpenAI API key
# Make sure to set OPENAI_API_KEY environment variable before running
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY environment variable is not set"
    echo "   Please set it with: export OPENAI_API_KEY='your-api-key-here'"
fi

echo "🚀 Starting development servers with OpenAI API key..."

# Start backend server
echo "📡 Starting backend server..."
npm run dev:server &

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "🎨 Starting frontend server..."
npm run dev &

echo "✅ Both servers are starting up!"
echo "📡 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
