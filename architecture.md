graph TB
subgraph "Client Browser"
subgraph "React Application"
UI[UI Components]

            subgraph "Components Layer"
                Auth[Auth Components<br/>Login/Signup/Google]
                Canvas[Canvas Components<br/>Canvas/Shapes/Controls<br/>Infinite Canvas + Pan/Zoom]
                Collab[Collaboration Components<br/>Cursor/Presence/Multi-user]
                Layout[Layout Components<br/>Navbar/Toolbar/Properties]
                AI[AI Components<br/>Chat Interface/Commands]
            end

            subgraph "State Management"
                AuthCtx[Auth Context<br/>User State]
                CanvasCtx[Canvas Context<br/>Shapes State]
                CanvasStore[Zustand Store<br/>Centralized State + Immer]
            end

            subgraph "Custom Hooks"
                useAuth[useAuth<br/>Auth Operations]
                useCanvas[useCanvas<br/>Canvas Operations]
                useCursors[useCursors<br/>Cursor Tracking]
                usePresence[usePresence<br/>Presence Management]
                useAI[useAI<br/>AI Agent Integration]
            end

            subgraph "Services Layer"
                AuthSvc[Auth Service<br/>signup/login/Google/logout]
                CanvasSvc[Canvas Service<br/>CRUD + Locking operations]
                CursorSvc[Cursor Service<br/>Position updates]
                PresenceSvc[Presence Service<br/>Online status]
                AISvc[AI Service<br/>Natural Language Commands]
                RealtimeSvc[Realtime Service<br/>Hybrid Sync System]
                FirebaseInit[Firebase Initialization<br/>Config & Init]
            end

            subgraph "Rendering Engine"
                Konva[Konva.js<br/>Canvas Rendering<br/>60 FPS + Hardware Accel]
            end

            subgraph "Utilities"
                Helpers[Helper Functions<br/>generateUserColor]
                Constants[Constants<br/>Canvas dimensions]
                GridSnap[Grid Snapping<br/>8px Grid System]
            end
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Authentication"
            FBAuth[Firebase Auth<br/>User Management<br/>Email/Password + Google]
        end

        subgraph "Cloud Firestore"
            FSProjects[(Projects Collection<br/>Multi-project Support)]
            FSShapes[(Canvas Documents<br/>canvas/{projectId}<br/>Shapes + Metadata<br/>Persistent Storage)]
        end

        subgraph "Realtime Database"
            RTDBSession[(Session Path<br/>/sessions/{projectId}/{userId}<br/>Cursor + Presence + Positions<br/>High-frequency updates)]
        end

        subgraph "Firebase Hosting"
            Hosting[Static File Hosting<br/>Deployed React App]
        end
    end

    subgraph "AI Agent Backend"
        subgraph "AWS Lambda / Express Server"
            AIServer[AI Agent Server<br/>LangChain + ReAct]
            OpenAISvc[OpenAI Integration<br/>GPT-4 Function Calling]
            LangSmith[LangSmith Monitoring<br/>AI Agent Debugging]
        end
    end

    subgraph "Testing Infrastructure"
        subgraph "Test Suite"
            UnitTests[Unit Tests<br/>Vitest + Testing Library]
            IntegrationTests[Integration Tests<br/>Multi-user scenarios]
            PerformanceTests[Performance Tests<br/>500+ objects, 10+ users]
        end

        subgraph "Firebase Emulators"
            AuthEmu[Auth Emulator]
            FirestoreEmu[Firestore Emulator]
            RTDBEmu[RTDB Emulator]
        end
    end

    %% Component to Context connections
    Auth --> AuthCtx
    Canvas --> CanvasCtx
    Collab --> CanvasCtx
    Layout --> AuthCtx
    AI --> CanvasCtx

    %% Context to Store connections
    CanvasCtx --> CanvasStore

    %% Context to Hooks connections
    AuthCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useCursors
    CanvasCtx --> usePresence
    AI --> useAI

    %% Hooks to Services connections
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useCursors --> CursorSvc
    usePresence --> PresenceSvc
    useAI --> AISvc

    %% Services to Firebase Init
    AuthSvc --> FirebaseInit
    CanvasSvc --> FirebaseInit
    CursorSvc --> FirebaseInit
    PresenceSvc --> FirebaseInit
    AISvc --> FirebaseInit
    RealtimeSvc --> FirebaseInit

    %% Firebase connections
    FirebaseInit --> FBAuth
    FirebaseInit --> FSProjects
    FirebaseInit --> FSShapes
    FirebaseInit --> RTDBSession

    %% AI Agent connections
    AISvc -->|HTTP Requests| AIServer
    AIServer --> OpenAISvc
    AIServer --> LangSmith

    %% Rendering
    Canvas --> Konva

    %% Utilities
    Helpers -.-> Collab
    Constants -.-> Canvas
    GridSnap -.-> Canvas

    %% Real-time sync paths
    CanvasSvc -->|Create/Update/Delete<br/>Lock/Unlock<br/>under 100ms| FSShapes
    FSShapes -->|Real-time listener<br/>onSnapshot| CanvasSvc

    RealtimeSvc -->|Position updates<br/>under 50ms at 60 FPS| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| RealtimeSvc

    CursorSvc -->|Cursor positions<br/>under 50ms at 20-30 FPS| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| CursorSvc

    PresenceSvc -->|Online status<br/>onDisconnect| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| PresenceSvc

    %% Auth flow
    AuthSvc -->|signup/login| FBAuth
    FBAuth -->|User token<br/>Session state| AuthSvc

    %% Project management
    CanvasSvc -->|Project operations| FSProjects
    FSProjects -->|Project data| CanvasSvc

    %% Deployment
    UI -.->|Build & Deploy<br/>npm run build| Hosting

    %% Testing connections
    UnitTests -.->|Test| AuthSvc
    UnitTests -.->|Test| CanvasSvc
    UnitTests -.->|Test| AISvc
    UnitTests -.->|Test| Helpers

    IntegrationTests -.->|Test via| AuthEmu
    IntegrationTests -.->|Test via| FirestoreEmu
    IntegrationTests -.->|Test via| RTDBEmu

    PerformanceTests -.->|Load Test| CanvasSvc
    PerformanceTests -.->|Load Test| RealtimeSvc

    %% User interactions
    User([Users<br/>Multiple Browsers]) -->|Interact| UI
    User -->|Access deployed app| Hosting

    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef firebase fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef ai fill:#f0f4ff,stroke:#4f46e5,stroke-width:2px
    classDef testing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef rendering fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px

    class Auth,Canvas,Collab,Layout,AI,AuthCtx,CanvasCtx,CanvasStore,useAuth,useCanvas,useCursors,usePresence,useAI,AuthSvc,CanvasSvc,CursorSvc,PresenceSvc,AISvc,RealtimeSvc,FirebaseInit,Helpers,Constants,GridSnap client
    class FBAuth,FSProjects,FSShapes,RTDBSession,Hosting firebase
    class AIServer,OpenAISvc,LangSmith ai
    class UnitTests,IntegrationTests,PerformanceTests,AuthEmu,FirestoreEmu,RTDBEmu testing
    class Konva rendering
    class User user
