#!/usr/bin/env node

/**
 * Production AI Debugging Script
 * 
 * This script helps debug the difference between local and production AI behavior.
 * Run this in production to identify why AI generates text instead of shapes.
 */

const fetch = require('node-fetch');

// Configuration
const PRODUCTION_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const TEST_MESSAGE = 'create a blue circle';

async function debugProductionAI() {
  console.log('🔍 Starting Production AI Debug...\n');
  
  // Test 1: Check if AI endpoint exists
  console.log('1️⃣ Testing AI endpoint availability...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: TEST_MESSAGE }],
        functions: [],
        function_call: 'auto'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      console.log('   ❌ AI endpoint not found - check deployment');
      return;
    }
    
    const data = await response.json();
    console.log('   ✅ AI endpoint responding');
    console.log(`   Response type: ${data.choices ? 'OpenAI format' : 'Custom format'}`);
    
  } catch (error) {
    console.log(`   ❌ AI endpoint error: ${error.message}`);
    return;
  }
  
  // Test 2: Check function calling
  console.log('\n2️⃣ Testing function calling...');
  try {
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
            content: TEST_MESSAGE
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
        function_call: 'auto'
      })
    });
    
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Has function call: ${!!message?.function_call}`);
    console.log(`   Function name: ${message?.function_call?.name || 'none'}`);
    console.log(`   Has content: ${!!message?.content}`);
    console.log(`   Content preview: ${message?.content?.substring(0, 50)}...`);
    
    if (message?.function_call) {
      console.log('   ✅ Function calling working');
    } else {
      console.log('   ❌ Function calling not working - AI generating text instead');
    }
    
  } catch (error) {
    console.log(`   ❌ Function calling test failed: ${error.message}`);
  }
  
  // Test 3: Check environment variables
  console.log('\n3️⃣ Checking environment variables...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }],
        functions: [],
        function_call: 'auto'
      })
    });
    
    if (response.status === 500) {
      const errorData = await response.json();
      if (errorData.error?.includes('OpenAI API key')) {
        console.log('   ❌ OpenAI API key not configured');
      } else {
        console.log(`   ❌ Server error: ${errorData.error}`);
      }
    } else {
      console.log('   ✅ Environment variables appear to be configured');
    }
    
  } catch (error) {
    console.log(`   ❌ Environment check failed: ${error.message}`);
  }
  
  console.log('\n🏁 Debug complete!');
  console.log('\nNext steps:');
  console.log('1. Check Vercel environment variables for OPENAI_API_KEY');
  console.log('2. Verify the AI endpoint is working correctly');
  console.log('3. Check browser console for detailed logs');
  console.log('4. Compare local vs production behavior');
}

// Run the debug script
if (require.main === module) {
  debugProductionAI().catch(console.error);
}

module.exports = { debugProductionAI };
