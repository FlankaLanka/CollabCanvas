# Production AI Debugging Guide

## 🚨 **Most Common Issues & Solutions**

### **Issue 1: Missing OpenAI API Key**
**Symptoms:** AI generates text instead of function calls
**Solution:** 
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your OpenAI API key
3. Make sure it's set for "Production, Preview, and Development"
4. Redeploy your application

### **Issue 2: API Endpoint Not Updated**
**Symptoms:** Still getting old behavior
**Solution:**
1. Check if Vercel has deployed the latest changes
2. Go to Vercel Dashboard → Deployments
3. Look for the latest deployment with commit `c5c396b`
4. If not deployed, trigger a new deployment

### **Issue 3: Import Error in Production**
**Symptoms:** API endpoint returns 500 error
**Solution:**
The `api/ai-functions.js` file might not be accessible. Check Vercel function logs.

## 🔧 **Quick Diagnostic Steps**

### **Step 1: Check Browser Console**
Open your production app and try "create a blue circle". Look for these logs:

**Expected (Working):**
```
📝 System prompt length: 2500+
🔧 Functions provided: 8
📤 OpenAI API Request Debug: { hasFunctions: true, functionCallMode: 'auto' }
📥 Raw OpenAI Response Debug: { hasFunctionCall: true, functionName: 'createShape' }
```

**Problem (Not Working):**
```
❌ OpenAI API key not configured
⚠️ SAFE-GUARD TRIGGERED: Model returned text without function call!
💬 AI provided text response (no function call)
```

### **Step 2: Check Vercel Function Logs**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/ai-chat` function
3. Check the logs for errors

### **Step 3: Test API Endpoint Directly**
Replace `YOUR_VERCEL_URL` with your actual Vercel URL and run:

```bash
curl -X POST https://YOUR_VERCEL_URL.vercel.app/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "create a blue circle"}],
    "functions": [{"name": "createShape", "description": "Create a shape", "parameters": {"type": "object", "properties": {"shapeType": {"type": "string"}, "x": {"type": "number"}, "y": {"type": "number"}}, "required": ["shapeType", "x", "y"]}}],
    "function_call": "auto",
    "canvasState": {"shapes": [], "totalShapes": 0}
  }'
```

**Expected Response:**
```json
{
  "choices": [{
    "message": {
      "function_call": {
        "name": "createShape",
        "arguments": "{\"shapeType\":\"circle\",\"x\":0,\"y\":0,\"fill\":\"blue\"}"
      }
    }
  }]
}
```

**Problem Response:**
```json
{
  "choices": [{
    "message": {
      "content": "I'll create a blue circle for you..."
    }
  }]
}
```

## 🎯 **Next Steps**

1. **Check your Vercel environment variables** for `OPENAI_API_KEY`
2. **Test the API endpoint** with the curl command above
3. **Check browser console** for debugging logs
4. **Let me know what you find** and I'll help fix the specific issue

The most likely issue is missing environment variables in Vercel!
