# LangSmith Integration Guide

This project now includes comprehensive LangSmith tracing integration to monitor all AI agent runs, including reasoning, tool usage, and ReAct steps in the LangSmith dashboard.

## 🚀 Quick Start

### 1. Environment Setup

All required environment variables are already configured in your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxx
VITE_OPENAI_API_KEY=sk-xxxxxx

# LangSmith Configuration
LANGCHAIN_API_KEY=ls-xxxxxx
LANGCHAIN_PROJECT=my-agent
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 2. Dependencies

All required dependencies are already installed:
- `@langchain/openai`: ^0.6.16
- `langchain`: ^0.3.36
- `langsmith`: ^0.3.74

### 3. Start the Server

```bash
npm run dev:server
```

You'll see output like:
```
🤖 AI API server running on http://localhost:3001
🔑 OpenAI API key: Configured
📡 Endpoints:
   - http://localhost:3001/api/ai-chat (original)
   - http://localhost:3001/api/ai-chat-traced (with LangSmith tracing)
🔍 LangSmith tracing: Enabled
```

## 🔍 What's Included

### Services Created

1. **`src/services/langsmith.js`** - Core LangSmith service
   - Initializes traced ChatOpenAI client
   - Manages LangSmith configuration
   - Provides tracing utilities

2. **`src/services/tracedAI.js`** - Traced AI service
   - Wraps LangSmith service for easy use
   - Provides traced AI command processing
   - Handles function calling with tracing

### Server Integration

- **New endpoint**: `/api/ai-chat-traced` - Uses LangSmith tracing
- **Original endpoint**: `/api/ai-chat` - Unchanged for compatibility
- **Health check**: Updated to show LangSmith status

## 🧪 Testing the Integration

### Test 1: Direct Service Test

```bash
node test-langsmith.js
```

This will:
- Initialize the traced AI service
- Run test commands (math, canvas operations)
- Show you what traces will appear in LangSmith

### Test 2: Server Endpoint Test

1. Start the server: `npm run dev:server`
2. In another terminal: `node test-langsmith-simple.js`

This tests the `/api/ai-chat-traced` endpoint.

## 📊 LangSmith Dashboard

Visit [https://smith.langchain.com/](https://smith.langchain.com/) to see your traces.

### What You'll See

1. **Runs**: Each AI interaction creates a "run" in your project
2. **LLM Calls**: All OpenAI API calls are traced
3. **Tool Usage**: Function calls and their results
4. **ReAct Steps**: Reasoning and action steps
5. **Timing**: Performance metrics for each operation

### Project Structure

- **Project Name**: `my-agent` (configurable via `LANGCHAIN_PROJECT`)
- **Run Types**: 
  - `canvas-ai-command` - Main AI operations
  - `llm` - Individual LLM calls
  - `chain` - Complete operation chains

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `LANGCHAIN_API_KEY` | Your LangSmith API key | ✅ |
| `LANGCHAIN_PROJECT` | Project name in LangSmith | ✅ |
| `LANGCHAIN_TRACING_V2` | Enable tracing (set to `true`) | ✅ |
| `LANGCHAIN_ENDPOINT` | LangSmith API endpoint | Optional |

### Disabling Tracing

To disable LangSmith tracing, set:
```bash
LANGCHAIN_TRACING_V2=false
```

The system will fall back to regular OpenAI calls without tracing.

## 🎯 Usage Examples

### Using the Traced Endpoint

```javascript
// Send a request to the traced endpoint
const response = await fetch('http://localhost:3001/api/ai-chat-traced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Create 5 blue circles' }],
    canvasState: {}
  })
});

const result = await response.json();
```

### Direct Service Usage

```javascript
import tracedAIService from './src/services/tracedAI.js';

// Initialize the service
await tracedAIService.initialize();

// Process a command with tracing
const result = await tracedAIService.processCommand(
  'Create a red rectangle at position 100, 100',
  { shapes: [] }
);
```

## 🐛 Troubleshooting

### Common Issues

1. **"LangSmith configuration incomplete"**
   - Check that all environment variables are set
   - Verify your LangSmith API key is valid

2. **"Failed to initialize LangSmith"**
   - Check your internet connection
   - Verify the LangSmith endpoint is accessible
   - Check your API key permissions

3. **No traces appearing in dashboard**
   - Ensure `LANGCHAIN_TRACING_V2=true`
   - Check that the project exists in LangSmith
   - Verify your API key has the correct permissions

### Debug Information

The server provides debug information:
- LangSmith initialization status
- Tracing enabled/disabled status
- API key configuration status

Check the server logs for detailed error messages.

## 📈 Monitoring

### What Gets Traced

- **All LLM calls** to OpenAI
- **Function calls** and their results
- **Reasoning steps** in ReAct workflows
- **Tool usage** and responses
- **Performance metrics** (latency, token usage)
- **Error handling** and retries

### Dashboard Features

- **Run comparison** - Compare different AI runs
- **Performance analysis** - Identify bottlenecks
- **Cost tracking** - Monitor token usage
- **Error debugging** - Debug failed operations
- **Collaboration** - Share runs with team members

## 🔄 Integration with Existing Code

The integration is designed to be non-breaking:

- **Original endpoints** continue to work unchanged
- **New traced endpoints** provide enhanced monitoring
- **Fallback behavior** ensures the system works even if LangSmith is unavailable
- **Environment-based** configuration allows easy toggling

## 📚 Next Steps

1. **Monitor your first runs** in the LangSmith dashboard
2. **Set up alerts** for failed operations
3. **Analyze performance** to optimize your AI workflows
4. **Share insights** with your team using LangSmith's collaboration features

For more advanced usage, see the [LangSmith documentation](https://docs.smith.langchain.com/).
