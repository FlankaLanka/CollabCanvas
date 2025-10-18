#!/usr/bin/env node

/**
 * Test Suite for Basic AI Commands
 * 
 * This script tests all the required basic commands to ensure they work correctly.
 * Run with: node test-basic-commands.js
 */

const API_ENDPOINT = 'http://localhost:3001/api/ai-chat';

async function testCommand(command, expectedFunction, expectedParams) {
  try {
    console.log(`\n🧪 Testing: "${command}"`);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: command
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;
    
    console.log(`📝 Response: ${message.content}`);
    
    // Check for function calls
    if (message.function_calls && message.function_calls.length > 0) {
      const functionCall = message.function_calls[0];
      console.log(`🔧 Function: ${functionCall.name}`);
      console.log(`📊 Arguments: ${functionCall.arguments}`);
      
      // Validate function call
      if (functionCall.name === expectedFunction) {
        const args = JSON.parse(functionCall.arguments);
        let valid = true;
        
        for (const [key, expectedValue] of Object.entries(expectedParams)) {
          if (args[key] !== expectedValue) {
            console.log(`❌ Parameter mismatch: ${key} = ${args[key]}, expected ${expectedValue}`);
            valid = false;
          }
        }
        
        if (valid) {
          console.log(`✅ PASS: Function call matches expected parameters`);
          return true;
        } else {
          console.log(`❌ FAIL: Function call parameters don't match expected values`);
          return false;
        }
      } else {
        console.log(`❌ FAIL: Expected function ${expectedFunction}, got ${functionCall.name}`);
        return false;
      }
    } else if (message.function_call) {
      const functionCall = message.function_call;
      console.log(`🔧 Function: ${functionCall.name}`);
      console.log(`📊 Arguments: ${functionCall.arguments}`);
      
      if (functionCall.name === expectedFunction) {
        const args = JSON.parse(functionCall.arguments);
        let valid = true;
        
        for (const [key, expectedValue] of Object.entries(expectedParams)) {
          if (args[key] !== expectedValue) {
            console.log(`❌ Parameter mismatch: ${key} = ${args[key]}, expected ${expectedValue}`);
            valid = false;
          }
        }
        
        if (valid) {
          console.log(`✅ PASS: Function call matches expected parameters`);
          return true;
        } else {
          console.log(`❌ FAIL: Function call parameters don't match expected values`);
          return false;
        }
      } else {
        console.log(`❌ FAIL: Expected function ${expectedFunction}, got ${functionCall.name}`);
        return false;
      }
    } else {
      console.log(`❌ FAIL: No function call found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Basic Command Tests...\n');
  
  const tests = [
    // Creation Commands
    {
      command: 'Create a triangle at position (100, 200)',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'triangle',
        x: 100,
        y: 200
      }
    },
    {
      command: 'Create a circle at (0, 0)',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'circle',
        x: 0,
        y: 0
      }
    },
    {
      command: 'Add a text layer that says Hello World',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'text',
        text: 'Hello World'
      }
    },
    {
      command: 'Make a 200x300 rectangle',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'rectangle',
        width: 200,
        height: 300
      }
    },
    {
      command: 'Create a red circle at position 0, 0',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'circle',
        x: 0,
        y: 0,
        fill: '#EF4444'
      }
    },
    {
      command: 'Create a triangle at position 100, -1000',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'triangle',
        x: 100,
        y: -1000
      }
    },
    {
      command: 'Create a circle at position -200, -500',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'circle',
        x: -200,
        y: -500
      }
    },
    {
      command: 'Create a rectangle at position 100, 100',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'rectangle',
        x: 100,
        y: 100
      }
    },
    {
      command: 'Create a triangle at position 0, 0',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'triangle',
        x: 0,
        y: 0
      }
    },
    {
      command: 'Create a circle at position -200, -300',
      expectedFunction: 'createShape',
      expectedParams: {
        shapeType: 'circle',
        x: -200,
        y: -300
      }
    },
    
    // Manipulation Commands
    {
      command: 'Resize the circle to be twice as big',
      expectedFunction: 'resizeShape',
      expectedParams: {
        shapeDescription: 'circle',
        scale: 2
      }
    },
    {
      command: 'Rotate the text 45 degrees',
      expectedFunction: 'rotateShape',
      expectedParams: {
        shapeDescription: 'text',
        degrees: 45
      }
    },
    {
      command: 'Change the triangle color to red',
      expectedFunction: 'changeShapeColor',
      expectedParams: {
        shapeDescription: 'triangle',
        color: '#EF4444'
      }
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testCommand(test.command, test.expectedFunction, test.expectedParams);
    if (result) {
      passed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The AI agent is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
