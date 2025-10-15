import OpenAI from 'openai';

// Initialize OpenAI client server-side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Debug logging
  console.log('API Route Called:', {
    method: req.method,
    hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY),
    bodyKeys: req.body ? Object.keys(req.body) : 'no body'
  });

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { messages, functions, function_call } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      functions: functions || undefined,
      function_call: function_call || undefined,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Return the response
    res.status(200).json(completion);

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.status) {
      return res.status(error.status).json({ 
        error: error.message || 'OpenAI API error' 
      });
    }

    // Handle general errors
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
