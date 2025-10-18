/**
 * Simple LangSmith Test
 * 
 * Quick test to verify LangSmith integration is working.
 * Run this after starting the server to test the traced endpoint.
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

async function testTracedEndpoint() {
  console.log('🧪 Testing LangSmith traced endpoint...\n');

  try {
    const response = await fetch(`${SERVER_URL}/api/ai-chat-traced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'What is 2 + 2?'
          }
        ],
        canvasState: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Test successful!');
    console.log('📊 Response:', result.choices[0].message.content);
    console.log('');
    console.log('🔍 Check your LangSmith dashboard for traces!');
    console.log('🌐 https://smith.langchain.com/');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Make sure the server is running:');
    console.log('  npm run dev:server');
  }
}

testTracedEndpoint();
