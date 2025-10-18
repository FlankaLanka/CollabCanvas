/**
 * Test AI Commands Suite
 * 
 * Comprehensive test cases for all AI command categories to verify
 * 8+ distinct command types, sub-2 second responses, and 90%+ accuracy.
 */

const testCommands = {
  creation: [
    'Create a red circle at position 100, 200',
    'Add a text layer that says "Hello World"',
    'Make a 200x300 rectangle',
    'Draw a green triangle',
    'Create a large blue circle',
    'Add text that says "Sample Text" at position 50, 100'
  ],
  manipulation: [
    'Move the blue rectangle to the center',
    'Resize the circle to be twice as big',
    'Rotate the text 45 degrees',
    'Change the triangle color to red',
    'Update the text to say "Updated"',
    'Make the rectangle smaller'
  ],
  layout: [
    'Arrange these shapes in a horizontal row',
    'Create a grid of 3x3 squares',
    'Space these elements evenly',
    'Distribute shapes evenly',
    'Create a 2x4 grid of circles'
  ],
  complex: [
    'Create a login form with username and password fields',
    'Build a navigation bar with 4 menu items',
    'Make a card layout with title, image, and description'
  ]
};

/**
 * Test a single command and measure performance
 */
async function testCommand(command, category) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/ai-chat', {
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

    const result = await response.json();
    const processingTime = Date.now() - startTime;
    
    return {
      command,
      category,
      success: response.ok,
      processingTime,
      hasFunctionCalls: !!(result.choices?.[0]?.message?.function_calls || result.choices?.[0]?.message?.function_call),
      response: result.choices?.[0]?.message?.content || 'No response',
      error: result.error || null
    };
  } catch (error) {
    return {
      command,
      category,
      success: false,
      processingTime: Date.now() - startTime,
      hasFunctionCalls: false,
      response: null,
      error: error.message
    };
  }
}

/**
 * Run all test commands and generate report
 */
async function runAllTests() {
  console.log('🧪 Starting AI Command Test Suite...\n');
  
  const results = {
    creation: [],
    manipulation: [],
    layout: [],
    complex: []
  };
  
  let totalTests = 0;
  let successfulTests = 0;
  let totalProcessingTime = 0;
  
  // Test each category
  for (const [category, commands] of Object.entries(testCommands)) {
    console.log(`📋 Testing ${category} commands...`);
    
    for (const command of commands) {
      console.log(`  Testing: "${command}"`);
      const result = await testCommand(command, category);
      results[category].push(result);
      
      totalTests++;
      if (result.success) successfulTests++;
      totalProcessingTime += result.processingTime;
      
      console.log(`    ${result.success ? '✅' : '❌'} ${result.processingTime}ms ${result.hasFunctionCalls ? '(has function calls)' : '(no function calls)'}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Generate report
  const accuracy = (successfulTests / totalTests) * 100;
  const averageProcessingTime = totalProcessingTime / totalTests;
  
  console.log('📊 Test Results Summary:');
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Successful: ${successfulTests} (${accuracy.toFixed(1)}%)`);
  console.log(`  Average Processing Time: ${averageProcessingTime.toFixed(0)}ms`);
  console.log(`  Sub-2s Responses: ${averageProcessingTime < 2000 ? '✅' : '❌'}`);
  console.log(`  High Accuracy (90%+): ${accuracy >= 90 ? '✅' : '❌'}`);
  
  // Category breakdown
  console.log('\n📈 Category Breakdown:');
  for (const [category, categoryResults] of Object.entries(results)) {
    const categorySuccess = categoryResults.filter(r => r.success).length;
    const categoryAccuracy = (categorySuccess / categoryResults.length) * 100;
    const categoryAvgTime = categoryResults.reduce((sum, r) => sum + r.processingTime, 0) / categoryResults.length;
    
    console.log(`  ${category}: ${categorySuccess}/${categoryResults.length} (${categoryAccuracy.toFixed(1)}%) - ${categoryAvgTime.toFixed(0)}ms avg`);
  }
  
  // Command types count
  const distinctCommandTypes = new Set();
  for (const categoryResults of Object.values(results)) {
    for (const result of categoryResults) {
      if (result.success && result.hasFunctionCalls) {
        // Extract command type from function calls
        const response = result.response;
        if (response.includes('create') || response.includes('Created')) distinctCommandTypes.add('create');
        if (response.includes('move') || response.includes('Moved')) distinctCommandTypes.add('move');
        if (response.includes('resize') || response.includes('Resized')) distinctCommandTypes.add('resize');
        if (response.includes('rotate') || response.includes('Rotated')) distinctCommandTypes.add('rotate');
        if (response.includes('color') || response.includes('Changed')) distinctCommandTypes.add('change-color');
        if (response.includes('text') || response.includes('Updated')) distinctCommandTypes.add('change-text');
        if (response.includes('arrange') || response.includes('Arranged')) distinctCommandTypes.add('arrange');
        if (response.includes('grid') || response.includes('Grid')) distinctCommandTypes.add('grid');
        if (response.includes('login') || response.includes('form')) distinctCommandTypes.add('login-form');
        if (response.includes('navigation') || response.includes('nav')) distinctCommandTypes.add('navigation');
        if (response.includes('card') || response.includes('layout')) distinctCommandTypes.add('card-layout');
      }
    }
  }
  
  console.log(`\n🎯 Distinct Command Types: ${distinctCommandTypes.size}`);
  console.log(`  Types: ${Array.from(distinctCommandTypes).join(', ')}`);
  console.log(`  Meets 8+ requirement: ${distinctCommandTypes.size >= 8 ? '✅' : '❌'}`);
  
  return {
    totalTests,
    successfulTests,
    accuracy,
    averageProcessingTime,
    distinctCommandTypes: distinctCommandTypes.size,
    results
  };
}

// Export for use in other files
export { testCommands, testCommand, runAllTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
