import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LOCAL_ENDPOINT = 'http://localhost:3000/api/ai-chat';
const AWS_ENDPOINT = 'https://vtxv073yg9.execute-api.us-east-1.amazonaws.com/api/ai-chat';

async function testEndpoint(endpoint, name) {
  console.log(`\n🧪 Testing ${name} endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Create a blue circle at position 100, 100'
          }
        ],
        canvasState: {
          shapes: [],
          totalShapes: 0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ ${name} endpoint working`);
    console.log(`📊 Response has choices: ${!!result.choices}`);
    console.log(`🔧 Has tool calls: ${!!result.choices?.[0]?.message?.tool_calls}`);
    console.log(`📝 Content: ${result.choices?.[0]?.message?.content?.substring(0, 100)}...`);
    
    return result;
  } catch (error) {
    console.error(`❌ ${name} endpoint failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing AI Endpoints');
  console.log('='.repeat(50));
  
  // Test local endpoint
  const localResult = await testEndpoint(LOCAL_ENDPOINT, 'LOCAL');
  
  // Test AWS endpoint
  const awsResult = await testEndpoint(AWS_ENDPOINT, 'AWS');
  
  // Compare results
  console.log('\n📊 Comparison Results:');
  console.log('='.repeat(50));
  
  if (localResult && awsResult) {
    const localHasToolCalls = !!localResult.choices?.[0]?.message?.tool_calls;
    const awsHasToolCalls = !!awsResult.choices?.[0]?.message?.tool_calls;
    
    console.log(`✅ Both endpoints responding`);
    console.log(`🔧 Local has tool calls: ${localHasToolCalls}`);
    console.log(`🔧 AWS has tool calls: ${awsHasToolCalls}`);
    console.log(`🎯 Identical behavior: ${localHasToolCalls === awsHasToolCalls ? 'YES' : 'NO'}`);
    
    if (localHasToolCalls && awsHasToolCalls) {
      const localToolName = localResult.choices[0].message.tool_calls[0]?.function?.name;
      const awsToolName = awsResult.choices[0].message.tool_calls[0]?.function?.name;
      console.log(`🔧 Local tool: ${localToolName}`);
      console.log(`🔧 AWS tool: ${awsToolName}`);
      console.log(`🎯 Same tool called: ${localToolName === awsToolName ? 'YES' : 'NO'}`);
    }
  } else {
    console.log('❌ One or both endpoints failed');
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the tests
runTests().catch(console.error);
