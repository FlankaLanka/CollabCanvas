# AI Agent Setup Guide

The CollabCanvas AI agent requires a backend server to handle OpenAI API calls securely.

## 🚀 Quick Setup for Development

### 1. Install Dependencies
```bash
npm install
```

This will install the required server dependencies:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable loading
- `node-fetch` - Fetch API for Node.js
- `concurrently` - Run multiple commands

### 2. Set OpenAI API Key
```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

**Get your API key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and use it in the export command above

### 3. Start Both Servers
```bash
npm run dev:full
```

This starts:
- **AI Server** on `http://localhost:3001` (handles OpenAI API calls)
- **Vite Dev Server** on `http://localhost:5173` (your React app)

### 4. Test AI Features
- Open the app at `http://localhost:5173`
- Click the AI chat button (bottom right)
- Try commands like:
  - "Create a blue circle"
  - "Make a login form"
  - "Create 5 rectangles in a row"

## 🌐 Alternative: Deploy to Production

If you prefer to test in a deployed environment:

### Vercel Deployment
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variable: `OPENAI_API_KEY=your-key`
4. Deploy - AI will work automatically

### Netlify Deployment
1. Push your code to GitHub
2. Connect to Netlify
3. Add environment variable: `OPENAI_API_KEY=your-key`
4. Deploy - AI will work automatically

## 📝 Available Scripts

```bash
npm run dev        # Start only the React app (no AI)
npm run dev:server # Start only the AI server
npm run dev:full   # Start both servers (recommended)
```

## 🤖 AI Command Categories

The AI agent supports 6+ command categories:

### Creation Commands
- "Create a red circle at position 200, 300"
- "Add a text that says 'Hello World'"
- "Make a blue rectangle 150x100 pixels"

### Manipulation Commands
- "Move the circle to the center"
- "Resize the rectangle to be twice as big"
- "Rotate the text 45 degrees"
- "Change the blue shapes to green"

### Layout Commands
- "Create 5 circles in a row"
- "Make a 3x3 grid of squares"
- "Arrange the shapes in a circle pattern"

### Complex Commands
- "Create a login form"
- "Build a navigation bar with Home, About, Contact"
- "Make a card with title 'Welcome' and content 'Get started'"

## 🔧 Troubleshooting

### "404 Not Found" Error
- Make sure you ran `npm install`
- Check that the AI server is running on port 3001
- Verify your `OPENAI_API_KEY` is set

### "AI Not Available" Warning
- The AI chat button shows this when the server isn't running
- Follow the setup steps above to enable AI features
- All other canvas features work without AI

### Port Conflicts
If port 3001 is busy, edit `server.js` and change the `PORT` variable to another port (like 3002), then update the endpoint in `src/services/ai.js`.

## 📊 Performance Targets

- **Response Time**: <2 seconds for simple commands
- **Multi-user**: Supports concurrent AI usage
- **Real-time Sync**: AI-generated content syncs across all users
- **Function Calling**: Uses OpenAI GPT-4 with structured function calls

## 🔒 Security

- ✅ API keys never exposed to browser
- ✅ Server-side proxy protects credentials  
- ✅ CORS properly configured
- ✅ Production-ready deployment
