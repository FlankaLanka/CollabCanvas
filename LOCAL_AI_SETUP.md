# Local AI Server Setup

This guide explains how to run your AI agent locally for development and testing, using the exact same logic as your AWS deployment.

## 🎯 Overview

The local AI server (`localServer.js`) imports and reuses the exact same:
- AI_FUNCTIONS from `aws-ai-server/ai-functions.js`
- OpenAI API calls and logic
- Request/response handling
- Tool calling behavior

This ensures **identical behavior** between local and AWS environments.

## 🚀 Quick Start

### 1. Start the Local AI Server

```bash
# Start just the AI server
npm run dev:agent

# Or start both AI server and frontend
npm run dev:local
```

You should see:
```
🚀 Local AI agent running at http://localhost:3000/api/ai-chat
📊 Available functions: 46
🔧 OpenAI API: Configured
🌍 Environment: LOCAL
```

### 2. Switch Frontend to Use Local Server

Edit your `.env` file:
```bash
# Use local AI server instead of AWS
VITE_USE_LOCAL_AI=true
```

Or set a custom AI server URL:
```bash
# Custom AI server URL (overrides VITE_USE_LOCAL_AI)
VITE_AI_SERVER_URL=http://localhost:3000/api/ai-chat
```

### 3. Restart Your Frontend

```bash
npm run dev
```

The frontend will now use your local AI server instead of AWS.

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_USE_LOCAL_AI` | Use local AI server instead of AWS | `false` |
| `VITE_AI_SERVER_URL` | Custom AI server URL (overrides above) | `undefined` |
| `OPENAI_API_KEY` | Your OpenAI API key | Required |

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:agent` | Start local AI server only |
| `npm run dev:local` | Start both AI server and frontend |
| `npm run dev` | Start frontend only (uses configured AI endpoint) |

## 🧪 Testing

### Test Local Server
```bash
# Test the local AI server
node test-local-ai.js
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Debug Info
```bash
curl http://localhost:3000/debug
```

## 🔄 Switching Between Local and AWS

### Use Local AI Server
```bash
# In .env
VITE_USE_LOCAL_AI=true
```

### Use AWS (Production)
```bash
# In .env
VITE_USE_LOCAL_AI=false
```

### Use Custom Server
```bash
# In .env
VITE_AI_SERVER_URL=http://your-custom-server.com/api/ai-chat
```

## 🏗️ Architecture

```
Frontend (ai.js)
    ↓ (HTTP request)
Local Server (localServer.js)
    ↓ (imports)
AWS Functions (aws-ai-server/ai-functions.js)
    ↓ (OpenAI API call)
OpenAI API
```

## ✅ Verification

The local server should behave **identically** to AWS:

1. **Same Functions**: Uses the exact same 46 AI_FUNCTIONS
2. **Same Logic**: Identical request/response handling
3. **Same Tools**: Same tool calling behavior
4. **Same Results**: Identical AI responses and function calls

## 🐛 Troubleshooting

### Local Server Won't Start
- Check if port 3000 is available
- Verify `OPENAI_API_KEY` is set
- Check console for error messages

### Frontend Can't Connect
- Ensure local server is running (`npm run dev:agent`)
- Check `VITE_USE_LOCAL_AI=true` in `.env`
- Verify no CORS issues in browser console

### Different Behavior
- Ensure you're using the same OpenAI API key
- Check that both servers use the same AI_FUNCTIONS
- Compare request payloads in network tab

## 🎉 Benefits

- **Fast Development**: Test changes instantly without AWS deployment
- **Cost Effective**: No AWS Lambda costs during development
- **Identical Behavior**: Same logic, same results
- **Easy Switching**: Toggle between local and AWS with one variable
- **Full Control**: Debug and modify AI behavior locally

## 📝 Notes

- The local server uses the exact same code as AWS
- No new agent logic was created - it reuses existing functions
- Environment switching is seamless and requires no code changes
- All 46 AI functions are available locally
- Tool calling behavior is identical to production
