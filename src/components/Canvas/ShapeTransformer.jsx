import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import { useCanvas } from '../../contexts/ModernCanvasContext';

/**
 * ShapeTransformer - Provides resize and rotation handles for selected shapes
 * 
 * Features:
 * - Visual resize handles on corners and edges
 * - Rotation handle at the top
 * - Multi-select support (transforms all selected shapes together)
 * - Real-time sync to database
 * - Maintains aspect ratio with Shift key
 */
function ShapeTransformer() {
  const { 
    selectedIds, 
    updateShape, 
    stageRef,
    setTransformMode,
    triggerUpdate
  } = useCanvas();
  
  const transformerRef = useRef();
  const isTransforming = useRef(false);

  // Cleanup transformer when shapes are deleted
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // Check if any of the transformer's nodes are no longer valid
    const nodes = transformer.nodes();
    const validNodes = nodes.filter(node => 
      node && node.getStage() && node.getParent()
    );

    // If some nodes became invalid, update the transformer
    if (validNodes.length !== nodes.length) {
      console.log('🧹 Cleaning up transformer - removing invalid nodes');
      transformer.nodes(validNodes);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedIds]); // Re-run when selection changes

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    
    if (!transformer || !stage) return;

    if (selectedIds.length === 0) {
      // No selection - hide transformer
      transformer.nodes([]);
      return;
    }

    // Find selected shape nodes on the stage
    const selectedNodes = [];
    selectedIds.forEach(shapeId => {
      const node = stage.findOne(`#${shapeId}`);
      if (node && node.getStage()) { // Additional check: ensure node is still attached to stage
        selectedNodes.push(node);
      }
    });

    if (selectedNodes.length > 0) {
      // Attach transformer to selected nodes
      transformer.nodes(selectedNodes);
      transformer.getLayer()?.batchDraw();
    } else {
      // No valid nodes found - clear transformer
      transformer.nodes([]);
    }
  }, [selectedIds, stageRef]);

  // Handle transform start
  const handleTransformStart = () => {
    isTransforming.current = true;
    setTransformMode(true);
    console.log('🔄 Transform started for', selectedIds.length, 'shapes');
  };

  // Handle transform (real-time updates during transform)
  const handleTransform = () => {
    if (!isTransforming.current) return;
    
    // Optionally provide real-time feedback here
    // For now, we'll wait until transform end to sync to database
  };

  // Handle transform end (sync to database)
  const handleTransformEnd = async () => {
    if (!isTransforming.current) return;
    
    isTransforming.current = false;
    setTransformMode(false);
    const transformer = transformerRef.current;
    
    if (!transformer) return;

    const nodes = transformer.nodes();
    console.log('✅ Transform ended - syncing', nodes.length, 'shapes to database');

    // Update each transformed shape
    for (const node of nodes) {
      const shapeId = node.id();
      if (!shapeId) continue;

      // CRITICAL: Check if node is still valid and attached to stage
      if (!node.getStage() || !node.getParent()) {
        console.warn('⚠️ Skipping transform for detached node:', shapeId);
        continue;
      }

      try {
        // Get current transform properties
        const attrs = node.attrs;
        const position = node.position();
        const scale = node.scale();
        const rotation = node.rotation(); // Konva rotation in degrees

        console.log('🔍 Transform data for shape', shapeId, ':', {
          position,
          scale,
          rotation,
          attrs: { width: attrs.width, height: attrs.height, radiusX: attrs.radiusX, radiusY: attrs.radiusY }
        });

        // Calculate new dimensions and position more precisely
        let updates = {
          x: Math.round(position.x), // Round to avoid floating point precision issues
          y: Math.round(position.y),
          rotation: Math.round(rotation * 100) / 100 // Keep in degrees with 2 decimal precision
        };
        
        // Ensure rotation is stored in degrees (0-360 range)
        if (updates.rotation < 0) {
          updates.rotation = ((updates.rotation % 360) + 360) % 360;
        } else if (updates.rotation >= 360) {
          updates.rotation = updates.rotation % 360;
        }

        // Handle scale based on shape type
        if (node.className === 'Rect') {
          // For rectangles: apply scale to dimensions and reset scale to 1
          const newWidth = Math.round(attrs.width * scale.x);
          const newHeight = Math.round(attrs.height * scale.y);
          
          console.log(`📏 Rect scaling: ${attrs.width}x${attrs.height} * ${scale.x.toFixed(2)}x${scale.y.toFixed(2)} = ${newWidth}x${newHeight}`);
          
          updates.width = newWidth;
          updates.height = newHeight;
          updates.scaleX = 1;
          updates.scaleY = 1;
          
          // Reset the node scale immediately to prevent cumulative scaling
          node.scaleX(1);
          node.scaleY(1);
        } else if (node.className === 'Ellipse') {
          // For ellipses: apply scale to radiusX/radiusY and reset scale to 1
          const newRadiusX = Math.round(attrs.radiusX * scale.x);
          const newRadiusY = Math.round(attrs.radiusY * scale.y);
          
          console.log(`⚪ Ellipse scaling: ${attrs.radiusX}x${attrs.radiusY} * ${scale.x.toFixed(2)}x${scale.y.toFixed(2)} = ${newRadiusX}x${newRadiusY}`);
          
          updates.radiusX = newRadiusX;
          updates.radiusY = newRadiusY;
          updates.scaleX = 1;
          updates.scaleY = 1;
          
          // Reset the node scale immediately to prevent cumulative scaling
          node.scaleX(1);
          node.scaleY(1);
        } else {
          // For other shapes (lines, triangles, text): keep the scale in shape properties
          const newScaleX = Math.round(scale.x * 100) / 100;
          const newScaleY = Math.round(scale.y * 100) / 100;
          
          console.log(`🔺 Shape scaling: scale ${newScaleX}x${newScaleY}`);
          
          updates.scaleX = newScaleX;
          updates.scaleY = newScaleY;
        }

        console.log('📝 Applying updates:', updates);

        // Update shape in context (this will sync to database)
        await updateShape(shapeId, updates);
        
        console.log('✅ Shape updated successfully:', shapeId);
      } catch (error) {
        console.error('❌ Error updating transformed shape:', shapeId, error);
      }
    }

    // Force React re-render to update nodes with new properties
    triggerUpdate();
    
    // Re-attach transformer to updated nodes after a short delay
    // This ensures the transformer works with the updated node properties
    setTimeout(() => {
      const stage = stageRef.current;
      if (!stage || !transformer) return;
      
      const updatedNodes = [];
      selectedIds.forEach(shapeId => {
        const node = stage.findOne(`#${shapeId}`);
        if (node && node.getStage()) { // Additional safety check
          updatedNodes.push(node);
        }
      });
      
      if (updatedNodes.length > 0) {
        transformer.nodes(updatedNodes);
      }
      
      transformer.getLayer()?.batchDraw();
    }, 10); // Small delay to ensure React has re-rendered
  };

  // Don't render transformer if no shapes are selected
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit resize to prevent shapes from becoming too small
        const minWidth = 20;
        const minHeight = 20;
        
        if (newBox.width < minWidth || newBox.height < minHeight) {
          return oldBox;
        }
        
        return newBox;
      }}
      // Visual styling for handles
      borderStroke="#3B82F6"
      borderStrokeWidth={2}
      borderDash={[4, 4]}
      anchorStroke="#3B82F6"
      anchorStrokeWidth={2}
      anchorFill="#FFFFFF"
      anchorSize={8}
      anchorCornerRadius={2}
      
      // Enable all transformation types
      enabledAnchors={[
        'top-left', 'top-center', 'top-right',
        'middle-right', 'bottom-right', 'bottom-center',
        'bottom-left', 'middle-left'
      ]}
      
      // Rotation handle
      rotateEnabled={true}
      rotateAnchorOffset={30}
      rotateAnchorCursor="crosshair"
      
      // Event handlers
      onTransformStart={handleTransformStart}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      
      // Keep transformer ratio with shift key
      keepRatio={false} // We'll handle this in the boundBoxFunc if needed
      
      // Performance settings
      ignoreStroke={true}
      flipEnabled={false} // Disable flipping to prevent confusing UX
    />
  );
}

export default ShapeTransformer;
