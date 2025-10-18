import fetch from 'node-fetch';

async function checkAPIStructure() {
  console.log('🔍 Checking Production API Structure...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test with a simple request to see the full response structure
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
      
      console.log('\n📥 Full Response Structure:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n🔍 Key Analysis:');
      console.log(`Model: ${data.model}`);
      console.log(`Has choices: ${!!data.choices}`);
      console.log(`Choices length: ${data.choices?.length}`);
      console.log(`Has message: ${!!data.choices?.[0]?.message}`);
      console.log(`Message role: ${data.choices?.[0]?.message?.role}`);
      console.log(`Has function_call: ${!!data.choices?.[0]?.message?.function_call}`);
      console.log(`Has content: ${!!data.choices?.[0]?.message?.content}`);
      console.log(`Finish reason: ${data.choices?.[0]?.finish_reason}`);
      
      // Check if the response includes any debugging information
      const content = data.choices?.[0]?.message?.content || '';
      if (content.includes('debug') || content.includes('function') || content.includes('API')) {
        console.log('\n✅ Response includes debugging info - API is using updated code');
      } else {
        console.log('\n❌ Response does not include debugging info - API may be using old code');
      }
      
      // Check if the response structure matches what we expect
      if (data.choices?.[0]?.message?.function_call) {
        console.log('\n🎉 SUCCESS: Function calling is working!');
        console.log(`Function: ${data.choices[0].message.function_call.name}`);
        console.log(`Arguments: ${data.choices[0].message.function_call.arguments}`);
      } else {
        console.log('\n❌ ISSUE: No function call in response');
        console.log('This means the production API is not configured for function calling');
        
        // Check if the issue is with the request format
        console.log('\n🔍 Request Analysis:');
        console.log('The request includes:');
        console.log('- functions: ✅');
        console.log('- function_call: "auto" ✅');
        console.log('- messages: ✅');
        console.log('\nThe response should include function_call but doesn\'t');
        console.log('This suggests the production API is not processing function calls');
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

checkAPIStructure();
