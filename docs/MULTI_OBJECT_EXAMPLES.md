# Multi-Object Creation Examples

This document provides examples of multi-object creation commands and their expected outputs.

## Basic Grid Creation

### Command: "Create a 3x3 grid of squares"
**Expected Output:**
- 9 squares arranged in 3 rows and 3 columns
- Even spacing between all shapes
- All shapes aligned to grid positions

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'rectangle',
  count: 9,
  arrangement: 'grid',
  gridRows: 3,
  gridCols: 3,
  width: 50,
  height: 50,
  fill: 'blue'
})
```

## Row with Specific Spacing

### Command: "Create 5 circles in a row with 30px spacing"
**Expected Output:**
- 5 circles arranged horizontally
- 30px gaps between shape centers
- All circles aligned at the same Y position

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'circle',
  count: 5,
  arrangement: 'row',
  spacing: 30,
  radiusX: 25,
  radiusY: 25,
  fill: 'red'
})
```

## Centered Group

### Command: "Create 4 rectangles in a row, centered on the canvas"
**Expected Output:**
- 4 rectangles arranged horizontally
- Group centered as a unit in the viewport
- Equal spacing between shapes

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'rectangle',
  count: 4,
  arrangement: 'row',
  centerInViewport: true,
  width: 60,
  height: 40,
  fill: 'green'
})
```

## Even Distribution

### Command: "Distribute these 6 shapes evenly across 500px"
**Expected Output:**
- 6 existing shapes repositioned
- Equal spacing calculated automatically
- Shapes distributed across 500px width

**AI Function Call:**
```javascript
distributeShapesEvenly({
  shapeIds: ['shape1', 'shape2', 'shape3', 'shape4', 'shape5', 'shape6'],
  containerWidth: 500,
  direction: 'horizontal'
})
```

## Grid with Margin

### Command: "Create a 2x4 grid of triangles with 20px margin"
**Expected Output:**
- 8 triangles in 2 rows, 4 columns
- 20px margin around the entire group
- Group positioned to accommodate margin

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'triangle',
  count: 8,
  arrangement: 'grid',
  gridRows: 2,
  gridCols: 4,
  marginSize: 20,
  fill: 'purple'
})
```

## Layout Manipulation

### Command: "Arrange these shapes in a horizontal row"
**Expected Output:**
- Existing shapes repositioned in a row
- Consistent spacing between shapes
- All shapes aligned horizontally

**AI Function Call:**
```javascript
arrangeShapesInRow({
  shapeIds: ['blue rectangle', 'red circle', 'green triangle'],
  spacing: 50,
  startX: 100,
  startY: 200
})
```

### Command: "Center these 4 rectangles"
**Expected Output:**
- 4 rectangles repositioned as a group
- Group centered at specified point
- Relative positions maintained

**AI Function Call:**
```javascript
centerGroup({
  shapeIds: ['rect1', 'rect2', 'rect3', 'rect4'],
  centerX: 400,
  centerY: 300
})
```

### Command: "Add 20px margin around this group"
**Expected Output:**
- All shapes in group shifted outward
- 20px margin added around the group
- Group bounds expanded

**AI Function Call:**
```javascript
addGroupMargin({
  shapeIds: ['shape1', 'shape2', 'shape3'],
  marginSize: 20
})
```

## Complex Layout Examples

### Command: "Create a login form with username and password fields"
**Expected Output:**
- Form container with proper spacing
- Username input field
- Password input field
- Submit button
- All elements properly aligned

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'text_input',
  count: 3,
  arrangement: 'column',
  spacing: 30,
  centerInViewport: true,
  width: 200,
  height: 40,
  fill: 'white'
})
```

### Command: "Make a navigation bar with 4 menu items"
**Expected Output:**
- 4 menu items in a horizontal row
- Equal spacing between items
- Consistent sizing

**AI Function Call:**
```javascript
createMultipleShapes({
  shapeType: 'rectangle',
  count: 4,
  arrangement: 'row',
  spacing: 20,
  width: 80,
  height: 30,
  fill: 'navy'
})
```

## Validation Examples

### Command: "Validate that the grid is properly aligned"
**Expected Output:**
- Check that all shapes are in grid positions
- Verify consistent spacing
- Report any alignment issues

**AI Function Call:**
```javascript
validateLayout({
  expectedCount: 9,
  expectedArrangement: 'grid',
  tolerance: 5
})
```

## Spatial Reasoning Examples

The AI should demonstrate spatial reasoning by calculating:

### Example 1: Row Layout
- **Input**: "5 squares (50px each) with 20px spacing"
- **Calculation**: 
  - totalWidth = (50 × 5) + (20 × 4) = 330px
  - startX = centerX - 330/2 = centerX - 165
- **Result**: 5 squares centered with 20px gaps

### Example 2: Grid Layout
- **Input**: "3x3 grid of circles (40px diameter) with 15px spacing"
- **Calculation**:
  - totalWidth = (40 × 3) + (15 × 2) = 150px
  - totalHeight = (40 × 3) + (15 × 2) = 150px
- **Result**: 3×3 grid of circles with consistent spacing

### Example 3: Even Distribution
- **Input**: "Distribute 4 shapes evenly in 300px container"
- **Calculation**:
  - availableSpace = 300 - (shapeWidth × 4)
  - spacing = availableSpace / 5
- **Result**: 4 shapes with equal spacing

## Success Criteria

After implementation, the agent should successfully handle:

✅ **"Create a 3x3 grid of squares"** → 9 squares in perfect grid
✅ **"Make 5 circles in a row with 25px spacing"** → 5 circles, exact spacing  
✅ **"Arrange these shapes in a horizontal row"** → Existing shapes reorganized
✅ **"Center these 4 rectangles"** → Group centered as unit
✅ **"Add 20px margin around this group"** → Shapes shifted outward
✅ **"Distribute 6 shapes evenly across 400px"** → Equal spacing calculated

The agent should demonstrate:
- **Spatial Reasoning**: Calculates dimensions before creating
- **Consistency**: Same command produces same layout every time  
- **Validation**: Can verify layouts match expectations
- **Flexibility**: Supports various arrangements and parameters
