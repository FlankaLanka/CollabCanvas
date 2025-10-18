import fetch from 'node-fetch';

async function minimalTest() {
  console.log('🔍 Minimal Production Test...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test with the simplest possible request
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
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
        function_call: 'auto'
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
        console.log('\n🎉 SUCCESS: Function calling is working!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('\n❌ Still not working - AI generating text');
        console.log('This suggests the production API is not using function calling at all');
      }
    } else {
      console.log(`❌ Error: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

minimalTest();
