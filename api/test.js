export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return test response
  res.status(200).json({ 
    message: 'API route is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    hasOpenAIKey: !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY)
  });
}
