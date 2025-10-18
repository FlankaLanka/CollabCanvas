# AI Agent Production Debugging Guide

## Problem Summary
- ✅ **Local**: AI correctly calls `createShape()` and spawns shapes
- ❌ **Production**: AI generates text instead of creating shapes

## Debugging Steps Implemented

### 1. Tool Registration & Availability ✅
**Added to `src/services/ai.js`:**
```javascript
// DEBUG: Log available canvasAPI methods
console.log('🔧 Available canvasAPI tools:', Object.keys(canvasAPI));
console.log('🔧 canvasAPI.createShape exists:', typeof canvasAPI.createShape === 'function');
console.log('🔧 canvasAPI.createMultipleShapes exists:', typeof canvasAPI.createMultipleShapes === 'function');
```

**Added to `src/services/canvasAPI.js`:**
```javascript
// DEBUG: Log CanvasAPI initialization
console.log('🎨 CanvasAPI initialized:', {
  hasCanvas: !!this.canvas,
  hasStore: !!this.canvas?.store,
  hasShapes: !!this.canvas?.shapes,
  canvasKeys: Object.keys(this.canvas || {}),
  environment: typeof window !== 'undefined' ? 'browser' : 'server'
});
```

### 2. System Prompt & Tool Descriptions ✅
**Added to `src/services/ai.js`:**
```javascript
// DEBUG: Log system prompt and tool definitions
console.log('📝 AI_FUNCTIONS available:', AI_FUNCTIONS.length);
console.log('📝 createShape function exists:', AI_FUNCTIONS.find(f => f.name === 'createShape'));
console.log('📝 createMultipleShapes function exists:', AI_FUNCTIONS.find(f => f.name === 'createMultipleShapes'));
```

### 3. Environment Variables & API Endpoints ✅
**Added to `server.js`:**
```javascript
// DEBUG: Log request details
console.log('🔍 AI Request Debug:', {
  hasMessages: !!messages,
  messagesCount: messages?.length,
  hasFunctions: !!functions,
  functionsCount: functions?.length,
  hasFunctionCall: !!function_call,
  functionCallType: function_call,
  hasCanvasState: !!canvasState,
  userMessage: messages?.[messages.length - 1]?.content?.substring(0, 50) + '...'
});
```

### 4. Tool Calls & Returned Actions ✅
**Added to `src/services/ai.js`:**
```javascript
// DEBUG: Log what the AI decided to do
console.log('🤖 AI Decision:', {
  hasFunctionCall: !!responseMessage.function_call,
  functionName: responseMessage.function_call?.name,
  hasContent: !!responseMessage.content,
  contentPreview: responseMessage.content?.substring(0, 50) + '...'
});

console.log('🔧 AI decided to run:', functionCall.name, 'with params:', JSON.parse(functionCall.arguments));
```

### 5. Canvas State Validation ✅
**Added to `src/services/ai.js`:**
```javascript
// DEBUG: Log canvas state before execution
const canvasStateBefore = this.canvasAPI.getCanvasState();
console.log('📊 Canvas state BEFORE execution:', {
  shapesCount: canvasStateBefore.totalShapes,
  shapes: canvasStateBefore.shapes.slice(0, 3).map(s => `${s.type} at (${s.x}, ${s.y})`)
});

// DEBUG: Verify shape was actually created
const canvasStateAfter = this.canvasAPI.getCanvasState();
console.log('📊 Canvas state AFTER createShape:', {
  shapesCount: canvasStateAfter.totalShapes,
  newShapes: canvasStateAfter.shapes.slice(canvasStateBefore.totalShapes),
  shapeCreated: canvasStateAfter.totalShapes > canvasStateBefore.totalShapes
});
```

### 6. Safe-Guard Layer ✅
**Added to `src/services/ai.js`:**
```javascript
// SAFE-GUARD: Detect if user requested shape creation but got text response
const isShapeRequest = /create|add|make|draw|generate.*(shape|circle|rectangle|triangle|square)/i.test(userMessage);
if (isShapeRequest) {
  console.warn('⚠️ Safe-guard triggered: User requested shape creation but AI generated text response');
  aiResponse = `I understand you want to create a shape, but I'm having trouble with the shape creation system. Please try again, or if the problem persists, there may be a technical issue with the canvas system.`;
}

// SAFE-GUARD: Verify shape creation for shape-related commands
if (['createShape', 'createMultipleShapes'].includes(functionCall.name)) {
  const canvasStateAfter = this.canvasAPI.getCanvasState();
  const shapesBefore = currentCanvasState.totalShapes;
  const shapesAfter = canvasStateAfter.totalShapes;
  
  if (shapesAfter <= shapesBefore) {
    console.warn('⚠️ Safe-guard triggered: No shapes were created despite function call');
    aiResponse = `I attempted to create a shape but it didn't appear on the canvas. This might be a technical issue. Please try again or contact support if the problem persists.`;
  }
}
```

## How to Debug Production Issues

### Step 1: Check Browser Console
Open your production app and check the browser console for these logs:

**Expected logs for working AI:**
```
🤖 AICanvasService initialized (frontend mode)
🔧 Available canvasAPI tools: ['createShape', 'createMultipleShapes', ...]
🌍 Environment: { isDevelopment: false, aiEndpoint: '/api/ai-chat', hasCanvasAPI: true }
📡 Using API proxy (production)
📤 AI API Request: { endpoint: '/api/ai-chat', functionsCount: 50, hasCreateShape: true }
📥 AI API Response: { hasFunctionCall: true, functionName: 'createShape' }
🔧 AI decided to run: createShape with params: { shapeType: 'circle', x: 0, y: 0, fill: 'blue' }
🎨 CanvasAPI.createShape called: { shapeType: 'circle', x: 0, y: 0, fill: 'blue', hasCanvas: true }
✅ Function executed successfully: createShape
```

**Problem indicators:**
- Missing `🔧 AI decided to run:` = AI not calling functions
- `💬 AI provided text response (no function call)` = AI generating text instead
- `❌ OpenAI API key not configured` = Missing environment variable
- `❌ AI API error details:` = API endpoint issues

### Step 2: Check Environment Variables
In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Verify `OPENAI_API_KEY` is set
3. Ensure it's set for "Production, Preview, and Development"
4. Redeploy if you added/updated variables

### Step 3: Test API Endpoint
Run the debug script:
```bash
node debug-production-ai.js
```

### Step 4: Compare Local vs Production
**Local (working):**
- Uses `http://localhost:3001/api/ai-chat`
- Has `OPENAI_API_KEY` in environment
- Function calling works

**Production (broken):**
- Uses `/api/ai-chat` (Vercel serverless)
- May be missing `OPENAI_API_KEY`
- Falls back to text generation

## Common Issues & Solutions

### Issue 1: Missing OpenAI API Key
**Symptoms:** `❌ OpenAI API key not configured`
**Solution:** Add `OPENAI_API_KEY` to Vercel environment variables

### Issue 2: AI Generating Text Instead of Function Calls
**Symptoms:** `💬 AI provided text response (no function call)`
**Causes:**
- Missing OpenAI API key
- Function calling not enabled
- AI model not configured for function calling

**Solution:** Check environment variables and API configuration

### Issue 3: Function Called But No Shape Created
**Symptoms:** `🔧 AI decided to run: createShape` but no shape appears
**Causes:**
- Canvas API not properly connected
- Shape creation failing silently
- Canvas state not updating

**Solution:** Check canvas API connection and shape creation logic

### Issue 4: API Endpoint Not Working
**Symptoms:** `❌ AI API error details:` or 404 errors
**Solution:** Verify Vercel deployment and API endpoint configuration

## Testing Commands

### Test Shape Creation
Try these commands in production:
- "create a blue circle"
- "add a red rectangle"
- "make a green triangle"

### Expected Behavior
- AI should call `createShape` function
- Shape should appear on canvas
- Console should show function execution logs

### Debug Output
The debugging logs will show exactly where the process fails:
1. **Tool Registration**: Are canvas API methods available?
2. **System Prompt**: Are function definitions correct?
3. **API Request**: Is the request properly formatted?
4. **AI Response**: Is the AI calling functions or generating text?
5. **Function Execution**: Are functions being executed?
6. **Shape Creation**: Are shapes actually being created?

## Next Steps

1. **Deploy the debugging changes** to production
2. **Test with a simple command** like "create a blue circle"
3. **Check browser console** for the debugging logs
4. **Identify the failure point** from the logs
5. **Apply the appropriate fix** based on the issue

The comprehensive debugging will show exactly where the production environment differs from local, allowing you to fix the specific issue causing the AI to generate text instead of creating shapes.
