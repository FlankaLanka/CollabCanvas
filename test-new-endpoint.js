import fetch from 'node-fetch';

async function testNewEndpoint() {
  console.log('🔍 Testing New AI Chat Endpoint...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat-new`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat-new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'create a blue circle' }
        ],
        functions: [
          {
            name: 'createShape',
            description: 'Create a shape',
            parameters: {
              type: 'object',
              properties: {
                shapeType: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' }
              },
              required: ['shapeType', 'x', 'y']
            }
          }
        ],
        function_call: 'auto',
        canvasState: { shapes: [], totalShapes: 0 }
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      const message = data.choices?.[0]?.message;
      
      console.log('\n📥 Response Analysis:');
      console.log(`Model: ${data.model}`);
      console.log(`Has function call: ${!!message?.function_call}`);
      console.log(`Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`Content: ${message?.content?.substring(0, 100)}...`);
      console.log(`Finish reason: ${data.choices?.[0]?.finish_reason}`);
      
      if (message?.function_call) {
        console.log('\n🎉 SUCCESS: New endpoint is working with function calls!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
        console.log('\n✅ The new endpoint should now work in production!');
      } else {
        console.log('\n❌ New endpoint still not working - AI generating text');
        console.log('This suggests there\'s still an issue with the production environment');
      }
    } else {
      console.log(`❌ Error: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

testNewEndpoint();
