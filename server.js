/**
 * Local Development Server for AI API
 * 
 * This provides the /api/ai-chat endpoint for local development.
 * Run this alongside your Vite dev server to enable AI features.
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY environment variable
 * 2. Run: node server.js
 * 3. Update AI_API_ENDPOINT in ai.js to http://localhost:3001/api/ai-chat
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Add fetch for Node.js if not available
if (!globalThis.fetch) {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// AI Chat endpoint (same logic as api/ai-chat.js)
app.post('/api/ai-chat', async (req, res) => {
  try {
    // Validate OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
      });
    }

    // Extract request data
    const { messages, functions, function_call } = req.body;

    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array required' 
      });
    }

    console.log('🤖 Processing AI request with', messages.length, 'messages');

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        functions: functions || undefined,
        function_call: function_call || undefined,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    // Check if OpenAI request was successful
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('❌ OpenAI API error:', openaiResponse.status, errorData);
      
      return res.status(openaiResponse.status).json({
        error: errorData.error?.message || `OpenAI API error: ${openaiResponse.status}`,
        details: errorData
      });
    }

    // Parse and return successful response
    const data = await openaiResponse.json();
    console.log('✅ OpenAI request successful');
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ API server error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI API server running',
    hasApiKey: !!process.env.OPENAI_API_KEY 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI API server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/ai-chat`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  Warning: OPENAI_API_KEY environment variable not set');
    console.log('   Set it with: export OPENAI_API_KEY="your-api-key-here"');
  }
});
