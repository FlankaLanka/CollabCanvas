import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getCurrentUser } from '../services/auth';
import { throttledUpdateShapePosition, forceUpdateShapePosition } from '../services/realtimeShapes';

/**
 * Modern Canvas Store - Eliminates Jittering with Centralized State Management
 * 
 * Key improvements:
 * - Single source of truth for all canvas state
 * - Atomic state updates prevent race conditions
 * - Immutable updates via Immer
 * - Clear separation of position sources
 * - Predictable state transitions
 */
export const useCanvasStore = create(
  subscribeWithSelector(
    immer((set, get) => ({
      // ===== CORE STATE =====
      
      // Shape data (indexed by ID for O(1) lookups)
      shapes: new Map(),
      
      // Selection state
      selectedIds: new Set(),
      
      // Canvas UI state  
      stageScale: 1,
      stagePosition: { x: 0, y: 0 },
      syncStatus: 'connecting',
      syncLoading: false,
      
      // ===== DRAG STATE =====
      
      // Drag operation tracking
      isDragging: false,
      dragOperationId: null,
      dragStartMousePos: null,
      dragStartPositions: new Map(), // shapeId -> original position
      
      // Track which shapes are being dragged locally (prevents conflicts)
      locallyDraggedShapes: new Set(),
      
      // ===== POSITION STATE (SEPARATED BY SOURCE) =====
      
      // Positions from Firestore (persistent, authoritative)
      firestorePositions: new Map(),
      
      // Positions from other users in real-time (live collaboration)
      realtimePositions: new Map(),
      
      // Positions from local drag operations (optimistic updates)
      optimisticPositions: new Map(),

      // ===== COMPUTED GETTERS =====
      
      /**
       * Get the final position for a shape with proper priority:
       * Optimistic (local drag) > Real-time (other users) > Firestore (persistent)
       */
      getFinalShapePosition: (shapeId) => {
        const state = get();
        const shape = state.shapes.get(shapeId);
        if (!shape) return null;
        
        // ABSOLUTE PRIORITY: Local drag (optimistic) positions
        if (state.locallyDraggedShapes.has(shapeId)) {
          const optimisticPos = state.optimisticPositions.get(shapeId);
          if (optimisticPos) {
            return { ...shape, x: optimisticPos.x, y: optimisticPos.y };
          }
        }
        
        // SECOND PRIORITY: Real-time positions from other users  
        const realtimePos = state.realtimePositions.get(shapeId);
        if (realtimePos) {
          return { ...shape, x: realtimePos.x, y: realtimePos.y };
        }
        
        // DEFAULT: Firestore position (or shape's base position)
        const firestorePos = state.firestorePositions.get(shapeId);
        if (firestorePos) {
          return { ...shape, x: firestorePos.x, y: firestorePos.y };
        }
        
        return shape;
      },
      
      /**
       * Get all shapes with their final positions applied
       */
      getShapesWithPositions: () => {
        const state = get();
        const shapesWithPositions = [];
        
        state.shapes.forEach((shape, shapeId) => {
          const finalShape = state.getFinalShapePosition(shapeId);
          if (finalShape) {
            shapesWithPositions.push(finalShape);
          }
        });
        
        return shapesWithPositions;
      },

      // ===== ACTIONS =====
      
      /**
       * Initialize shapes from Firestore
       */
      setShapes: (shapesArray) => set(state => {
        // Convert array to Map for O(1) lookups
        const shapesMap = new Map();
        const firestorePositions = new Map();
        
        shapesArray.forEach(shape => {
          shapesMap.set(shape.id, shape);
          firestorePositions.set(shape.id, { x: shape.x, y: shape.y });
        });
        
        state.shapes = shapesMap;
        state.firestorePositions = firestorePositions;
      }),
      
      /**
       * Update sync status
       */
      setSyncStatus: (status, loading = false) => set(state => {
        state.syncStatus = status;
        state.syncLoading = loading;
      }),
      
      /**
       * Selection Management
       */
      selectShape: (shapeId) => set(state => {
        state.selectedIds.clear();
        state.selectedIds.add(shapeId);
        console.log('🎯 Shape selected:', shapeId);
      }),
      
      selectMultipleShapes: (shapeIds) => set(state => {
        state.selectedIds.clear();
        shapeIds.forEach(id => state.selectedIds.add(id));
        console.log('🎯 Multi-select:', shapeIds.length, 'shapes');
      }),
      
      toggleShapeSelection: (shapeId) => set(state => {
        if (state.selectedIds.has(shapeId)) {
          state.selectedIds.delete(shapeId);
        } else {
          state.selectedIds.add(shapeId);
        }
        console.log('🔄 Toggled selection:', shapeId);
      }),
      
      clearSelection: () => set(state => {
        state.selectedIds.clear();
        console.log('❌ Selection cleared');
      }),
      
      /**
       * Start drag operation with atomic state update
       */
      startDrag: (mousePos, selectedShapeIds) => set(state => {
        const operationId = `drag-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        // Store initial positions
        const dragStartPositions = new Map();
        selectedShapeIds.forEach(shapeId => {
          const shape = state.getFinalShapePosition(shapeId);
          if (shape) {
            dragStartPositions.set(shapeId, { x: shape.x, y: shape.y });
          }
        });
        
        // ATOMIC UPDATE: All drag state set at once
        state.isDragging = true;
        state.dragOperationId = operationId;
        state.dragStartMousePos = mousePos;
        state.dragStartPositions = dragStartPositions;
        state.locallyDraggedShapes = new Set(selectedShapeIds);
        
        // Clear conflicting real-time positions for dragged shapes
        selectedShapeIds.forEach(shapeId => {
          state.realtimePositions.delete(shapeId);
        });
        
        // Initialize empty optimistic positions  
        state.optimisticPositions.clear();
        
        console.log('🚀 Drag started (atomic):', {
          operationId,
          shapeCount: selectedShapeIds.length,
          mousePos
        });
      }),
      
      /**
       * Update drag positions with optimistic updates + real-time sync
       */
      updateDragPositions: (currentMousePos) => {
        const state = get();
        
        if (!state.isDragging || !state.dragStartMousePos || !state.dragOperationId) {
          return;
        }
        
        const deltaX = currentMousePos.x - state.dragStartMousePos.x;
        const deltaY = currentMousePos.y - state.dragStartMousePos.y;
        
        // Calculate new positions
        const newOptimisticPositions = new Map();
        
        state.dragStartPositions.forEach((startPos, shapeId) => {
          const newPos = {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY
          };
          
          newOptimisticPositions.set(shapeId, newPos);
          
          // Send real-time updates to other users (60fps throttled)
          throttledUpdateShapePosition(shapeId, newPos);
        });
        
        // ATOMIC UPDATE: Set all optimistic positions at once
        set(state => {
          state.optimisticPositions = newOptimisticPositions;
        });
        
        // Debug logging (throttled)
        if (Date.now() % 200 < 50) {
          console.log('🎯 Optimistic drag update:', {
            operationId: state.dragOperationId,
            delta: { x: Math.round(deltaX), y: Math.round(deltaY) },
            shapesUpdated: newOptimisticPositions.size
          });
        }
      },
      
      /**
       * End drag with database sync and cleanup
       */
      endDrag: async () => {
        const state = get();
        
        if (!state.isDragging || !state.dragOperationId) {
          console.warn('⚠️ Cannot end drag: not currently dragging');
          return { success: false };
        }
        
        const operationId = state.dragOperationId;
        const finalPositions = new Map(state.optimisticPositions);
        
        console.log('🏁 Ending drag (atomic cleanup):', {
          operationId,
          shapesToSync: finalPositions.size
        });
        
        try {
          // Return positions for external database sync
          const positionsToSync = [];
          finalPositions.forEach((pos, shapeId) => {
            positionsToSync.push({ shapeId, position: pos });
            
            // Send final real-time update
            forceUpdateShapePosition(shapeId, pos);
          });
          
          // ATOMIC CLEANUP: Clear all drag state at once
          set(state => {
            state.isDragging = false;
            state.dragOperationId = null;
            state.dragStartMousePos = null;
            state.dragStartPositions.clear();
            state.optimisticPositions.clear();
          });
          
          // Clear local drag states after delay (ensure real-time propagation)
          setTimeout(() => {
            set(state => {
              state.locallyDraggedShapes.clear();
            });
          }, 500);
          
          console.log('✅ Drag ended (atomic) - positions ready for sync');
          
          return { success: true, positionsToSync };
          
        } catch (error) {
          console.error('❌ Error ending drag:', error);
          
          // Cleanup on error  
          set(state => {
            state.isDragging = false;
            state.dragOperationId = null;
            state.locallyDraggedShapes.clear();
          });
          
          return { success: false, error };
        }
      },
      
      /**
       * Handle incoming real-time position updates (with anti-jitter protection)
       */
      applyRealtimePositionUpdates: (positionUpdates) => set(state => {
        const appliedUpdates = [];
        
        Object.entries(positionUpdates).forEach(([shapeId, position]) => {
          // ANTI-JITTER: Only apply if shape is NOT being dragged locally
          if (!state.locallyDraggedShapes.has(shapeId)) {
            state.realtimePositions.set(shapeId, position);
            appliedUpdates.push(shapeId);
          } else {
            console.log('🚫 BLOCKED real-time update (anti-jitter):', shapeId);
          }
        });
        
        if (appliedUpdates.length > 0) {
          console.log('📡 Applied real-time updates:', appliedUpdates);
        }
      }),
      
      /**
       * Update shape in Firestore positions (authoritative)
       */
      updateShapePosition: (shapeId, position) => set(state => {
        state.firestorePositions.set(shapeId, position);
      }),
      
      /**
       * Add new shape
       */
      addShape: (shape) => set(state => {
        state.shapes.set(shape.id, shape);
        state.firestorePositions.set(shape.id, { x: shape.x, y: shape.y });
      }),
      
      /**
       * Remove shape
       */
      removeShape: (shapeId) => set(state => {
        state.shapes.delete(shapeId);
        state.firestorePositions.delete(shapeId);
        state.realtimePositions.delete(shapeId);
        state.optimisticPositions.delete(shapeId);
        state.selectedIds.delete(shapeId);
        state.locallyDraggedShapes.delete(shapeId);
      }),
      
      /**
       * Stage transform management
       */
      updateStageTransform: (scale, position) => set(state => {
        if (scale !== undefined) state.stageScale = scale;
        if (position !== undefined) state.stagePosition = position;
      }),
      
      // ===== COMPUTED GETTERS (SELECTORS) =====
      
      getSelectedShapeIds: () => Array.from(get().selectedIds),
      getSelectedShapes: () => {
        const state = get();
        const selected = [];
        state.selectedIds.forEach(id => {
          const shape = state.getFinalShapePosition(id);
          if (shape) selected.push(shape);
        });
        return selected;
      },
      
      getShapeById: (id) => get().getFinalShapePosition(id),
      
      // Backward compatibility
      selectedId: () => {
        const selectedIds = get().getSelectedShapeIds();
        return selectedIds.length > 0 ? selectedIds[0] : null;
      }
    }))
  )
);

export default useCanvasStore;
