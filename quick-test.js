import fetch from 'node-fetch';

// Test the production AI endpoint
async function quickTest() {
  console.log('🔍 Quick Production Test...\n');
  
  // You'll need to replace this with your actual Vercel URL
  const PRODUCTION_URL = 'https://collabcanvas.vercel.app'; // Replace with your actual URL
  
  try {
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat`);
    
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
                y: { type: 'number' },
                fill: { type: 'string' }
              },
              required: ['shapeType', 'x', 'y']
            }
          }
        ],
        function_call: 'auto',
        canvasState: { shapes: [], totalShapes: 0 }
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const message = data.choices?.[0]?.message;
      
      console.log('✅ Response received');
      console.log(`Has function call: ${!!message?.function_call}`);
      console.log(`Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`Has content: ${!!message?.content}`);
      console.log(`Content: ${message?.content?.substring(0, 100)}...`);
      
      if (message?.function_call) {
        console.log('🎉 SUCCESS: Function calling is working!');
      } else {
        console.log('❌ ISSUE: AI is generating text instead of function calls');
      }
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

quickTest();
