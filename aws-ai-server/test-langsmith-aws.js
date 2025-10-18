/**
 * AWS LangSmith Integration Test Script
 * 
 * This script tests the LangSmith integration for the AWS AI agent.
 * It verifies that traces appear in the LangSmith dashboard for the production agent.
 * 
 * Usage: node test-langsmith-aws.js
 */

import dotenv from 'dotenv';
import awsLangSmithService from './langsmith.js';

// Load environment variables
dotenv.config();

async function testAWSLangSmithIntegration() {
  console.log('🧪 Testing AWS LangSmith Integration...\n');

  try {
    // Initialize the AWS LangSmith service
    console.log('1. Initializing AWS LangSmith service...');
    await awsLangSmithService.initialize();
    
    const status = awsLangSmithService.getStatus();
    console.log('✅ AWS LangSmith status:', status);
    console.log('');

    // Test 1: Simple math question
    console.log('2. Testing simple math question...');
    const mathResult = await awsLangSmithService.processCommand(
      'What is 2 + 2?',
      {},
      'You are a helpful AI assistant.'
    );
    console.log('📊 Math result:', mathResult.choices[0].message.content);
    console.log('');

    // Test 2: Canvas command
    console.log('3. Testing canvas command...');
    const canvasResult = await awsLangSmithService.processCommand(
      'Create a blue circle at position 100, 100',
      { shapes: [] },
      'You are an AI canvas assistant. Create shapes when requested.'
    );
    console.log('🎨 Canvas result:', canvasResult.choices[0].message.content);
    if (canvasResult.choices[0].message.function_call) {
      console.log('🔧 Function call:', canvasResult.choices[0].message.function_call);
    }
    console.log('');

    // Test 3: Multiple shapes command
    console.log('4. Testing multiple shapes command...');
    const multipleResult = await awsLangSmithService.processCommand(
      'Create 5 red rectangles in a row',
      { shapes: [] },
      'You are an AI canvas assistant. Create shapes when requested.'
    );
    console.log('🔢 Multiple shapes result:', multipleResult.choices[0].message.content);
    if (multipleResult.choices[0].message.function_call) {
      console.log('🔧 Function call:', multipleResult.choices[0].message.function_call);
    }
    console.log('');

    console.log('✅ All AWS LangSmith tests completed successfully!');
    console.log('');
    console.log('🔍 Check your LangSmith dashboard at: https://smith.langchain.com/');
    console.log(`📊 Project: ${awsLangSmithService.getProjectName()}`);
    console.log('');
    console.log('You should see traces for:');
    console.log('- aws-ai-command runs');
    console.log('- LLM calls with reasoning steps');
    console.log('- Tool usage and function calls');
    console.log('- Complete request/response chains');

  } catch (error) {
    console.error('❌ AWS LangSmith test failed:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that all environment variables are set:');
    console.error('   - OPENAI_API_KEY');
    console.error('   - LANGCHAIN_API_KEY');
    console.error('   - LANGCHAIN_PROJECT');
    console.error('   - LANGCHAIN_TRACING_V2=true');
    console.error('   - LANGCHAIN_ENDPOINT=https://api.smith.langchain.com');
    console.error('');
    console.error('2. Verify your LangSmith API key is valid');
    console.error('3. Check that the project exists in your LangSmith dashboard');
    process.exit(1);
  }
}

// Run the test
testAWSLangSmithIntegration();
