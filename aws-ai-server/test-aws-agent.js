#!/usr/bin/env node

/**
 * Test script for AWS AI Agent
 * 
 * This script tests the AWS AI agent to ensure it's working correctly.
 * Run this after deployment to verify everything is functioning.
 */

import fetch from 'node-fetch';

const AWS_ENDPOINT = process.env.AWS_ENDPOINT || 'http://localhost:3000';

async function testAWSAgent() {
  console.log('🧪 Testing AWS AI Agent...\n');
  console.log(`📍 Endpoint: ${AWS_ENDPOINT}\n`);
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${AWS_ENDPOINT}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health check passed');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Environment: ${healthData.environment}`);
      console.log(`   Has OpenAI Key: ${healthData.hasOpenAIKey}`);
    } else {
      console.log(`   ❌ Health check failed: ${healthResponse.status}`);
      return;
    }
    
    // Test 2: AI chat endpoint
    console.log('\n2️⃣ Testing AI chat endpoint...');
    const chatResponse = await fetch(`${AWS_ENDPOINT}/api/ai-chat`, {
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
    
    console.log(`   Status: ${chatResponse.status}`);
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      const message = chatData.choices?.[0]?.message;
      
      console.log('   ✅ AI chat endpoint working');
      console.log(`   Model: ${chatData.model}`);
      console.log(`   Has function call: ${!!message?.function_call}`);
      console.log(`   Function name: ${message?.function_call?.name || 'none'}`);
      console.log(`   Content: ${message?.content?.substring(0, 50)}...`);
      
      if (message?.function_call) {
        console.log('\n🎉 SUCCESS: AWS AI Agent is working perfectly!');
        console.log(`Function: ${message.function_call.name}`);
        console.log(`Arguments: ${message.function_call.arguments}`);
        console.log('\n✅ Your AWS AI agent is ready to use!');
        console.log(`📱 Update your frontend to use: ${AWS_ENDPOINT}`);
      } else {
        console.log('\n❌ AI agent is not calling functions');
        console.log('This suggests an issue with the OpenAI API key or configuration');
      }
    } else {
      const errorText = await chatResponse.text();
      console.log(`   ❌ AI chat failed: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the AWS agent is running');
    console.log('2. Check the endpoint URL is correct');
    console.log('3. Verify OPENAI_API_KEY is set');
    console.log('4. Check CORS configuration');
  }
}

// Run the test
testAWSAgent();
