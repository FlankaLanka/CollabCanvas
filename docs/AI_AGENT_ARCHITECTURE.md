# AI Canvas Agent - ReAct Architecture

## Overview

The AI Canvas Agent has been refactored to use a **ReAct (Reasoning + Acting)** architecture with LangChain's framework. This enables true multi-step reasoning, tool decomposition, and error recovery for complex canvas operations.

## Architecture

### 3-Layer Design

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

### Key Components

1. **CanvasReActAgent** (`src/services/ai/reactAgent.js`)
   - Main agent class using LangChain's ReAct framework
   - Handles multi-step reasoning and tool orchestration
   - Uses BufferMemory for conversation tracking

2. **Tool System** (`src/services/ai/tools/`)
   - **Primitive Tools**: Basic shape operations (create, move, resize, rotate, etc.)
   - **Query Tools**: Canvas introspection (listShapes, identifyShape, etc.)
   - **Layout Tools**: Spatial organization (arrangeShapes, distributeEvenly, etc.)
   - **Composite Tools**: High-level UI components (login forms, navigation bars, etc.)

3. **System Prompts** (`src/services/ai/prompts.js`)
   - Comprehensive reasoning guidelines
   - Tool usage instructions
   - Error recovery strategies

## Tool Categories

### Primitive Tools (7 tools)
- `createShape`: Create basic shapes (rectangle, circle, triangle, text, etc.)
- `moveShape`: Move shapes using natural language descriptions
- `resizeShape`: Resize shapes by scale factor or dimensions
- `rotateShape`: Rotate shapes by degrees
- `changeColor`: Change shape colors
- `changeText`: Modify text content
- `deleteShape`: Remove shapes from canvas

### Query Tools (4 tools)
- `listShapes`: Get all shapes with descriptions and positions
- `getCanvasState`: Get current canvas state and viewport info
- `identifyShape`: Find shapes by natural language description
- `findShapesByProperty`: Find shapes by color, type, or size

### Layout Tools (4 tools)
- `arrangeShapes`: Arrange multiple shapes in patterns (row, column, grid, circle)
- `createMultipleShapes`: Create N shapes with smart spacing
- `distributeEvenly`: Space shapes evenly in lines or areas
- `alignShapes`: Align shapes to common edges or center points

### Composite Tools (3 tools)
- `createLoginForm`: High-level login form creation
- `createNavigationBar`: High-level navigation bar creation
- `createCardLayout`: High-level card layout creation

## ReAct Reasoning Examples

### Example 1: Simple Command
**User**: "create a blue circle"

**ReAct Trace**:
```
Thought: User wants a blue circle, I'll use the createShape tool
Action: createShape({"shapeType": "circle", "x": 400, "y": 300, "radiusX": 50, "fill": "blue"})
Observation: Created circle (id=circle_123) at (400, 300) with color blue
Final Answer: I've created a blue circle at the center of the canvas.
```

### Example 2: Multi-Step Command
**User**: "create 5 blue circles then arrange them in a circle pattern"

**ReAct Trace**:
```
Thought: I need to create 5 blue circles first, then arrange them
Action: createMultipleShapes({"shapeType": "circle", "count": 5, "fill": "blue", "arrangement": "row"})
Observation: Created 5 blue circles
Thought: Now I need to arrange them in a circle pattern
Action: arrangeShapes({"shapeIds": ["blue circle 1", "blue circle 2", ...], "arrangement": "circle"})
Observation: Arranged 5 shapes in circle pattern
Final Answer: I've created 5 blue circles and arranged them in a circle pattern.
```

### Example 3: Error Recovery
**User**: "move the blue rectangle to the center"

**ReAct Trace**:
```
Thought: I need to find the blue rectangle first
Action: listShapes()
Observation: Found red circle at (100, 200), green triangle at (300, 400)
Thought: No blue rectangle found, let me check if there are any rectangles
Action: findShapesByProperty({"property": "type", "value": "rectangle"})
Observation: No rectangles found
Final Answer: I couldn't find a blue rectangle on the canvas. The canvas contains a red circle and green triangle.
```

## Key Benefits

### 1. True Multi-Step Reasoning
- Agent can break complex tasks into smaller steps
- Each step is executed and observed before proceeding
- Can handle commands like "create X then move it then rotate it"

### 2. Tool Decomposition
- Can choose between high-level composite tools or primitive building blocks
- Agent decides whether to use `createLoginForm` or build from primitives
- Flexible approach for different complexity levels

### 3. Error Recovery
- If a shape isn't found, agent can query canvas state and try alternatives
- Robust handling of natural language shape references
- Graceful degradation when tools fail

### 4. State Memory
- LangChain BufferMemory tracks conversation history
- Remembers recently created shapes for "these shapes" references
- Maintains context across multiple commands

### 5. Transparent Reasoning
- Intermediate steps show the agent's thought process
- Users can see how complex tasks are broken down
- Debugging and understanding of agent behavior

## Implementation Details

### Tool Design Pattern
```javascript
export function createShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "createShape",
    description: `Create a shape on the canvas. Returns the created shape ID and position.
    
    Parameters:
    - shapeType: "rectangle" | "circle" | "triangle" | "text" | "text_input"
    - x: number (center viewport is 400)
    - y: number (center viewport is 300)
    - width: number (optional, for rectangles)
    - height: number (optional, for rectangles)
    - fill: string (color name or hex)
    
    Example input: {"shapeType": "rectangle", "x": 400, "y": 300, "width": 200, "height": 100, "fill": "blue"}`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createShape(params);
        return `Created ${result.type} (id=${result.id}) at (${result.x}, ${result.y}) with color ${result.fill}`;
      } catch (error) {
        return `Error creating shape: ${error.message}`;
      }
    }
  });
}
```

### Agent Configuration
```javascript
this.executor = await initializeAgentExecutorWithOptions(
  tools,
  this.model,
  {
    agentType: "zero-shot-react-description",
    memory: this.memory,
    maxIterations: 10, // Allow multi-step reasoning
    returnIntermediateSteps: true,
    verbose: true
  }
);
```

## Command Categories Supported

### ✅ Creation Commands
- "Create a red circle at position 100, 200"
- "Add a text layer that says 'Hello World'"
- "Make a 200x300 rectangle"

### ✅ Manipulation Commands
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big"
- "Rotate the text 45 degrees"

### ✅ Layout Commands
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"

### ✅ Complex Commands
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image, and description"

### ✅ Multi-Step Commands
- "Create 5 blue circles then arrange them in a circle pattern"
- "Add a red rectangle, then move it to 500,400, then rotate it 45 degrees"

## File Structure

```
src/services/ai/
├── reactAgent.js          # Main ReAct agent implementation
├── prompts.js             # System prompts and reasoning examples
└── tools/
    ├── index.js           # Tool exports and utilities
    ├── primitives.js       # Basic shape operations
    ├── queries.js          # Canvas introspection
    ├── layout.js           # Spatial organization
    └── composite.js        # High-level UI components
```

## Future Enhancements

1. **Tool Learning**: Agent could learn from user feedback to improve tool usage
2. **Custom Tools**: Allow users to define custom tools for specific workflows
3. **Tool Chaining**: Automatic chaining of related tools for common patterns
4. **Visual Feedback**: Show intermediate steps in the UI for transparency
5. **Tool Analytics**: Track which tools are most effective for different command types

## Conclusion

The ReAct architecture provides a robust foundation for AI canvas manipulation with true multi-step reasoning, error recovery, and tool decomposition. The agent can handle everything from simple shape creation to complex multi-step workflows, making it a powerful tool for collaborative canvas applications.
