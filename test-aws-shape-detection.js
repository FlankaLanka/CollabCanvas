import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AWS_ENDPOINT = 'https://vtxv073yg9.execute-api.us-east-1.amazonaws.com/api/ai-chat';

async function testAWSShapeDetection() {
  console.log('🧪 Testing AWS Shape Detection');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(AWS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Rotate the text 45 degrees'
          }
        ],
        canvasState: {
          shapes: [
            {
              id: 'text-1',
              type: 'text',
              x: 100,
              y: 100,
              text: 'Hello World',
              fill: '#1F2937'
            },
            {
              id: 'circle-1',
              type: 'circle',
              x: 200,
              y: 200,
              radiusX: 50,
              radiusY: 50,
              fill: '#3B82F6'
            }
          ],
          totalShapes: 2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ AWS endpoint responding');
    console.log('📊 Response has choices:', !!result.choices);
    console.log('🔧 Has tool calls:', !!result.choices?.[0]?.message?.tool_calls);
    
    if (result.choices?.[0]?.message?.tool_calls) {
      const toolCall = result.choices[0].message.tool_calls[0];
      console.log('🔧 Tool call function:', toolCall.function.name);
      console.log('🔧 Tool call arguments:', toolCall.function.arguments);
      
      const args = JSON.parse(toolCall.function.arguments);
      console.log('🎯 Shape ID used:', args.shapeId);
      console.log('🎯 Degrees:', args.degrees);
      
      if (args.shapeId === 'text' && args.degrees === 45) {
        console.log('✅ SUCCESS: AWS Agent correctly identified "text" and used 45 degrees');
      } else {
        console.log('❌ FAILED: AWS Agent did not use correct parameters');
        console.log('📝 Expected: shapeId="text", degrees=45');
        console.log('📝 Actual:', args);
      }
    } else {
      console.log('❌ No tool calls found in AWS response');
      console.log('📝 Content:', result.choices?.[0]?.message?.content);
    }
    
  } catch (error) {
    console.error('❌ AWS Test failed:', error.message);
  }
  
  console.log('\n🎉 AWS Test completed!');
}

// Run the test
testAWSShapeDetection().catch(console.error);
