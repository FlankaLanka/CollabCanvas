import fetch from 'node-fetch';

async function testV2API() {
  console.log('🔍 Testing New AI Chat v2 API...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat-v2`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat-v2`, {
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
      
      console.log('\n📥 Response:');
      console.log(`Has function call: ${!!message?.function_call}`);
      console.log(`Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`Content: ${message?.content?.substring(0, 100)}...`);
      
      if (message?.function_call) {
        console.log('\n🎉 SUCCESS: Function calling is working with v2 API!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('\n❌ v2 API also not working - AI generating text');
        console.log('This suggests a deeper issue with the production environment');
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

testV2API();
