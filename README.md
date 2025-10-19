# CollabCanvas

A real-time collaborative design tool that enables multiple users to create, edit, and manipulate shapes on a shared canvas with AI-powered natural language commands.

## 🎯 What is CollabCanvas?

CollabCanvas is a professional-grade collaborative design tool that combines real-time multi-user editing with AI agent integration. Users can create shapes, manipulate objects, and collaborate in real-time while using natural language commands to automate complex design tasks.

### Key Capabilities

- **Real-time Collaboration**: Multiple users can edit simultaneously with live cursor tracking and presence awareness
- **AI-Powered Design**: Natural language commands for creating complex layouts, forms, and UI components
- **Professional Canvas**: Infinite workspace with smooth pan/zoom, multi-select, and advanced shape manipulation
- **Shape System**: Five shape types (rectangles, circles, triangles, lines, text) with comprehensive property editing
- **Multi-User Features**: Live cursors, presence indicators, and conflict-free collaborative editing
- **Performance Optimized**: 60 FPS rendering, <100ms sync times, supports 500+ objects and 10+ concurrent users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collabcanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_USE_LOCAL_AI=false (true -> connects to aws endpoint, false -> connects to localhost:3001 endpoint)
   ```

4. **Start development server**
   ```bash
   npm run dev
   npm run dev:agent
   ```

5. **Open in browser**
   Navigate to [http://localhost:5173](http://localhost:5173)
   http://localhost:3000 runs the ai agent

### Development with AI Agent

For full AI functionality, run the AI agent server:

```bash
# Terminal 1: Start AI agent server
npm run dev:agent

# Terminal 2: Start main application
npm run dev
```

## 🛠 Dependencies

### Core Dependencies
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Konva.js** - 2D canvas rendering engine
- **Firebase** - Authentication and real-time database
- **Zustand** - State management
- **TailwindCSS** - Styling framework

### AI & Language Processing
- **OpenAI** - GPT-4 integration for natural language processing
- **LangChain** - AI agent framework with ReAct reasoning
- **LangSmith** - AI agent monitoring and debugging

### Real-time Collaboration
- **Firebase Auth** - User authentication (email/password + Google)
- **Cloud Firestore** - Persistent shape data storage
- **Firebase Realtime Database** - High-frequency cursor and position updates

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Concurrently** - Parallel script execution

## 🏗 Architecture Overview

CollabCanvas uses a hybrid architecture combining:

- **Frontend**: React with Konva.js for canvas rendering
- **State Management**: Zustand with Immer for immutable updates
- **Real-time Sync**: Dual-database approach (Firestore + Realtime DB)
- **AI Integration**: LangChain ReAct agent with OpenAI GPT-4
- **Authentication**: Firebase Auth with Google OAuth