# OpenCode Project Analysis

## Overview

**OpenCode** is an open-source AI coding agent developed by SST (Serverless Stack). It provides AI-powered coding assistance through multiple interfaces: Terminal (TUI), Desktop application, VS Code extension, and Web interface.

**Repository**: `github.com/sst/opencode` (active development moved from `github.com/opencode-ai/opencode`)

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Bun (JavaScript/TypeScript) |
| **Package Manager** | Bun workspaces |
| **Build Orchestration** | Turbo |
| **UI Framework** | SolidJS |
| **Server Framework** | Hono |
| **Desktop** | Tauri (Rust + WebView) |
| **API Spec** | OpenAPI 3.1.1 |
| **SDK Generation** | @hey-api/openapi-ts |
| **Styling** | Tailwind CSS |
| **Storage** | File-based JSON with lock files |

---

## Project Structure

```
../opencode/
├── packages/              # Main monorepo packages
│   ├── opencode/         # Core CLI and server (main package)
│   ├── app/              # Shared UI components (SolidJS)
│   ├── desktop/          # Tauri-based desktop app
│   ├── web/              # Web interface
│   ├── ui/               # UI component library
│   ├── sdk/              # JavaScript/TypeScript SDK
│   ├── plugin/           # Plugin framework
│   ├── console/          # Console services (Cloudflare Workers)
│   ├── function/         # Serverless function utilities
│   ├── slack/            # Slack integration
│   ├── enterprise/       # Enterprise features
│   ├── identity/         # Identity management
│   ├── extensions/       # Extension system
│   ├── script/           # Build and release scripts
│   ├── util/             # Shared utilities
│   └── docs/             # Documentation
├── sdks/                  # SDK packages
│   └── vscode/           # VS Code extension
├── github/               # GitHub integration scripts
├── infra/                # Infrastructure configuration
├── themes/               # UI themes
├── specs/                # API specifications
├── patches/              # Package patches
├── script/               # Utility scripts
├── nix/                  # Nix packaging
├── .opencode/            # OpenCode configuration
├── package.json          # Root monorepo config
├── turbo.json            # Turbo build configuration
├── sst.config.ts         # SST deployment config
└── bunfig.toml          # Bun configuration
```

---

## Client-Server Architecture

### Architecture Overview

OpenCode uses a **client-server architecture** where:

- **Server**: The `opencode` CLI runs as an HTTP server (via `opencode serve` or `opencode web`)
- **Clients**: TUI, Desktop app, VS Code extension, Web browser, or custom SDK clients
- **Communication**: HTTP REST API + Server-Sent Events (SSE) for real-time updates

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│    TUI      │   Desktop   │  VS Code    │   Web Browser    │
│  (Terminal) │   (Tauri)   │ (Extension) │   (HTTP)         │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬─────────┘
       │             │             │               │
       └─────────────┴─────────────┴───────────────┘
                         │
                    HTTP API + SSE
                         │
       ┌─────────────────┴─────────────────┐
       │           OPENCODE SERVER          │
       │  (Hono HTTP Server + Event Bus)    │
       └─────────────────┬─────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Session   │  │    Tool     │  │   Config    │
│  Management │  │   System    │  │   System    │
└─────────────┘  └─────────────┘  └─────────────┘
       │                 │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  AI Provider│  │     LSP     │  │    MCP      │
│ Integration │  │  Integration│  │   Servers   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Communication Patterns

### 1. HTTP REST API

**Server Framework**: Hono with `hono-openapi` for type-safe routing

**Key Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/global/health` | GET | Health check |
| `/global/event` | GET | SSE stream for global events |
| `/session` | POST | Create new session |
| `/session/:id/prompt` | POST | Send prompt to AI |
| `/session/:id/event` | GET | SSE stream for session events |
| `/config` | GET/PUT | Configuration management |
| `/question` | GET/POST | Question/answer system |
| `/permission` | GET/POST | Permission requests |
| `/experimental/tool` | GET | List available tools |
| `/pty/:id/connect` | WS | WebSocket PTY connections |

### 2. Server-Sent Events (SSE)

Real-time event streaming using SSE protocol:

```
event: session.updated
data: {"type":"session.updated","properties":{"info":{...}}}

event: message.part.updated
data: {"type":"message.part.updated","properties":{"part":{...},"delta":"streaming text"}}
```

**Event Types**:
- `session.created/updated/deleted/status` - Session lifecycle
- `message.updated/removed` - Message changes
- `message.part.updated` - Streaming text (with delta field)
- `permission.updated/replied` - Permission requests
- `project.updated` - Project metadata changes
- `lsp.updated` - LSP server status

### 3. Event Bus Architecture

**Two-tier Event System**:

1. **Local Bus** (`Bus`) - Events scoped to a project directory instance
2. **Global Bus** (`GlobalBus`) - Events broadcast across all instances

**Event Definition Pattern**:
```typescript
// Strongly-typed events using Zod
const SessionCreated = BusEvent.define("session.created", SessionSchema)
Bus.publish(SessionCreated, { info: session })
```

### 4. Client State Synchronization

**Pattern**: Backend publishes events → SSE streams to clients → Clients update reactive stores

**Example Flow**:
1. Backend: `Bus.publish(MessageV2.Event.PartUpdated, { part, delta })`
2. Transport: SSE streams to all connected clients
3. GlobalSync: Receives event, appends delta to part store
4. UI: SolidJS signals trigger component re-render

### 5. Multi-Client Support

Multiple clients can connect to the same server:
- Desktop app, TUI, VS Code extension, and web clients all receive the same event stream
- Directory-scoped events via `?directory=` query parameter
- Each client maintains synchronized state through the event bus

---

## Key Architectural Components

### 1. Instance-Based State Isolation

The `Instance` namespace provides per-directory state isolation:

```typescript
// Execute code within a project context
Instance.provide(directory, async () => {
  // All operations are scoped to this project
  const config = await Config.get()
  const sessions = await Session.list()
})
```

**Per-Instance State**:
- Configuration (merged global + project-specific)
- Session storage
- LSP server processes
- Tool registry
- Event bus

### 2. Session Management

**Session Architecture**:
- Sessions contain messages
- Messages contain parts (text, tool calls, files, etc.)
- Hierarchical: Sessions can have parent/child relationships
- Storage: File-based JSON in `~/.opencode/project/{projectID}/`

**Agentic Loop Execution**:
1. Load conversation history
2. Resolve provider and model
3. Build system prompt
4. Apply provider-specific transformations
5. Stream AI response with tools
6. Execute tool calls
7. Continue loop if more tool calls needed

### 3. Tool System

**Tool Execution Flow**:
1. **Permission Check** - Evaluate permission rules (session → agent → global)
2. **Permission Request** - Emit event if user approval needed
3. **Before Hook** - Plugins can intercept
4. **Execution** - Tool runs with `Tool.Context` (progress updates, file attachments)
5. **After Hook** - Plugins can modify result
6. **Result Storage** - Update `ToolPart.state`

**Built-in Tools**:
- `glob` - Find files by pattern
- `grep` - Search file contents
- `ls` - List directory contents
- `view` - View file contents
- `write` - Write files
- `edit` - Edit files
- `bash` - Execute shell commands
- `fetch` - Fetch URLs
- `diagnostics` - LSP diagnostics
- `agent` - Run sub-tasks

### 4. AI Provider Integration

**Supported Providers** (75+):
- OpenAI (GPT-4, o1, o3, etc.)
- Anthropic (Claude 3.5/3.7/4)
- Google (Gemini 2.0/2.5)
- GitHub Copilot
- AWS Bedrock
- Groq
- Azure OpenAI
- OpenRouter
- Local/self-hosted models

**Provider Transformation Pipeline**:
1. Message normalization (remove empty content, normalize tool IDs)
2. Prompt caching (Anthropic, OpenRouter, Bedrock)
3. Filter unsupported modalities
4. Apply provider-specific options (reasoning effort, thinking budget)

### 5. Configuration System

**Multi-Layer Configuration** (merged in order):
1. Global config: `~/.opencode/config.json`
2. Custom config: `OPENCODE_CONFIG` file
3. Project configs: Walk up from cwd to worktree root
4. Inline content: `OPENCODE_CONFIG_CONTENT` JSON
5. Remote configs: Well-known endpoints
6. Dynamic files: `agent/*.md`, `command/*.md`, `plugin/*.ts`
7. Permission flags: `OPENCODE_PERMISSION`

### 6. MCP (Model Context Protocol)

**Integration**:
- Connect to external MCP servers via stdio or SSE
- Discover and use external tools
- Configured in `mcpServers` section of config

---

## Package Relationships

### Dependency Hierarchy

```
┌─────────────────────────────────────────┐
│         @opencode-ai/sdk                │  (Foundational - zero deps)
│    (Type-safe API client, types)        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│       @opencode-ai/plugin               │  (SDK + zod)
│    (Plugin framework, tool API)         │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│          opencode (CLI)                 │  (Core - all features)
│  (Server, session, tools, providers)    │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┬───────────────────┐
    │                 │                   │
┌───▼────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  app   │     │   desktop   │     │     web     │
│(Shared │     │  (Tauri +   │     │   (Astro)   │
│  UI)   │     │    app)     │     │             │
└────────┘     └─────────────┘     └─────────────┘
```

### Console Services (Isolated)

```
packages/console/
├── app/      (SolidStart + Vite → Cloudflare Workers)
├── core/     (Core logic)
├── function/ (Serverless functions)
├── mail/     (Email services)
└── resource/ (Infrastructure)
```

---

## Build System

### Package Build Matrix

| Package | Build Tool | Output | Target |
|---------|-----------|--------|--------|
| `opencode` | Bun.build | Compiled binary | Native (multi-platform) |
| `sdk` | TypeScript + OpenAPI gen | `.d.ts` + `.js` | Node/Bun |
| `plugin` | TypeScript | `.d.ts` + `.js` | Node/Bun |
| `app` | Vite | Browser bundle | Browser |
| `desktop` | Vite + Tauri | Native app | Desktop (Rust + WebView) |
| `web` | Astro | Static HTML | Browser |
| `console/app` | SolidStart + Vite | SSR bundle | Cloudflare Workers |

### Version Management

- Centralized in `packages/script/src/index.ts`
- All packages share the same version
- Channels: `latest`, `preview`, `dev`, `snapshot`
- Bump types: `major`, `minor`, `patch`

---

## Key Entry Points

| Package | Entry Point | Purpose |
|---------|-------------|---------|
| `opencode` | `src/cli/index.ts` | CLI entry |
| `opencode` | `src/server/server.ts` | HTTP server |
| `app` | `src/index.tsx` | Shared UI components |
| `desktop` | `src/index.tsx` | Desktop app frontend |
| `sdk` | `src/v2/gen/sdk.gen.ts` | Generated SDK client |

---

## Summary

OpenCode's architecture enables a consistent AI coding experience across multiple interfaces while maintaining:

1. **Separation of Concerns**: Clear boundaries between server, clients, and shared components
2. **Type Safety**: SDK contract generated from OpenAPI spec
3. **Extensibility**: Plugin system and MCP integration
4. **Real-time Synchronization**: SSE-based event bus for multi-client state sync
5. **Instance Isolation**: Per-directory state management for multi-project support
