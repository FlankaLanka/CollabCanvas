import { useMemo } from 'react';
import { Group, Line, Text } from 'react-konva';

/**
 * Dynamic Grid Component - Smoothly adapts to zoom and pan with multiple grid levels
 * Provides precise coordinate reference at any zoom level
 */
function Grid({ 
  stageWidth, 
  stageHeight, 
  stageScale, 
  stagePosition 
}) {
  
  const gridData = useMemo(() => {
    if (!stageWidth || !stageHeight) return { majorLines: [], minorLines: [], labels: [] };
    
    // Calculate visible area bounds in canvas coordinates with buffer for smooth panning
    const bufferSize = Math.max(stageWidth, stageHeight) / stageScale; // Buffer extends beyond viewport
    const viewportLeft = -stagePosition.x / stageScale - bufferSize;
    const viewportTop = -stagePosition.y / stageScale - bufferSize;
    const viewportRight = viewportLeft + (stageWidth / stageScale) + (2 * bufferSize);
    const viewportBottom = viewportTop + (stageHeight / stageScale) + (2 * bufferSize);
    
    // Advanced dynamic grid spacing calculation
    // Creates a smooth scaling experience with proper subdivisions
    const getOptimalSpacing = (scale) => {
      const targetScreenSpacing = 40; // Target 40px spacing on screen for better granularity
      const canvasSpacing = targetScreenSpacing / scale;
      
      // Find the best power of 10 or common subdivision
      const magnitude = Math.pow(10, Math.floor(Math.log10(canvasSpacing)));
      const normalized = canvasSpacing / magnitude;
      
      let spacing;
      if (normalized <= 1.2) spacing = magnitude;
      else if (normalized <= 2.5) spacing = 2 * magnitude;
      else if (normalized <= 6) spacing = 5 * magnitude;
      else spacing = 10 * magnitude;
      
      return spacing;
    };
    
    // Calculate multiple grid levels for smooth scaling
    const majorSpacing = getOptimalSpacing(stageScale);
    
    // More intelligent minor spacing based on zoom level
    let minorSpacing = majorSpacing / 5;
    if (stageScale > 4) {
      minorSpacing = majorSpacing / 10; // More granular when heavily zoomed in
    } else if (stageScale > 2) {
      minorSpacing = majorSpacing / 5;  // Standard subdivision
    } else if (stageScale > 0.5) {
      minorSpacing = majorSpacing / 2;  // Less dense when zoomed out
    }
    
    const majorLines = [];
    const minorLines = [];
    const labels = [];
    
    // Helper to add lines
    const addGridLines = (spacing, isVertical, isMajor) => {
      const startCoord = isVertical 
        ? Math.floor(viewportLeft / spacing) * spacing
        : Math.floor(viewportTop / spacing) * spacing;
      const endCoord = isVertical 
        ? Math.ceil(viewportRight / spacing) * spacing
        : Math.ceil(viewportBottom / spacing) * spacing;
      
      for (let coord = startCoord; coord <= endCoord; coord += spacing) {
        const isOrigin = coord === 0;
        const points = isVertical 
          ? [coord, viewportTop - 100, coord, viewportBottom + 100]
          : [viewportLeft - 100, coord, viewportRight + 100, coord];
        
        const lineData = {
          key: `${isMajor ? 'maj' : 'min'}-${isVertical ? 'v' : 'h'}-${coord}`,
          points,
          stroke: isOrigin ? '#666666' : (isMajor ? '#D1D5DB' : '#F3F4F6'),
          strokeWidth: isOrigin ? 1.5 : (isMajor ? 0.8 : 0.3),
          opacity: isOrigin ? 0.9 : (isMajor ? 0.6 : 0.4)
        };
        
        if (isMajor) {
          majorLines.push(lineData);
        } else {
          minorLines.push(lineData);
        }
      }
    };
    
    // Add multiple grid levels based on zoom
    // Major grid lines (always visible)
    addGridLines(majorSpacing, true, true);   // Vertical major
    addGridLines(majorSpacing, false, true);  // Horizontal major
    
    // Minor grid lines (visible at medium zoom)
    if (stageScale > 0.3) {
      addGridLines(minorSpacing, true, false);   // Vertical minor
      addGridLines(minorSpacing, false, false);  // Horizontal minor
    }
    
    // Micro grid lines for very high zoom levels
    if (stageScale > 8) {
      const microSpacing = minorSpacing / 5;
      const microLines = [];
      
      // Add micro lines with even lighter styling
      const addMicroLines = (spacing, isVertical) => {
        const startCoord = isVertical 
          ? Math.floor(viewportLeft / spacing) * spacing
          : Math.floor(viewportTop / spacing) * spacing;
        const endCoord = isVertical 
          ? Math.ceil(viewportRight / spacing) * spacing
          : Math.ceil(viewportBottom / spacing) * spacing;
        
        for (let coord = startCoord; coord <= endCoord; coord += spacing) {
          if (coord % minorSpacing !== 0 && coord % majorSpacing !== 0) { // Don't duplicate major/minor lines
            const points = isVertical 
              ? [coord, viewportTop, coord, viewportBottom]
              : [viewportLeft, coord, viewportRight, coord];
            
            microLines.push({
              key: `micro-${isVertical ? 'v' : 'h'}-${coord}`,
              points,
              stroke: '#F9FAFB',
              strokeWidth: 0.15,
              opacity: 0.3
            });
          }
        }
      };
      
      addMicroLines(microSpacing, true);   // Vertical micro
      addMicroLines(microSpacing, false);  // Horizontal micro
      
      // Add micro lines to minorLines array for rendering
      minorLines.push(...microLines);
    }
    
    // Smart labeling system - maintains optimal label density
    const getOptimalLabelSpacing = (spacing, viewportSize) => {
      // Target: 4-8 labels per screen dimension for optimal readability
      const targetLabelsPerScreen = 6;
      const screenSpan = viewportSize / stageScale;
      const naturalLabels = screenSpan / spacing;
      
      // Calculate multiplier to get close to target
      const multiplier = Math.max(1, Math.round(naturalLabels / targetLabelsPerScreen));
      return spacing * multiplier;
    };
    
    const shouldShowLabel = (coord, spacing, isVertical = true) => {
      const viewportDimension = isVertical ? stageWidth : stageHeight;
      const optimalSpacing = getOptimalLabelSpacing(spacing, viewportDimension);
      return coord % optimalSpacing === 0;
    };
    
    // Format coordinate labels with appropriate precision
    const formatCoordinate = (coord) => {
      if (Math.abs(coord) < 1 && coord !== 0) {
        // Show decimals for small values
        return coord.toFixed(2).replace(/\.?0+$/, '');
      } else if (Math.abs(coord) < 10 && coord % 1 !== 0) {
        return coord.toFixed(1);
      } else {
        return coord.toString();
      }
    };
    
    // Responsive coordinate label scaling - adapts to zoom level for optimal readability
    const baseFontSize = 12;
    const fontSize = baseFontSize;  // Keep consistent base size
    const labelOpacity = Math.max(0.6, Math.min(0.9, 0.8));
    
    // Add labels for major grid lines
    const startX = Math.floor(viewportLeft / majorSpacing) * majorSpacing;
    const endX = Math.ceil(viewportRight / majorSpacing) * majorSpacing;
    const startY = Math.floor(viewportTop / majorSpacing) * majorSpacing;
    const endY = Math.ceil(viewportBottom / majorSpacing) * majorSpacing;
    
    // Calculate actual visible area (without buffer) for label positioning
    const actualViewportLeft = -stagePosition.x / stageScale;
    const actualViewportTop = -stagePosition.y / stageScale;
    const actualViewportRight = actualViewportLeft + stageWidth / stageScale;
    const actualViewportBottom = actualViewportTop + stageHeight / stageScale;
    
    // X-axis labels with optimal density
    for (let x = startX; x <= endX; x += majorSpacing) {
      if (shouldShowLabel(x, majorSpacing, true) && stageScale > 0.08) {
        labels.push({
          key: `xl-${x}`,
          x: x + (8 / stageScale),
          y: actualViewportTop + (18 / stageScale),
          text: formatCoordinate(x),
          fontSize: fontSize / Math.max(0.5, Math.min(2, stageScale)),
          fill: '#555555',
          opacity: labelOpacity
        });
      }
    }
    
    // Y-axis labels with optimal density  
    for (let y = startY; y <= endY; y += majorSpacing) {
      if (shouldShowLabel(y, majorSpacing, false) && y !== 0 && stageScale > 0.08) {
        labels.push({
          key: `yl-${y}`,
          x: actualViewportLeft + (12 / stageScale),
          y: y - (4 / stageScale),
          text: formatCoordinate(y),
          fontSize: fontSize / Math.max(0.5, Math.min(2, stageScale)),
          fill: '#555555',
          opacity: labelOpacity
        });
      }
    }
    
    // Add minor grid labels only when there's room and they're useful
    if (stageScale > 8 && minorSpacing >= 1) {
      const minorLabelSpacing = getOptimalLabelSpacing(minorSpacing, Math.min(stageWidth, stageHeight));
      
      // Only show minor labels if they don't crowd major labels
      if (minorLabelSpacing > minorSpacing * 2) {
        const minorStartX = Math.floor(actualViewportLeft / minorLabelSpacing) * minorLabelSpacing;
        const minorEndX = Math.ceil(actualViewportRight / minorLabelSpacing) * minorLabelSpacing;
        const minorStartY = Math.floor(actualViewportTop / minorLabelSpacing) * minorLabelSpacing;
        const minorEndY = Math.ceil(actualViewportBottom / minorLabelSpacing) * minorLabelSpacing;
        
        // Sparse minor X-axis labels
        for (let x = minorStartX; x <= minorEndX; x += minorLabelSpacing) {
          if (x % (getOptimalLabelSpacing(majorSpacing, stageWidth)) !== 0 && Math.abs(x) > 0.01) {
            labels.push({
              key: `minxl-${x}`,
              x: x + (5 / stageScale),
              y: actualViewportTop + (35 / stageScale),
              text: formatCoordinate(x),
              fontSize: (fontSize * 0.7) / Math.max(0.5, Math.min(2, stageScale)),
              fill: '#999999',
              opacity: labelOpacity * 0.5
            });
          }
        }
        
        // Sparse minor Y-axis labels
        for (let y = minorStartY; y <= minorEndY; y += minorLabelSpacing) {
          if (y % (getOptimalLabelSpacing(majorSpacing, stageHeight)) !== 0 && y !== 0 && Math.abs(y) > 0.01) {
            labels.push({
              key: `minyl-${y}`,
              x: actualViewportLeft + (40 / stageScale),
              y: y - (2 / stageScale),
              text: formatCoordinate(y),
              fontSize: (fontSize * 0.7) / Math.max(0.5, Math.min(2, stageScale)),
              fill: '#999999',
              opacity: labelOpacity * 0.5
            });
          }
        }
      }
    }
    
    // Origin label removed per user request
    
    return { majorLines, minorLines, labels };
  }, [stageWidth, stageHeight, stageScale, stagePosition.x, stagePosition.y, stagePosition]);
  
  // Don't render grid if heavily zoomed out
  if (stageScale < 0.05) {
    return null;
  }
  
  return (
    <Group>
      {/* Minor Grid Lines (render first, behind major lines) */}
      {gridData.minorLines.map(line => (
        <Line
          key={line.key}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
          perfectDrawEnabled={false}
          listening={false}
        />
      ))}
      
      {/* Major Grid Lines */}
      {gridData.majorLines.map(line => (
        <Line
          key={line.key}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
          perfectDrawEnabled={false}
          listening={false}
        />
      ))}
      
      {/* Grid Labels */}
      {gridData.labels.map(label => (
        <Text
          key={label.key}
          x={label.x}
          y={label.y}
          text={label.text}
          fontSize={label.fontSize}
          fill={label.fill}
          fontStyle={label.fontStyle}
          opacity={label.opacity}
          perfectDrawEnabled={false}
          listening={false}
        />
      ))}
    </Group>
  );
}

export default Grid;
