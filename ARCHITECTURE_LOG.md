# CollabCanvas Architecture Log

## System Overview

CollabCanvas is a real-time collaborative design tool built with a sophisticated multi-layered architecture that supports simultaneous multi-user editing, AI-powered natural language commands, and professional-grade canvas manipulation. The system achieves sub-100ms synchronization with 60 FPS performance while supporting 500+ objects and 10+ concurrent users.

## Core Architecture Principles

### 1. Hybrid Database Strategy
The system uses a dual-database approach to optimize for different use cases:
- **Firestore**: Persistent shape data storage with ACID transactions
- **Firebase Realtime Database**: High-frequency position updates and cursor tracking
- **Local State Management**: Optimistic updates for immediate user feedback

### 2. Optimistic Update Pattern
All user interactions are immediately reflected in the UI (optimistic updates) while being synchronized with the backend. This ensures responsive user experience while maintaining data consistency.

### 3. Conflict Resolution Strategy
The system implements a sophisticated conflict resolution mechanism:
- **Position Priority**: Optimistic (local) > Real-time (other users) > Firestore (persistent)
- **User Ownership**: Users can only modify shapes they're actively dragging
- **Automatic Lock Release**: Locks expire after drag completion or timeout

## Canvas Drawing System Architecture

### Multi-User Canvas Rendering

The canvas system is built on Konva.js for high-performance 2D rendering with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Canvas Layer Stack                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Background Layer (Grid, Guidelines)                     │
│ 2. Shape Layer (All Canvas Objects)                        │
│ 3. Selection Layer (Selection Rectangles, Handles)         │
│ 4. Cursor Layer (Multi-user Cursors)                      │
│ 5. UI Overlay Layer (Controls, Panels)                    │
└─────────────────────────────────────────────────────────────┘
```

### Shape Management System

#### Shape Data Structure
```javascript
{
  id: "unique_shape_id",
  type: "rectangle|circle|triangle|line|text|input",
  x: number,           // Canvas X coordinate
  y: number,           // Canvas Y coordinate
  width: number,       // Shape width
  height: number,      // Shape height
  rotation: number,    // Rotation in degrees
  fill: string,        // Color/pattern
  stroke: string,      // Border color
  strokeWidth: number, // Border width
  text: string,        // Text content (for text shapes)
  fontSize: number,    // Font size
  fontFamily: string,  // Font family
  createdBy: string,   // User ID who created
  createdAt: timestamp,
  lastModifiedBy: string,
  lastModifiedAt: timestamp,
  isLocked: boolean,   // Lock state for collaboration
  lockedBy: string     // User ID who has lock
}
```

#### Shape Rendering Pipeline
1. **Shape Creation**: User interaction → Local state update → Firestore sync
2. **Shape Modification**: Drag/transform → Optimistic update → Real-time sync → Firestore persistence
3. **Shape Deletion**: User action → Local removal → Firestore deletion → Real-time broadcast

### Real-Time Synchronization Architecture

#### Hybrid Sync System
The system uses a three-tier synchronization approach:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local State   │    │  Realtime DB    │    │    Firestore    │
│  (Optimistic)   │◄──►│ (Live Updates)  │◄──►│  (Persistent)   │
│                 │    │                 │    │                 │
│ • Immediate UI  │    │ • Cursor pos    │    │ • Shape data   │
│ • Drag state    │    │ • Position sync │    │ • Metadata    │
│ • Selection     │    │ • Presence      │    │ • History     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Position Update Flow
1. **User Drags Shape**: Local optimistic update → Immediate UI feedback
2. **Throttled Sync**: Position updates sent to Realtime DB at 60fps
3. **Other Users**: Receive position updates via Realtime DB listeners
4. **Drag End**: Final position committed to Firestore
5. **Conflict Resolution**: Anti-jitter mechanisms prevent position conflicts

#### Anti-Jitter System
The system implements sophisticated anti-jitter mechanisms:

```javascript
// Position priority resolution
const getFinalPosition = (shapeId) => {
  const optimistic = optimisticPositions.get(shapeId);
  const realtime = realtimePositions.get(shapeId);
  const firestore = firestorePositions.get(shapeId);
  
  // Priority: Optimistic > Realtime > Firestore
  return optimistic || realtime || firestore;
};

// User ownership checks
const isLocallyDragged = locallyDraggedShapes.has(shapeId);
const isFromCurrentUser = update.updatedBy === currentUser.uid;

// Block updates from self to prevent echo
if (isLocallyDragged && isFromCurrentUser) {
  return; // Block echo updates
}
```

## Data Storage Architecture

### Firestore Schema (Persistent Storage)

#### Projects Collection
```javascript
// projects/{projectId}
{
  id: string,
  name: string,
  ownerId: string,
  memberIds: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Canvas Collection
```javascript
// canvas/{projectId}
{
  canvasId: string,
  shapes: Shape[],
  lastUpdated: timestamp,
  version: number
}
```

#### Shape Subcollection
```javascript
// canvas/{projectId}/shapes/{shapeId}
{
  id: string,
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
  // ... other shape properties
  createdBy: string,
  createdAt: timestamp,
  lastModifiedBy: string,
  lastModifiedAt: timestamp
}
```

### Realtime Database Schema (Live Updates)

#### Session Data
```javascript
// sessions/{projectId}/{userId}
{
  displayName: string,
  cursorColor: string,
  cursorX: number,
  cursorY: number,
  lastSeen: timestamp
}
```

#### Position Updates
```javascript
// sessions/{projectId}/positions/{shapeId}
{
  x: number,
  y: number,
  updatedBy: string,
  timestamp: number
}
```

#### Drag States
```javascript
// sessions/{projectId}/dragStates/{shapeId}
{
  isDragging: boolean,
  draggedBy: string,
  startTime: timestamp
}
```

## Multiple Canvas Projects System

### Project Management Architecture

The system supports multiple canvas projects with the following structure:

#### Project Isolation
- Each project has its own Firestore document (`canvas/{projectId}`)
- Separate Realtime Database sessions (`sessions/{projectId}`)
- Independent user permissions and access control
- Isolated shape data and collaboration state

#### Project Access Control
```javascript
// Project membership system
const projectAccess = {
  owner: ['read', 'write', 'delete', 'invite'],
  member: ['read', 'write'],
  viewer: ['read']
};
```

#### Project Invitation System
- Email-based invitations with secure tokens
- Role-based access control (owner, member, viewer)
- Automatic cleanup of expired invitations

### Project Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Project A     │    │   Project B     │    │   Project C     │
│                 │    │                 │    │                 │
│ • Canvas A      │    │ • Canvas B      │    │ • Canvas C      │
│ • Users A       │    │ • Users B       │    │ • Users C        │
│ • Shapes A      │    │ • Shapes B      │    │ • Shapes C      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  User Session  │
                    │                │
                    │ • Active Project│
                    │ • Permissions  │
                    │ • Cursor State│
                    └─────────────────┘
```

## AI Agent Architecture

### ReAct-Based AI System

The AI agent uses a ReAct (Reasoning + Acting) architecture with LangChain integration:

```
┌─────────────────────────────────────┐
│ Layer 1: Natural Language         │
│ Understanding (OpenAI GPT-4o-mini) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ Layer 2: ReAct Reasoning &        │
│ Planning (LangChain Agent)         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ Layer 3: Tool Execution            │
│ (Canvas API)                        │
└─────────────────────────────────────┘
```

### AI Agent Components

#### 1. Semantic Interpreter
```javascript
class SemanticInterpreter {
  async interpretCommand(userInput, canvasState) {
    // Parse natural language commands
    // Extract intent, entities, and parameters
    // Normalize command structure
  }
}
```

#### 2. Tool System
The AI agent has access to comprehensive canvas manipulation tools:

**Primitive Tools**:
- `createShape(type, x, y, width, height, color)`
- `moveShape(shapeId, x, y)`
- `resizeShape(shapeId, width, height)`
- `rotateShape(shapeId, degrees)`
- `deleteShape(shapeId)`

**Query Tools**:
- `listShapes()` - Get all shapes on canvas
- `identifyShape(description)` - Find shapes by description
- `getSelectedShapes()` - Get currently selected shapes

**Layout Tools**:
- `arrangeShapes(shapeIds, pattern)` - Arrange shapes in patterns
- `distributeEvenly(shapeIds, direction)` - Distribute shapes evenly
- `alignShapes(shapeIds, alignment)` - Align shapes

**Composite Tools**:
- `createLoginForm()` - Create complete login form
- `createNavigationBar()` - Create navigation bar
- `createCardLayout()` - Create card layout

#### 3. Command Processing Pipeline

```javascript
async processCommand(userInput) {
  // Step 1: Semantic interpretation
  const interpretation = await this.semanticInterpreter.interpretCommand(userInput, canvasState);
  
  // Step 2: ReAct reasoning
  const response = await this.reactAgent.process(interpretation);
  
  // Step 3: Tool execution
  const results = await this.executeTools(response.tools);
  
  // Step 4: Response generation
  return this.generateResponse(results);
}
```

### AI Agent Integration

#### Frontend Integration
```javascript
// AI Chat Interface
const AIChat = () => {
  const { processCommand, conversationHistory } = useAI();
  
  const handleSendMessage = async (message) => {
    const response = await processCommand(message);
    // Update conversation history
    // Sync AI actions across users
  };
};
```

#### Backend Processing
The AI agent runs on a separate server with LangChain integration:

```javascript
// AWS Lambda / Express Server
app.post('/api/ai-chat', async (req, res) => {
  const { messages, canvasState } = req.body;
  
  // Process with LangChain ReAct agent
  const response = await reactAgent.process(messages, canvasState);
  
  // Execute canvas operations
  const results = await executeCanvasOperations(response.tools);
  
  res.json({ response: results });
});
```

## Performance Architecture

### Rendering Performance

#### 60 FPS Target
- **Konva.js Optimization**: Hardware-accelerated 2D rendering
- **Selective Updates**: Only re-render changed shapes
- **Viewport Culling**: Only render shapes in visible area
- **Batch Operations**: Group multiple operations for efficiency

#### Memory Management
```javascript
// Shape cleanup on deletion
const cleanupShape = (shapeId) => {
  shapes.delete(shapeId);
  optimisticPositions.delete(shapeId);
  realtimePositions.delete(shapeId);
  firestorePositions.delete(shapeId);
  selectedIds.delete(shapeId);
};
```

### Network Performance

#### Throttled Updates
```javascript
// Throttle position updates to 60fps
const throttledUpdate = throttle((shapeId, position) => {
  updateShapePositionRealtime(shapeId, position);
}, 16); // 60fps = 16ms
```

#### Batch Operations
```javascript
// Batch multiple shape operations
const batchUpdateShapes = async (updates) => {
  const batch = writeBatch(db);
  updates.forEach(update => {
    const shapeRef = doc(db, 'canvas', projectId, 'shapes', update.id);
    batch.update(shapeRef, update.data);
  });
  await batch.commit();
};
```

## Security Architecture

### Authentication & Authorization

#### Firebase Authentication
- Email/password authentication
- Google OAuth integration
- JWT token management
- Session persistence

#### Access Control
```javascript
// Firestore Security Rules
match /canvas/{projectId} {
  allow read, write: if request.auth != null && 
    isProjectMember(projectId, request.auth.uid);
}

match /projects/{projectId} {
  allow read, write: if request.auth != null && 
    isProjectMember(projectId, request.auth.uid);
}
```

#### Data Validation
- Shape property validation
- Coordinate bounds checking
- User permission verification
- Input sanitization

## Deployment Architecture

### Production Deployment

#### Frontend (Vercel)
- React application with Vite build
- Static file hosting
- CDN distribution
- Environment variable management

#### Backend (AWS Lambda)
- Serverless AI agent processing
- LangChain integration
- OpenAI API proxy
- Automatic scaling

#### Database (Firebase)
- Firestore for persistent data
- Realtime Database for live updates
- Automatic backup and recovery
- Global distribution

### Development Environment

#### Local Development
```bash
# Frontend development
npm run dev

# AI agent server
npm run dev:agent

# Firebase emulators
firebase emulators:start
```

#### Testing Infrastructure
- Unit tests with Vitest
- Integration tests with Firebase emulators
- Multi-user testing scenarios
- Performance testing with 500+ objects

## Scalability Considerations

### Horizontal Scaling
- Stateless frontend architecture
- Serverless backend processing
- Database sharding by project
- CDN for static assets

### Performance Optimization
- Lazy loading of canvas components
- Virtual scrolling for large shape sets
- Efficient state management with Zustand
- Optimized re-rendering strategies

### Monitoring & Analytics
- Real-time performance monitoring
- User interaction analytics
- Error tracking and reporting
- Database performance metrics

## Future Architecture Considerations

### Planned Enhancements
- **Operational Transforms**: For more sophisticated conflict resolution
- **WebRTC Integration**: For peer-to-peer collaboration
- **Plugin System**: For extensible functionality
- **Version Control**: For canvas history and branching
- **Advanced AI**: For more sophisticated design assistance

### Technical Debt
- **State Management**: Potential migration to Redux Toolkit
- **Testing**: Comprehensive test coverage
- **Documentation**: API documentation generation
- **Performance**: Further optimization for 1000+ objects

This architecture provides a solid foundation for a production-ready collaborative design tool while maintaining flexibility for future enhancements and scaling requirements.
