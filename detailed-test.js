import fetch from 'node-fetch';

async function detailedTest() {
  console.log('🔍 Detailed Production AI Test...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    console.log(`Testing: ${PRODUCTION_URL}/api/ai-chat`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📥 Full Response:');
      console.log(JSON.stringify(data, null, 2));
      
      const message = data.choices?.[0]?.message;
      console.log('\n🔍 Analysis:');
      console.log(`Has function call: ${!!message?.function_call}`);
      console.log(`Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`Function arguments: ${message?.function_call?.arguments || 'none'}`);
      console.log(`Has content: ${!!message?.content}`);
      console.log(`Content: ${message?.content}`);
      console.log(`Finish reason: ${data.choices?.[0]?.finish_reason}`);
      
      if (message?.function_call) {
        console.log('\n🎉 SUCCESS: Function calling is working!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('\n❌ ISSUE: AI is generating text instead of function calls');
        console.log('This means the production API is not properly configured for function calling');
      }
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

detailedTest();
