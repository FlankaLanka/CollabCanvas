import fetch from 'node-fetch';

async function checkDeployment() {
  console.log('🔍 Checking Vercel Deployment Status...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test if the API endpoint is accessible
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'test' }
        ],
        functions: [],
        function_call: 'auto',
        canvasState: { shapes: [], totalShapes: 0 }
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📥 Response Analysis:');
      console.log(`Model: ${data.model}`);
      console.log(`Has function call: ${!!data.choices?.[0]?.message?.function_call}`);
      console.log(`Content: ${data.choices?.[0]?.message?.content?.substring(0, 100)}...`);
      
      // Check if the response includes our debugging logs
      if (data.choices?.[0]?.message?.content?.includes('debug') || 
          data.choices?.[0]?.message?.content?.includes('function')) {
        console.log('✅ Production API is using updated code');
      } else {
        console.log('❌ Production API is still using old code');
        console.log('This means Vercel deployment is not complete or failed');
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

checkDeployment();
