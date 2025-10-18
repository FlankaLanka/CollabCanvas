import fetch from 'node-fetch';

async function diagnoseOpenAI() {
  console.log('🔍 Diagnosing OpenAI API Configuration...\n');
  
  const PRODUCTION_URL = 'https://collab-canvas-virid.vercel.app';
  
  try {
    // Test 1: Check if the API key is working with a simple request
    console.log('1️⃣ Testing OpenAI API key with simple request...');
    
    const simpleResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ]
      })
    });
    
    console.log(`   Status: ${simpleResponse.status}`);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log(`   ✅ API key is working`);
      console.log(`   Model: ${simpleData.model}`);
      console.log(`   Response: ${simpleData.choices?.[0]?.message?.content?.substring(0, 50)}...`);
    } else {
      console.log(`   ❌ API key issue: ${simpleResponse.status}`);
      return;
    }
    
    // Test 2: Check if function calling is supported by the model
    console.log('\n2️⃣ Testing function calling support...');
    
    const functionResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat-v2`, {
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
      const functionData = await functionResponse.json();
      const message = functionData.choices?.[0]?.message;
      
      console.log(`   Has function call: ${!!message?.function_call}`);
      console.log(`   Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`   Content: ${message?.content?.substring(0, 50)}...`);
      console.log(`   Finish reason: ${functionData.choices?.[0]?.finish_reason}`);
      
      if (message?.function_call) {
        console.log('   ✅ Function calling is working!');
        console.log(`   Function: ${message.function_call.name}`);
        console.log(`   Arguments: ${message.function_call.arguments}`);
      } else {
        console.log('   ❌ Function calling not working');
        console.log('   This suggests the model or API key does not support function calling');
      }
    }
    
    // Test 3: Check if the issue is with the model version
    console.log('\n3️⃣ Testing with explicit model specification...');
    
    const modelResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat-v2`, {
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
        console.log('   This confirms the issue is not with the model version');
      }
    }
    
    // Test 4: Check if the issue is with the function definition format
    console.log('\n4️⃣ Testing with different function definition format...');
    
    const altFunctionResponse = await fetch(`${PRODUCTION_URL}/api/ai-chat-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'create a blue circle' }
        ],
        functions: [
          {
            name: 'createShape',
            description: 'Create a shape on the canvas',
            parameters: {
              type: 'object',
              properties: {
                shapeType: { 
                  type: 'string',
                  enum: ['circle', 'rectangle', 'triangle']
                },
                x: { type: 'number' },
                y: { type: 'number' },
                fill: { type: 'string' }
              },
              required: ['shapeType', 'x', 'y']
            }
          }
        ],
        function_call: 'auto'
      })
    });
    
    if (altFunctionResponse.ok) {
      const altFunctionData = await altFunctionResponse.json();
      const altFunctionMessage = altFunctionData.choices?.[0]?.message;
      
      console.log(`   Alternative format - Has function call: ${!!altFunctionMessage?.function_call}`);
      if (altFunctionMessage?.function_call) {
        console.log('   ✅ Alternative function format works!');
      } else {
        console.log('   ❌ Alternative function format also fails');
        console.log('   This confirms the issue is not with the function definition');
      }
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
  
  console.log('\n🔍 Analysis:');
  console.log('If all tests show "Has function call: false", then the issue is:');
  console.log('1. OpenAI API key does not have function calling permissions');
  console.log('2. The model does not support function calling');
  console.log('3. There\'s a configuration issue with the production environment');
  console.log('4. The Vercel function execution environment has limitations');
}

diagnoseOpenAI();
