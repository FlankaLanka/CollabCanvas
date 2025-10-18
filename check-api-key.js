import fetch from 'node-fetch';

async function checkAPIKey() {
  console.log('🔍 Checking OpenAI API Key Permissions...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test with a minimal function calling request
    console.log('Testing OpenAI API key with function calling...');
    
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
        function_call: 'auto'
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
        console.log('\n🎉 SUCCESS: Function calling is working!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('\n❌ ISSUE: Function calling not working');
        console.log('This suggests the OpenAI API key does not have function calling permissions');
        console.log('\n🔧 Possible Solutions:');
        console.log('1. Check OpenAI account settings for function calling permissions');
        console.log('2. Verify the API key is valid and has the right permissions');
        console.log('3. Try using a different OpenAI API key');
        console.log('4. Check if the model supports function calling');
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

checkAPIKey();
