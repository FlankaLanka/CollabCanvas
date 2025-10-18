# AWS LangSmith Integration Deployment Guide

This guide covers deploying the AWS AI agent with LangSmith tracing enabled.

## 🚀 Quick Setup

### 1. Environment Variables

Add these environment variables to your AWS deployment:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Required: LangSmith Configuration
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=aws-ai-agent
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com

# Optional: CORS origins
ALLOWED_ORIGINS=https://collab-canvas-virid.vercel.app,http://localhost:5173,http://localhost:3000
```

### 2. Deploy to AWS Lambda

```bash
# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export LANGCHAIN_API_KEY="your-langsmith-api-key"
export LANGCHAIN_PROJECT="aws-ai-agent"
export LANGCHAIN_TRACING_V2="true"

# Deploy
cd aws-ai-server
npm install
npx serverless deploy
```

### 3. Deploy to EC2

```bash
# On your EC2 instance
export OPENAI_API_KEY="your-openai-api-key"
export LANGCHAIN_API_KEY="your-langsmith-api-key"
export LANGCHAIN_PROJECT="aws-ai-agent"
export LANGCHAIN_TRACING_V2="true"

# Start the server
npm install
npm start
```

## 🔍 What's Included

### New Features

1. **LangSmith Tracing**: All AI operations are automatically traced
2. **Fallback Support**: Falls back to OpenAI if LangSmith fails
3. **Health Check**: Updated to show LangSmith status
4. **Error Handling**: Graceful degradation if tracing is unavailable

### Files Modified

- `server.js` - Added LangSmith integration
- `langsmith.js` - New LangSmith service for AWS
- `package.json` - Added LangSmith dependencies
- `serverless.yml` - Added environment variables
- `env.example` - Updated with LangSmith config

## 📊 LangSmith Dashboard

Visit [https://smith.langchain.com/](https://smith.langchain.com/) to see your traces.

### What You'll See

1. **Project**: `aws-ai-agent`
2. **Run Types**:
   - `aws-ai-command` - Main AI operations
   - `llm` - Individual LLM calls
   - `chain` - Complete operation chains

3. **Traced Operations**:
   - All OpenAI API calls
   - Function calls and results
   - Reasoning steps
   - Performance metrics
   - Error handling

## 🧪 Testing

### Local Testing

```bash
# Test the AWS LangSmith integration
node test-langsmith-aws.js
```

### Production Testing

```bash
# Test the deployed endpoint
curl -X POST https://your-api-gateway-url/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Create a blue circle"}],
    "canvasState": {}
  }'
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | ✅ | - |
| `LANGCHAIN_API_KEY` | LangSmith API key | ✅ | - |
| `LANGCHAIN_PROJECT` | Project name | ❌ | `aws-ai-agent` |
| `LANGCHAIN_TRACING_V2` | Enable tracing | ❌ | `true` |
| `LANGCHAIN_ENDPOINT` | LangSmith endpoint | ❌ | `https://api.smith.langchain.com` |

### Disabling Tracing

To disable LangSmith tracing, set:
```bash
LANGCHAIN_TRACING_V2=false
```

The system will fall back to regular OpenAI calls without tracing.

## 🚀 Deployment Options

### Option 1: AWS Lambda (Serverless)

**Benefits:**
- ✅ Pay per request
- ✅ Auto-scaling
- ✅ No server management
- ✅ Built-in monitoring

**Deploy:**
```bash
npx serverless deploy
```

### Option 2: EC2 (Traditional Server)

**Benefits:**
- ✅ Full control
- ✅ Persistent connections
- ✅ Custom configurations

**Deploy:**
```bash
npm start
```

## 📈 Monitoring

### Health Check

```bash
curl https://your-api-gateway-url/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "lambda",
  "hasOpenAIKey": true,
  "langsmithEnabled": true,
  "langsmithProject": "aws-ai-agent"
}
```

### LangSmith Dashboard

- **Runs**: Each AI interaction creates a trace
- **Performance**: Latency and token usage
- **Errors**: Failed operations and debugging
- **Collaboration**: Share insights with team

## 🐛 Troubleshooting

### Common Issues

1. **"LangSmith configuration incomplete"**
   - Check that `LANGCHAIN_API_KEY` is set
   - Verify your LangSmith API key is valid

2. **"Failed to initialize LangSmith"**
   - Check internet connectivity
   - Verify LangSmith endpoint is accessible
   - Check API key permissions

3. **"No traces appearing"**
   - Ensure `LANGCHAIN_TRACING_V2=true`
   - Check that project exists in LangSmith
   - Verify API key has write permissions

### Debug Information

The server logs will show:
- LangSmith initialization status
- Tracing enabled/disabled status
- API key configuration status
- Error details for failed operations

## 🔄 Integration Benefits

### For Development
- **Debug AI reasoning** - See exactly how the AI makes decisions
- **Optimize prompts** - Identify what works best
- **Monitor performance** - Track response times and costs

### For Production
- **Monitor usage** - Track API calls and costs
- **Debug issues** - Quickly identify and fix problems
- **Improve reliability** - Learn from failed operations

## 📚 Next Steps

1. **Deploy with tracing enabled**
2. **Monitor your first runs** in LangSmith
3. **Set up alerts** for failed operations
4. **Analyze performance** to optimize workflows
5. **Share insights** with your team

For more advanced usage, see the [LangSmith documentation](https://docs.smith.langchain.com/).
