#!/usr/bin/env node

/**
 * Production AI Diagnostic Script
 * 
 * This script tests the production AI endpoint to identify why it's generating
 * text instead of function calls. Run this to diagnose the issue.
 */

const fetch = require('node-fetch');

// Configuration
const PRODUCTION_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const TEST_COMMANDS = [
  'create a blue circle',
  'add a red rectangle',
  'make a green triangle'
];

async function testProductionAI() {
  console.log('🔍 Testing Production AI Endpoint...\n');
  console.log(`📍 Production URL: ${PRODUCTION_URL}\n`);
  
  for (const command of TEST_COMMANDS) {
    console.log(`🧪 Testing: "${command}"`);
    console.log('─'.repeat(50));
    
    try {
      // Test the production AI endpoint
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
              content: command
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
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const message = data.choices?.[0]?.message;
        
        console.log(`   ✅ Response received`);
        console.log(`   📝 Has function call: ${!!message?.function_call}`);
        console.log(`   🔧 Function name: ${message?.function_call?.name || 'none'}`);
        console.log(`   📄 Has content: ${!!message?.content}`);
        console.log(`   📄 Content preview: ${message?.content?.substring(0, 100)}...`);
        
        if (message?.function_call) {
          console.log(`   ✅ SUCCESS: Function calling working`);
          console.log(`   🔧 Function: ${message.function_call.name}`);
          console.log(`   📋 Arguments: ${message.function_call.arguments}`);
        } else {
          console.log(`   ❌ FAILURE: No function call - AI generating text instead`);
          console.log(`   📄 Full content: ${message?.content}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        console.log(`   📄 Error details: ${JSON.stringify(errorData, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Production AI testing complete!');
  console.log('\n📋 Expected Results:');
  console.log('✅ Each command should return a function call (createShape)');
  console.log('✅ Function should have proper arguments (shapeType, x, y, fill)');
  console.log('❌ If you see text responses, the production endpoint is not configured for function calling');
  console.log('\n🔧 Next Steps:');
  console.log('1. Check Vercel environment variables for OPENAI_API_KEY');
  console.log('2. Verify the production API endpoint is using the updated code');
  console.log('3. Check Vercel function logs for detailed debugging information');
}

// Run the test
if (require.main === module) {
  testProductionAI().catch(console.error);
}

module.exports = { testProductionAI };
