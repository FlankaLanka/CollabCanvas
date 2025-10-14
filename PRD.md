# CollabCanvas MVP - Product Requirements Document

**Project**: CollabCanvas - Real-Time Collaborative Design Tool  
**Goal**: Build a solid multiplayer foundation with basic canvas functionality

**Note**: This MVP includes advanced features like multi-select, comprehensive delete functionality, and an AI agent for natural language canvas manipulation.

---

## Canvas Architecture (MVP)

**Single Global Canvas Approach:**

- MVP features ONE shared global canvas that all authenticated users access
- No project creation or management in MVP
- No canvas selection or dashboard
- All users collaborate on the same shared canvas space
- Future: Will add multi-project support with separate canvases per project

**URL Structure:**

- Simple route (e.g., `/canvas` or just `/`)
- No dynamic canvas IDs needed for MVP

---

## User Stories

### Primary User: Designer/Creator (MVP Priority)

- As a designer, I want to **create an account and log in** so that my work is associated with my identity
- As a designer, I want to **see a large canvas workspace** so that I have room to design
- As a designer, I want to **pan and zoom the canvas smoothly** so that I can navigate my design space
- As a designer, I want to **create basic shapes (rectangles)** so that I can build simple designs
- As a designer, I want to **move objects around the canvas** so that I can arrange my design
- As a designer, I want to **delete objects I've created** so that I can remove mistakes or unwanted elements
- As a designer, I want to **select multiple objects at once** so that I can move, manipulate, or delete them as a group
- As a designer, I want to **drag-to-select multiple objects** by drawing a selection rectangle around them
- As a designer, I want to **use keyboard shortcuts** like Delete/Backspace to quickly remove selected objects
- As a designer, I want to **interact with an AI agent using natural language** to create and manipulate canvas elements efficiently
- As a designer, I want to **see AI-generated content appear in real-time** for all collaborators when I use AI commands
- As a designer, I want to **see other users' cursors with their names** so that I know who's working where
- As a designer, I want to **see changes made by other users in real-time** so that we can collaborate seamlessly
- As a designer, I want to **see who else is currently online** so that I know who I'm collaborating with
- As a designer, I want my **work to persist when I leave** so that I don't lose progress

**Note:** Focus on completing all Designer/Creator user stories before addressing Collaborator needs.

### Secondary User: Collaborator (Implement After Primary User)

- As a collaborator, I want to **join an existing canvas session** so that I can work with my team
- As a collaborator, I want to **see all existing objects when I join** so that I have full context
- As a collaborator, I want to **make changes without conflicts** so that multiple people can work simultaneously

---

## Key Features for MVP

### 1. Authentication System

**Must Have:**

- User registration via email/password (Firebase Auth)
- Google social login (Firebase Auth)
- User login/logout
- Persistent user sessions
- User display names visible to collaborators

**Display Name Logic:**

- Use Google display name if signing in via Google
- Use email prefix (before @) if signing in via email/password
- Display truncated version if name is too long (max 20 chars)

**Success Criteria:**

- Users can create accounts and maintain sessions across page refreshes
- Each user has a unique identifier and display name

### 2. Canvas Workspace

**Must Have:**

- **Infinite canvas** - no size restrictions for unlimited creative space
- Smooth pan functionality (middle mouse button drag)
- Zoom functionality (mouse wheel scroll with zoom limits 0.1x to 3.0x)
- Canvas controls widget (zoom in/out/reset buttons)
- Smart viewport centering for new shapes
- 60 FPS performance during all interactions
- Interactive help guide with keyboard shortcuts and mouse controls

**Canvas Navigation:**

- Middle mouse button for panning in any direction
- Mouse wheel for zooming with center-point zooming
- Canvas controls for precise zoom operations
- Reset view functionality to return to default position
- Smooth, responsive interactions without lag

**Success Criteria:**

- Canvas feels responsive and smooth at all zoom levels
- No lag during pan/zoom operations with infinite scroll area  
- Can handle 500+ shapes without performance degradation
- Infinite canvas allows unlimited creative space
- Navigation controls are intuitive and accessible

### 3. Shape Creation & Manipulation

**Must Have:**

- **Five comprehensive shape types**: rectangles, circles, triangles, text elements, and text input fields
- Toolbar with dedicated buttons for each shape type
- Shape spawning at center of current viewport with smart positioning
- Complete shape property system (color, size, rotation, text formatting)
- Font family selection for text elements (7 font options)
- Text alignment options (left, center, right) and vertical alignment
- Size constraints and validation for each shape type
- Visual feedback for selected objects with blue outline, shadows, and selection rectangles
- Shape rotation support for all shape types with degree precision

**Selection Behavior:**

- Single-click selects one shape and deselects others
- Ctrl/Cmd+click toggles individual shape selection (multi-select)
- Drag-to-select draws a selection rectangle to select multiple shapes
- Ctrl/Cmd+drag-to-select adds to existing selection
- Clicking empty canvas deselects all selections
- Selected shapes can be moved together as a group

**Success Criteria:**

- Shape creation is intuitive and immediate
- Drag operations are smooth and responsive
- Selected state is clearly visible
- Selection behavior is predictable and consistent

### 4. Real-Time Synchronization

**Must Have:**

- Broadcast shape creation to all users (<100ms)
- Broadcast shape movements to all users (<100ms)
- Broadcast shape deletions to all users (<100ms)
- Handle concurrent edits without breaking
- Object locking: First user to select/drag an object locks it for editing
- Locked objects cannot be moved by other users simultaneously
- Visual indicator showing which user has locked an object
- Auto-release lock when user stops dragging

**Conflict Resolution Strategy:**

- First user to start moving an object acquires the lock
- Other users cannot move the locked object until lock is released
- Lock automatically releases after drag completes or timeout (3-5 seconds)
- Clear visual feedback when attempting to move a locked object

**Success Criteria:**

- Object changes visible to all users within 100ms
- No "ghost objects" or desync issues
- No simultaneous edits to the same object
- Clear visual feedback when an object is locked by another user
- Lock automatically releases after drag completes

### 5. Multiplayer Cursors

**Must Have:**

- Show cursor position for each connected user
- Display user name near cursor
- Update cursor positions in real-time (<50ms)
- Unique color per user

**Cursor Colors:**

- Randomly assigned from predefined color palette on user join
- Ensure sufficient contrast against white/light backgrounds
- Maintain color consistency per user throughout session

**Success Criteria:**

- Cursors move smoothly without jitter
- Names are readable and don't obscure content
- Cursor updates don't impact canvas performance
- Each user has a distinct, visible cursor color

### 6. Enhanced Shape Deletion

**Must Have:**

- Delete selected shapes with Delete/Backspace key (supports multi-select)
- Right-click context menu to delete individual shapes
- "Delete All Shapes" button with confirmation dialog to clear entire canvas
- Delete multiple selected shapes simultaneously
- Broadcast deletions to all users in real-time
- Deleted shapes removed from database immediately
- Cannot delete shapes locked by other users

**Deletion Methods:**

- Keyboard shortcuts (Delete/Backspace) for selected shapes
- Right-click on individual shapes for instant deletion
- Bulk deletion via "Delete All" with safety confirmation
- Multi-select deletion (select multiple, then delete key)

**Success Criteria:**

- All deletion methods sync across all clients within 100ms
- No "ghost shapes" after deletion
- Deleted shapes permanently removed from persistent storage
- Confirmation dialogs prevent accidental bulk deletions
- Multi-select deletion works efficiently with large selections

### 7. Presence Awareness

**Must Have:**

- List of currently connected users
- Real-time join/leave notifications
- Visual indicator of online status

**Success Criteria:**

- Users can see who's in the session at all times
- Join/leave events update immediately

### 8. Multi-Select Functionality

**Must Have:**

- Select multiple shapes using Ctrl/Cmd+click
- Drag-to-select rectangle for area selection
- Visual feedback showing all selected shapes with blue outlines
- Move all selected shapes together as a group
- Apply property changes to all selected shapes simultaneously
- Delete multiple selected shapes at once

**Selection Methods:**

- Single-click: Select one shape, deselect others
- Ctrl/Cmd+click: Toggle individual shape selection
- Drag empty area: Draw selection rectangle
- Ctrl/Cmd+drag: Add to existing selection with rectangle

**Multi-Select Operations:**

- Group dragging: All selected shapes move together maintaining relative positions
- Bulk property editing: Color, size, rotation applied to all selected
- Bulk deletion: Delete key removes all selected shapes
- Selection state synced across users in real-time

**Success Criteria:**

- Selection rectangle appears smoothly and accurately
- Multi-select drag maintains shape relationships
- Property changes apply consistently to all selected shapes
- Selection state visible to all collaborators
- Performance remains smooth with 50+ selected shapes

### 9. AI Agent Integration

**Must Have:**

- Natural language interface for canvas manipulation
- OpenAI GPT-4 integration with function calling
- Real-time AI-generated content visible to all users
- Comprehensive command support across 6+ categories

**AI Command Categories:**

**Creation Commands:**
- "Create a red circle at position 100, 200"
- "Add a text layer that says 'Hello World'"
- "Make a 200x300 rectangle"
- "Add a triangle in the center"

**Manipulation Commands:**
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big" 
- "Rotate the text 45 degrees"
- "Change the red shapes to blue"

**Layout Commands:**
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Align all rectangles to the left"

**Complex Commands:**
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image placeholder, and description"
- "Design a dashboard with header, sidebar, and main content area"

**Selection-Aware Commands:**
- "Move the selected shapes to the right"
- "Make the selected objects larger"
- "Change selected shapes to green"
- "Arrange selected items in a circle"

**Technical Implementation:**

- Function calling schema with canvas API integration:
  - `createShape(type, x, y, width, height, color, text)`
  - `moveShape(shapeId, x, y)` or `moveShapes(shapeIds[], deltaX, deltaY)`
  - `resizeShape(shapeId, width, height)`
  - `rotateShape(shapeId, degrees)`
  - `updateShapeProperties(shapeId, properties)`
  - `getCanvasState()` - returns current shapes for AI context
  - `getSelectedShapes()` - returns currently selected shapes
  - `selectShapes(shapeIds[])` - programmatically select shapes
  - `deleteShapes(shapeIds[])`

**AI State Management:**
- All AI actions synchronized across all users in real-time
- AI responses under 2 seconds for simple commands
- Multi-step operations execute sequentially with progress feedback
- Error handling with user-friendly messages
- AI command history visible to all users

**Success Criteria:**
- Handles 6+ distinct command types reliably
- Complex operations (login form) create 3+ properly arranged elements  
- AI-generated content appears for all users simultaneously
- Response time under 2 seconds for single operations
- Natural language processing accuracy >90% for supported commands
- Multiple users can use AI simultaneously without conflicts

### 10. User Interface Components

**Must Have:**

- **Canvas Controls Widget**: Zoom in/out/reset buttons in top-right corner
- **Interactive Help Guide**: Collapsible tooltip with keyboard shortcuts and mouse controls
- **Properties Panel**: Bottom-right responsive panel for editing selected shape properties
- **Toolbar**: Left sidebar with shape creation buttons and delete all functionality  
- **AI Chat Interface**: Collapsible chat window with conversation history and loading states
- **User Names List**: Display of online users in top-right area
- **Responsive Design**: Mobile and desktop optimized layouts

**UI Features:**

- Color picker with 12-color palette for shape customization
- Font family dropdown (7 font options) for text elements
- Size sliders and input fields for precise shape dimensioning  
- Rotation controls with degree precision and quick-angle buttons
- Real-time preview of property changes
- Loading states and error handling throughout interface
- Keyboard shortcut indicators in help guide
- Visual selection feedback (blue outlines, shadows, selection rectangles)

**Success Criteria:**

- All UI components are responsive across screen sizes
- Property changes apply immediately with real-time sync
- Interface remains usable on mobile devices
- Help system provides clear interaction guidance
- All controls are accessible and intuitive

### 11. State Persistence

**Must Have:**

- Save canvas state to database with hybrid sync system
- Load canvas state on page load
- Persist through disconnects and reconnects
- Multiple users can rejoin and see same state
- Real-time position tracking with Realtime Database
- Persistent shape data with Firestore

**Success Criteria:**

- All users leave and return → work is still there
- Page refresh doesn't lose any data
- New user joining sees complete current state
- Real-time updates continue working across sessions

### 12. Deployment

**Must Have:**

- Publicly accessible URL
- Stable hosting for 5+ concurrent users
- No setup required for users

**Success Criteria:**

- Anyone can access via URL
- Supports at least 5 simultaneous users
- No crashes under normal load

---

## Data Model

### Firestore Collection: `canvas` (single document for MVP)

**Document ID:** `global-canvas-v1`

```json
{
  "canvasId": "global-canvas-v1",
  "shapes": [
    {
      "id": "shape_uuid_1",
      "type": "rectangle",
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 100,
      "fill": "#cccccc",
      "createdBy": "user_id",
      "createdAt": "timestamp",
      "lastModifiedBy": "user_id",
      "lastModifiedAt": "timestamp",
      "isLocked": false,
      "lockedBy": null
    }
  ],
  "lastUpdated": "timestamp"
}
```

### Firebase Realtime Database: `presence` (for cursors)

```json
{
  "sessions": {
    "global-canvas-v1": {
      "user_id_1": {
        "displayName": "John Doe",
        "cursorColor": "#FF5733",
        "cursorX": 450,
        "cursorY": 300,
        "lastSeen": "timestamp"
      },
      "user_id_2": {
        "displayName": "Jane Smith",
        "cursorColor": "#33C1FF",
        "cursorX": 620,
        "cursorY": 180,
        "lastSeen": "timestamp"
      }
    }
  }
}
```

**Why Two Databases?**

- Firestore: For persistent canvas state (shapes, metadata)
- Realtime Database: For high-frequency updates (cursor positions, presence)
- Realtime Database has lower latency for cursor movements

---

## Proposed Tech Stack

### Option 1: Firebase (Recommended for Speed)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Firebase Authentication
- Firestore for state persistence
- Firebase Realtime Database for cursor positions

**Pros:**

- Fastest setup (authentication is plug-and-play)
- Built-in real-time capabilities
- Generous free tier
- Automatic scaling
- Simple deployment with Firebase Hosting

**Cons:**

- Vendor lock-in to Google
- Firestore queries can be expensive at scale
- Less control over backend logic

**Pitfalls to Watch:**

- Firestore charges per read/write - optimize updates
- Need to structure data carefully (avoid deep nesting)
- Realtime Database better for cursor positions (lower latency)

---

### Option 2: Supabase + WebSockets

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Supabase Auth
- Supabase PostgreSQL for state persistence
- Supabase Realtime for updates

**Pros:**

- Open source alternative to Firebase
- PostgreSQL is more flexible than Firestore
- Built-in real-time subscriptions
- Better for complex queries later

**Cons:**

- Slightly more setup than Firebase
- Realtime can be tricky with high-frequency updates
- Free tier has connection limits

**Pitfalls to Watch:**

- Realtime subscriptions count against connection limits
- Need to handle reconnection logic carefully
- Cursor updates might need separate WebSocket channel

---

### Option 3: Custom Backend (Express + Socket.io)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Node.js + Express
- Socket.io for real-time communication
- MongoDB or PostgreSQL for persistence
- Custom authentication or Auth0

**Pros:**

- Complete control over architecture
- Socket.io is purpose-built for real-time
- Can optimize exactly for your use case
- No vendor lock-in

**Cons:**

- Most time-consuming to build
- Need to build authentication from scratch
- More deployment complexity
- Need to manage scaling yourself

**Pitfalls to Watch:**

- Authentication takes significant time
- Need to handle WebSocket reconnection
- Scaling WebSockets requires sticky sessions
- More potential for bugs in custom code

---

## Recommended Stack for MVP

**Frontend:** React + Vite + Konva.js + Tailwind  
**Backend:** Firebase (Authentication + Firestore + Realtime Database)  
**Deployment:** Firebase Hosting or Vercel

**Rationale:** Given the 24-hour constraint, Firebase provides the fastest path to a working MVP. Authentication is solved, real-time is built-in, and deployment is simple. You can always migrate later if needed.

---

## Out of Scope for MVP

### Features NOT Included:

- Multiple shape types (circles, text, lines, polygons, etc.)
- Color customization for shapes
- Resize functionality
- Rotate functionality
- Multi-select
- Undo/redo
- Layer management
- Export functionality
- Shape styling (borders, shadows, gradients, etc.)
- Copy/paste
- Keyboard shortcuts beyond delete
- Mobile support
- Multiple projects or canvases
- Canvas dashboard or project list
- User profile management
- Canvas sharing/invite system

### Technical Items NOT Included:

- Operational transforms (OT) or CRDTs for conflict resolution
- Infinite canvas (using fixed 5000x5000px space)
- Canvas minimap
- Performance monitoring/analytics
- User permissions/roles
- Canvas history/versioning
- Optimistic updates (can add if time allows)
- Advanced locking mechanisms

---

## Known Limitations & Trade-offs

1. **Single Global Canvas**: All users share one global canvas (multi-project support in Phase 2)
2. **Basic Shapes**: Rectangles only (other shapes in future releases)
3. **Simple Locking**: First-come lock mechanism (not CRDT or OT)
4. **No Styling**: Fixed gray fill color for all rectangles
5. **No History**: No undo/redo or version control
6. **Desktop Only**: Not optimized for mobile/tablet
7. **Fixed Canvas Size**: 5000x5000px limit (not infinite canvas)
8. **No Permissions**: All users have equal edit access

---

## Success Metrics for MVP Checkpoint

1. **Two users can edit simultaneously** in different browsers
2. **Page refresh mid-edit** preserves all state
3. **Multiple shapes created rapidly** sync without visible lag
4. **Locking works correctly** - only one user can move an object at a time
5. **60 FPS maintained** during all interactions
6. **Deployed and accessible** via public URL

---

## MVP Testing Checklist

### Core Functionality:

- [ ] User can register with email/password
- [ ] User can sign in with Google
- [ ] User can log out and log back in
- [ ] Display name appears correctly for all users

### Canvas Operations:

- [ ] Can create five shape types (rectangle, circle, triangle, text, text input)
- [ ] Can select shapes by clicking with visual feedback (blue outline, shadows)
- [ ] Can move shapes by dragging with real-time position sync
- [ ] Can rotate shapes using rotation controls
- [ ] Can edit shape properties (color, size, text content, fonts)
- [ ] Can delete shapes with Delete/Backspace key
- [ ] Can right-click shapes to delete them
- [ ] Can use "Delete All Shapes" button with confirmation
- [ ] Pan with middle mouse button works smoothly
- [ ] Zoom with mouse wheel works with proper center-point zooming
- [ ] Canvas controls (zoom in/out/reset) function correctly
- [ ] Canvas is infinite (no boundaries) and allows unlimited panning
- [ ] New shapes spawn in center of current viewport
- [ ] Interactive help guide displays correct keyboard shortcuts and mouse controls

### Real-Time Collaboration:

- [ ] Two users in different browsers can both create rectangles
- [ ] User A creates shape → User B sees it within 100ms
- [ ] User A moves shape → User B sees movement in real-time
- [ ] User A locks shape by dragging → User B cannot move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] Lock releases automatically after drag completes

### Multiplayer Features:

- [ ] Can see other user's cursor position
- [ ] Can see other user's name near their cursor
- [ ] Each user has a unique cursor color
- [ ] Cursor movements are smooth (no jitter)
- [ ] Join/leave presence updates immediately
- [ ] User list shows all currently connected users

### Persistence:

- [ ] Both users leave and return → all shapes persist
- [ ] Page refresh doesn't lose any data
- [ ] New user joining sees complete current state
- [ ] Deleted shapes don't reappear after refresh

### Multi-Select Functionality:

- [ ] Can select multiple shapes with Ctrl/Cmd+click
- [ ] Can drag-to-select multiple shapes with selection rectangle
- [ ] Can add to existing selection with Ctrl/Cmd+drag-to-select  
- [ ] Selected shapes show blue outline and shadow
- [ ] Can move all selected shapes together maintaining relative positions
- [ ] Can delete multiple selected shapes with Delete key
- [ ] Can change properties of all selected shapes simultaneously
- [ ] Clicking empty canvas deselects all shapes
- [ ] Selection state syncs across all users in real-time

### AI Agent Integration:

- [ ] AI chat interface appears and accepts natural language input
- [ ] AI chat shows conversation history and loading states
- [ ] Creation commands work: "Create a red circle at 100,200"
- [ ] Manipulation commands work: "Move the blue rectangle to center"
- [ ] Layout commands work: "Arrange these shapes in a row"
- [ ] Complex commands work: "Create a login form"
- [ ] Selection-aware commands work: "Make selected shapes larger"
- [ ] AI responses appear under 2 seconds for simple commands
- [ ] AI-generated content appears for all users simultaneously
- [ ] Multiple users can use AI simultaneously without conflicts
- [ ] AI can understand and manipulate current canvas state
- [ ] AI provides helpful error messages for unclear commands
- [ ] Complex operations create properly arranged multi-element layouts

### User Interface Components:

- [ ] Properties panel appears when shapes are selected
- [ ] Properties panel works for single and multi-select
- [ ] Color picker shows 12-color palette and applies changes in real-time
- [ ] Font family dropdown works for text elements (7 font options)
- [ ] Size controls (sliders/inputs) update shapes immediately
- [ ] Rotation controls work with degree precision and quick-angle buttons
- [ ] Canvas controls widget (zoom in/out/reset) function correctly
- [ ] Interactive help guide toggles and shows correct information
- [ ] Toolbar buttons create shapes of correct types
- [ ] Delete all button shows confirmation dialog
- [ ] User names list displays online users correctly
- [ ] All UI components are responsive on mobile devices
- [ ] Loading states and error messages appear appropriately

### Performance:

- [ ] 60 FPS maintained with 100+ shapes on canvas
- [ ] No lag during rapid shape creation
- [ ] Cursor updates don't cause frame drops
- [ ] Pan/zoom remains smooth with many objects
- [ ] Multi-select operations remain smooth with 50+ selected shapes
- [ ] AI commands execute without impacting canvas performance

---

## Risk Mitigation

**Biggest Risk:** Real-time sync breaking under load  
**Mitigation:** Test with multiple browsers early and often; use Firebase Realtime Database for high-frequency updates

**Second Risk:** Performance degradation with many objects  
**Mitigation:** Use canvas-based rendering (Konva), not DOM elements; limit to 500 shapes for MVP

**Third Risk:** Locking mechanism causing deadlocks  
**Mitigation:** Implement automatic lock timeout (3-5 seconds); clear visual feedback for lock state

**Fourth Risk:** Cursor updates causing performance issues  
**Mitigation:** Use Firebase Realtime Database (not Firestore) for cursor positions; throttle updates to 20-30 FPS
