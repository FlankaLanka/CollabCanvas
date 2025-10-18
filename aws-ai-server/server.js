import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverlessExpress from '@codegenie/serverless-express';
import { AI_FUNCTIONS } from './ai-functions.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://collab-canvas-virid.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// AI_FUNCTIONS is imported from ai-functions.js (46 functions)

// System prompt
const systemPrompt = `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas. You have access to a comprehensive set of tools for creating, modifying, and arranging shapes.

IMPORTANT: You MUST use the available tools to perform actions. Do not just describe what you would do - actually call the appropriate tool functions.

Key capabilities:
- Create single shapes or multiple shapes with automatic layout
- Manipulate existing shapes (move, resize, rotate, change color/text)
- Arrange shapes in rows, grids, or custom patterns
- Create complex UI components like login forms, navigation bars, and card layouts
- Quality assurance tools for alignment, contrast, and spacing
- Advanced layout tools for professional UI design

ALWAYS use the most appropriate tool for the user's request:
- For single shapes: use createShape
- For multiple shapes: use createMultipleShapes
- For moving shapes: use moveShape
- For complex UI components: use the specialized creation functions

Be precise with positioning and sizing, and always consider the user's current viewport and existing shapes when making recommendations.`;

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY?.length,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10),
    functionCount: AI_FUNCTIONS.length,
    firstFunction: AI_FUNCTIONS[0]?.name
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      functionCount: AI_FUNCTIONS.length,
      functions: AI_FUNCTIONS.map(f => f.name)
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed: ' + error.message });
  }
});

// Main AI endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, canvasState } = req.body;
    const userMessage = messages[messages.length - 1]?.content || '';

    console.log('🤖 AWS AI Agent - Processing request:', userMessage.substring(0, 50) + '...');
    console.log('📊 Available functions:', AI_FUNCTIONS.length);

    // Direct OpenAI API call with all 46 functions
    const requestPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      tools: AI_FUNCTIONS.map(func => ({
        type: 'function',
        function: func
      })),
      tool_choice: 'auto',
      temperature: 0.1
    };
    
    console.log('🔍 Request payload size:', JSON.stringify(requestPayload).length);
    console.log('🔍 First function:', AI_FUNCTIONS[0]?.name);
    console.log('🔍 API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('🔍 API Key length:', process.env.OPENAI_API_KEY?.length);
    console.log('🔍 Model:', requestPayload.model);
    console.log('🔍 Tools count:', requestPayload.tools?.length);
    console.log('🔍 Tool choice:', requestPayload.tool_choice);
    console.log('🔍 System prompt length:', systemPrompt.length);
    console.log('🔍 User message:', userMessage);
    console.log('🔍 First 3 tools:', requestPayload.tools?.slice(0, 3).map(t => t.function.name));

    // Direct OpenAI API call with all 46 functions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📥 Raw OpenAI Response:', JSON.stringify(result, null, 2));
    console.log('✅ AWS AI Agent - Request successful:', {
      hasChoices: !!result.choices,
      choicesLength: result.choices?.length,
      hasFunctionCall: !!result.choices[0]?.message?.function_call,
      hasToolCalls: !!result.choices[0]?.message?.tool_calls,
      toolCallsCount: result.choices[0]?.message?.tool_calls?.length || 0,
      functionName: result.choices[0]?.message?.function_call?.name,
      toolCallName: result.choices[0]?.message?.tool_calls?.[0]?.function?.name,
      hasContent: !!result.choices[0]?.message?.content,
      finishReason: result.choices[0]?.finish_reason
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ AWS AI Agent - Request failed:', error);
    res.status(500).json({
      error: 'AI processing failed: ' + error.message
    });
  }
});

// Export for serverless
export const handler = serverlessExpress({ app });
export { app };

// Local development server
if (process.env.NODE_ENV !== 'lambda') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 AWS AI Agent running on port ${PORT}`);
    console.log(`📊 Available functions: ${AI_FUNCTIONS.length}`);
    console.log(`🔧 OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
  });
}
