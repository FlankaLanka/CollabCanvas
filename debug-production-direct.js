import fetch from 'node-fetch';

async function debugProductionDirect() {
  console.log('🔍 Direct Production Debug - Different Approach...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test 1: Check if the API endpoint exists and responds
    console.log('1️⃣ Testing API endpoint existence...');
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log('   ✅ API endpoint is accessible');
    } else {
      console.log('   ❌ API endpoint issue');
      return;
    }
    
    // Test 2: Check if the API supports function calling with minimal request
    console.log('\n2️⃣ Testing function calling support...');
    const functionResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
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
    
    console.log(`   Status: ${functionResponse.status}`);
    
    if (functionResponse.ok) {
      const data = await functionResponse.json();
      const message = data.choices?.[0]?.message;
      
      console.log(`   Has function call: ${!!message?.function_call}`);
      console.log(`   Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`   Content: ${message?.content?.substring(0, 80)}...`);
      
      if (message?.function_call) {
        console.log('   ✅ Function calling is working!');
        console.log(`   Function: ${message.function_call.name}`);
        console.log(`   Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('   ❌ Function calling not working');
        console.log('   This suggests the production API is not configured for function calling');
      }
    }
    
    // Test 3: Check if the issue is with the request format
    console.log('\n3️⃣ Testing different request format...');
    const altResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You must use function calls for shape creation.' },
          { role: 'user', content: 'create a blue circle' }
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
        temperature: 0.2
      })
    });
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      const altMessage = altData.choices?.[0]?.message;
      
      console.log(`   Alternative format - Has function call: ${!!altMessage?.function_call}`);
      if (altMessage?.function_call) {
        console.log('   ✅ Alternative format works!');
        console.log(`   Function: ${altMessage.function_call.name}`);
      } else {
        console.log('   ❌ Alternative format also fails');
        console.log('   This confirms the production API is not using function calling');
      }
    }
    
    // Test 4: Check if the issue is with the model or API key
    console.log('\n4️⃣ Testing with explicit model specification...');
    const modelResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
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
        model: 'gpt-4o-mini',
        temperature: 0.2
      })
    });
    
    if (modelResponse.ok) {
      const modelData = await modelResponse.json();
      const modelMessage = modelData.choices?.[0]?.message;
      
      console.log(`   Model test - Has function call: ${!!modelMessage?.function_call}`);
      if (modelMessage?.function_call) {
        console.log('   ✅ Model specification works!');
      } else {
        console.log('   ❌ Model specification also fails');
      }
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
  
  console.log('\n🔍 Analysis:');
  console.log('If all tests show "Has function call: false", then the production API');
  console.log('is not properly configured for function calling, regardless of deployment status.');
  console.log('\nPossible causes:');
  console.log('1. The production API endpoint is not using the updated code');
  console.log('2. There\'s a caching issue preventing the update');
  console.log('3. The API endpoint has a different configuration than expected');
  console.log('4. The OpenAI API key or model configuration is different');
}

debugProductionDirect();
