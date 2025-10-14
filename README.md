# CollabCanvas

A real-time collaborative design tool built with React, Vite, and Firebase.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 🎯 Current Features

- ✅ Clean UI layout with header, toolbar, canvas area, and user panel
- ✅ Responsive design with TailwindCSS
- ✅ Shape creation tools (Rectangle, Circle, Text) - UI ready
- ✅ Online users display
- 🚧 Canvas functionality - coming next
- 🚧 Real-time collaboration - coming next
- 🚧 Firebase integration - coming next

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Canvas**: Konva.js (to be integrated)
- **Backend**: Firebase (to be integrated)
- **Real-time**: Firebase Realtime Database (to be integrated)

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.jsx          # Top navigation
│   ├── Toolbar.jsx         # Left shape tools
│   ├── CanvasArea.jsx      # Main drawing area
│   └── OnlineUsers.jsx     # Right user panel
├── App.jsx                 # Main app layout
└── main.jsx               # Entry point
```

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────┐
│ Collab Canvas                   [User Info] [Sign out] │
├─────────────────────────────────────────────────┤
│ [⬜] │                                    │ Online Users   │
│ [⭕] │         Canvas Area               │ • Alice (You)  │
│ [T]  │     (Ready for Konva.js)          │ • Bob          │
│      │                                    │ • Charlie      │
│      │                                    │ • Diana        │
└─────────────────────────────────────────────────┘
```

## 🔄 Development Status

This is a fresh restart of the project with a clean, minimal foundation. 
Ready to add canvas functionality and real-time features step by step.

## 📋 Next Steps

1. Integrate Konva.js canvas into CanvasArea
2. Add shape creation functionality
3. Implement Firebase real-time synchronization
4. Add user authentication
5. Build multiplayer cursor tracking
