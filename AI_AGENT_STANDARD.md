# AI Agent Standard

## Overview

This document defines the standard for the single AI agent used in this project. There is **ONE** agent with comprehensive capabilities deployed to AWS Lambda.

## Agent Location

- **Production**: Deployed to AWS Lambda at `https://vtxv073yg9.execute-api.us-east-1.amazonaws.com/api/ai-chat`
- **Source Code**: `aws-ai-server/server.js`
- **Frontend Reference**: `src/services/ai.js` (points to AWS endpoint)

## Agent Capabilities

The agent has **43 functions** providing comprehensive canvas manipulation capabilities:

### Creation Commands (2 functions)
- `createShape` - Create single shapes
- `createMultipleShapes` - Create multiple shapes with automatic layout

### Manipulation Commands (5 functions)
- `moveShape` - Move existing shapes
- `resizeShape` - Resize existing shapes
- `rotateShape` - Rotate existing shapes
- `changeShapeColor` - Change shape colors
- `changeShapeText` - Change text content

### Layout Commands (6 functions)
- `arrangeShapesInRow` - Arrange shapes in horizontal rows
- `arrangeShapesInGrid` - Arrange shapes in grid patterns
- `distributeShapesEvenly` - Distribute shapes evenly in containers
- `centerGroup` - Center groups of shapes
- `addGroupMargin` - Add margins around groups
- `arrangeShapes` - Arrange shapes in custom patterns

### Complex UI Commands (3 functions)
- `createLoginForm` - Create professional login forms
- `createNavigationBar` - Create navigation bars
- `createCardLayout` - Create card layouts

### Utility Commands (4 functions)
- `getCanvasState` - Get current canvas state
- `listShapes` - List all shapes with descriptions
- `identifyShape` - Find specific shapes by ID
- `deleteShape` - Delete existing shapes

### Design System & Quality Tools (8 functions)
- `autoAlignUI` - Auto-align to 8px grid
- `checkUIQuality` - Check UI quality issues
- `autoFixUI` - Automatically fix UI issues
- `layoutStack` - Layout shapes in stacks
- `layoutGrid` - Layout shapes in grids
- `getSelection` - Get current selection
- `validateUILayout` - Validate layout quality
- `createFormContainer` - Create form containers

### Advanced Layout Tools (5 functions)
- `stackVertically` - Stack elements vertically
- `alignHorizontally` - Align elements horizontally
- `centerContainer` - Calculate center positions
- `createLoginFormWithLayout` - Advanced login form creation
- `createFormContainer` - Create form containers

### Relative Positioning Tools (6 functions)
- `placeBelow` - Place shapes below others
- `placeRightOf` - Place shapes to the right
- `alignWith` - Align shapes with others
- `centerInContainer` - Center within containers
- `setPaddingFromContainer` - Set consistent padding
- `groupShapes` - Group shapes together

### Container Management (3 functions)
- `distributeInContainer` - Distribute shapes in containers
- `analyzeShapeRelationships` - Analyze spatial relationships
- `validateAndFix` - Enhanced validation with fixes

### Blueprint System Tools (2 functions)
- `executeBlueprintPlan` - Execute structured UI blueprints
- `generateLoginFormBlueprint` - Generate login form blueprints

### Natural Language Tools (3 functions)
- `parsePositionCommand` - Parse position commands
- `resolveTheseShapes` - Resolve shape references
- `parseSizeDescriptor` - Parse size descriptors

## LangSmith Integration

The agent includes comprehensive LangSmith tracing:

- **Tracing Service**: `aws-ai-server/langsmith.js`
- **Project**: `ai-agent`
- **Endpoint**: `https://api.smith.langchain.com`
- **Features**: Full request/response tracing, tool usage monitoring, ReAct step tracking

## Deployment Process

1. **Environment Variables Required**:
   ```bash
   export OPENAI_API_KEY="your-openai-key"
   export LANGCHAIN_API_KEY="your-langsmith-key"
   export LANGCHAIN_PROJECT="ai-agent"
   export LANGCHAIN_TRACING_V2="true"
   export LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
   ```

2. **Deploy Command**:
   ```bash
   cd aws-ai-server
   npx serverless deploy
   ```

3. **Verify Deployment**:
   ```bash
   curl https://vtxv073yg9.execute-api.us-east-1.amazonaws.com/health
   ```

## Adding New Functions

When adding new functions to the agent:

1. **Update AWS Server**: Add function to `AI_FUNCTIONS` array in `aws-ai-server/server.js`
2. **Update Frontend**: Add function to `AI_FUNCTIONS` array in `src/services/ai.js`
3. **Deploy**: Run `npx serverless deploy` from `aws-ai-server/` directory
4. **Test**: Verify function works in production

## File Structure

```
aws-ai-server/
├── server.js              # Main server with 43 AI functions
├── langsmith.js           # LangSmith tracing service
├── package.json           # Dependencies including LangChain
├── serverless.yml         # AWS Lambda configuration
└── test-langsmith-aws.js  # Testing script

src/services/
└── ai.js                  # Frontend AI service (43 functions)
```

## Environment Variables

Required for deployment:

- `OPENAI_API_KEY` - OpenAI API key
- `LANGCHAIN_API_KEY` - LangSmith API key
- `LANGCHAIN_PROJECT` - LangSmith project name
- `LANGCHAIN_TRACING_V2` - Enable tracing
- `LANGCHAIN_ENDPOINT` - LangSmith endpoint

## Testing

Test the deployed agent:

```bash
cd aws-ai-server
node test-langsmith-aws.js
```

Check LangSmith dashboard at https://smith.langchain.com/ for traces.

## Important Notes

- **Single Agent**: There is only ONE agent in this project
- **AWS Deployment**: The agent is deployed to AWS Lambda
- **Frontend Integration**: Frontend points to AWS endpoint
- **LangSmith Tracing**: All requests are traced in LangSmith
- **43 Functions**: Complete set of canvas manipulation tools
- **Professional UI**: Advanced layout and design system tools

## Maintenance

- **Updates**: Always update both AWS server and frontend definitions
- **Deployment**: Use `npx serverless deploy` for updates
- **Monitoring**: Check LangSmith dashboard for usage patterns
- **Testing**: Run test scripts before and after deployments

This standard ensures consistency and prevents the confusion of multiple agents with different capabilities.
