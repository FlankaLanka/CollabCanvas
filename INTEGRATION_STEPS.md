# 🔗 Integration Guide: Optimistic Drag System

This guide shows how to integrate the optimistic drag system into your existing CollabCanvas codebase.

## 🚀 **Quick Start Integration**

### Step 1: Install Dependencies
```bash
npm install zustand
```

### Step 2: Replace Your Current Canvas Components

Replace your existing components with the optimized versions:

```javascript
// In your main App.jsx or wherever you render the canvas
import { CanvasProvider } from './contexts/OptimizedCanvasContext';
import OptimizedCanvas from './components/Canvas/OptimizedCanvas';

function App() {
  return (
    <CanvasProvider>
      <div className="h-screen">
        <OptimizedCanvas />
      </div>
    </CanvasProvider>
  );
}
```

### Step 3: Update Your Firestore Schema

Ensure your Firestore documents have these fields:
```javascript
// Shape document structure
{
  id: string,
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'text_input',
  x: number,
  y: number,
  width: number, // for rectangles
  height: number, // for rectangles
  radius: number, // for circles
  color: string,
  createdBy: string,
  createdAt: number,
  updatedBy: string,
  lastUpdated: number
}
```

## 🔄 **Migrating from Your Current System**

### Replace Canvas Context

**Old**: `src/contexts/CanvasContext.jsx`
**New**: `src/contexts/OptimizedCanvasContext.jsx`

Key differences:
- ✅ Zustand integration for local state
- ✅ Snapshot ignoring during drag
- ✅ Batch updates on drag end
- ✅ Optimistic position management

### Replace Shape Component

**Old**: `src/components/Canvas/Shape.jsx`  
**New**: `src/components/Canvas/OptimizedShape.jsx`

Key improvements:
- ✅ Manual drag handling for multi-select
- ✅ Optimistic position rendering
- ✅ Smart drag threshold (3px)
- ✅ Global mouse up handling

### Replace Canvas Component

**Old**: `src/components/Canvas/Canvas.jsx`
**New**: `src/components/Canvas/OptimizedCanvas.jsx`

Key enhancements:
- ✅ Drag-to-select rectangle
- ✅ Shift+click multi-select
- ✅ Keyboard shortcuts (Ctrl+A, Escape, Delete)
- ✅ Selection status overlays

## 🔧 **Customization Options**

### 1. Adjust Drag Sensitivity
```javascript
// In OptimizedShape.jsx
const DRAG_THRESHOLD = 5; // Increase for less sensitive dragging

if (distance > DRAG_THRESHOLD && !isDragActive.current) {
  // Start drag...
}
```

### 2. Customize Selection Colors
```javascript
// In OptimizedShape.jsx - getShapeStyles()
if (isSelected) {
  return {
    ...baseStyles,
    stroke: '#your-color', // Custom selection color
    strokeWidth: 3, // Custom stroke width
    shadowColor: 'rgba(your, custom, color, 0.3)',
  };
}
```

### 3. Configure Batch Update Behavior
```javascript
// In OptimizedCanvasContext.jsx - handleDragEnd()
const batch = writeBatch(db);

finalPositions.forEach(({ id, x, y }) => {
  batch.update(shapeDoc, { 
    x, 
    y, 
    // Add your custom fields
    lastModified: serverTimestamp(),
    version: increment(1)
  });
});
```

## 🎯 **Integration with Your AI Agent**

The optimistic drag system works seamlessly with your existing AI agent:

```javascript
// In your AI canvas functions
export const moveShapes = async (shapeIds, deltaX, deltaY) => {
  // Get current positions
  const shapes = shapeIds.map(id => getShape(id));
  
  // Calculate new positions
  const updates = shapes.map(shape => ({
    id: shape.id,
    x: shape.x + deltaX,
    y: shape.y + deltaY
  }));
  
  // Use the same batch update mechanism
  const batch = writeBatch(db);
  updates.forEach(({ id, x, y }) => {
    const shapeDoc = doc(db, 'canvas-shapes', id);
    batch.update(shapeDoc, { x, y, updatedBy: 'AI_AGENT' });
  });
  
  await batch.commit();
  
  return { success: true, movedCount: updates.length };
};
```

## 🔄 **Maintaining Your Existing Features**

### Multi-User Presence
Your existing cursor and presence system will work unchanged:

```javascript
// Keep your existing presence hooks
import { usePresence } from './hooks/usePresence';
import { useCursors } from './hooks/useCursors';

// Add to OptimizedCanvas.jsx
function OptimizedCanvas() {
  const { userCursors } = useCursors();
  const { users } = usePresence();
  
  return (
    <Stage>
      <Layer>
        {/* Your shapes */}
        {shapes.map(shape => <OptimizedShape key={shape.id} shape={shape} />)}
        
        {/* Your existing cursor layer */}
        <CursorLayer cursors={userCursors} />
      </Layer>
    </Stage>
  );
}
```

### Real-Time Database Integration
You can keep your existing real-time features alongside Firestore:

```javascript
// Keep using Realtime Database for high-frequency updates
import { useRealtimePositions } from './hooks/useRealtimePositions';

// In OptimizedCanvasContext.jsx
const { sendPosition } = useRealtimePositions();

const handleDragMove = (mousePos) => {
  // Optimistic local updates
  updateOptimisticPositions(mousePos);
  
  // Optional: Send position to Realtime DB for cursors
  sendPosition(mousePos);
};
```

## 📊 **Performance Monitoring**

Add performance monitoring to track improvements:

```javascript
// In OptimizedCanvasContext.jsx
const handleDragEnd = async () => {
  const startTime = performance.now();
  
  try {
    await batch.commit();
    const endTime = performance.now();
    
    console.log(`📊 Batch update took ${endTime - startTime}ms for ${finalPositions.length} shapes`);
  } catch (error) {
    console.error('Batch update failed:', error);
  }
};
```

## 🛠️ **Debugging Tools**

Enable detailed logging for debugging:

```javascript
// In dragStore.js - enable debug mode
const DEBUG_DRAG = process.env.NODE_ENV === 'development';

export const useDragStore = create((set, get) => ({
  // ... existing code ...
  
  startDrag: (shapes, mousePos) => {
    if (DEBUG_DRAG) {
      console.log('🎯 Drag started:', {
        shapeCount: shapes.length,
        mousePos,
        timestamp: Date.now()
      });
    }
    // ... rest of function
  }
}));
```

## 🚀 **Deployment Considerations**

### Firestore Security Rules
Update your rules to allow batch updates:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas-shapes/{shapeId} {
      allow read, write: if request.auth != null;
      allow update: if request.auth != null 
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### Performance Optimization
```javascript
// Enable Firestore offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch(err => {
  if (err.code == 'failed-precondition') {
    console.log('Persistence failed: multiple tabs open');
  } else if (err.code == 'unimplemented') {
    console.log('Persistence not supported');
  }
});
```

## 🎉 **Expected Results**

After integration, you should see:

- ✅ **Zero jitter** during shape dragging
- ✅ **Instant visual feedback** for all drag operations  
- ✅ **Smooth multi-select** dragging maintaining relative positions
- ✅ **Reduced Firestore costs** (single write per drag vs continuous writes)
- ✅ **Better performance** with 500+ shapes
- ✅ **Improved collaboration** with multiple users

## 🔧 **Troubleshooting**

### Common Issues:

**Issue**: Shapes still jitter during drag
**Solution**: Ensure `shouldIgnoreFirestoreUpdate` is working correctly
```javascript
// Check that locallyDraggedIds contains the shape being dragged
console.log('Locally dragged IDs:', Array.from(locallyDraggedIds));
```

**Issue**: Selection not working properly
**Solution**: Verify Zustand store integration
```javascript
// Check selection state in dev tools
const selectedIds = useDragStore.getState().selectedIds;
console.log('Currently selected:', selectedIds);
```

**Issue**: Firestore batch updates failing
**Solution**: Check document permissions and field validation
```javascript
// Add error logging in batch update
batch.commit().catch(error => {
  console.error('Batch update error details:', error);
});
```

Your optimistic drag system is now ready for production use! 🚀
