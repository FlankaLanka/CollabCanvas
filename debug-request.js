import fetch from 'node-fetch';

async function debugRequest() {
  console.log('🔍 Debugging Production Request...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat`);
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that creates shapes on a canvas. Always use function calls for shape creation.'
        },
        {
          role: 'user',
          content: 'create a blue circle'
        }
      ],
      functions: [
        {
          name: 'createShape',
          description: 'Create a shape on the canvas',
          parameters: {
            type: 'object',
            properties: {
              shapeType: { type: 'string', enum: ['circle', 'rectangle', 'triangle'] },
              x: { type: 'number' },
              y: { type: 'number' },
              fill: { type: 'string' }
            },
            required: ['shapeType', 'x', 'y']
          }
        }
      ],
      function_call: 'auto',
      canvasState: { shapes: [], totalShapes: 0 }
    };
    
    console.log('📤 Request being sent:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📥 Response Data:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check if the production API is using our updated code
      const hasFunctionCall = !!data.choices?.[0]?.message?.function_call;
      console.log(`\n🔍 Function Call Analysis:`);
      console.log(`Has function call: ${hasFunctionCall}`);
      
      if (hasFunctionCall) {
        console.log('✅ SUCCESS: Production API is working with function calls!');
      } else {
        console.log('❌ ISSUE: Production API is not using function calling');
        console.log('This suggests the production API endpoint is not using the updated code');
        console.log('Possible causes:');
        console.log('1. Vercel deployment not updated');
        console.log('2. API endpoint not using the new ai-functions.js');
        console.log('3. Environment variables not properly set');
      }
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

debugRequest();
