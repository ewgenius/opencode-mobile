# OpenCode SDK Guide

## Overview

The **OpenCode SDK** (`@opencode-ai/sdk`) is a type-safe JavaScript/TypeScript client for interacting with the OpenCode server programmatically. It provides a complete API to build custom integrations, automate workflows, and control OpenCode from your applications.

---

## Installation

```bash
npm install @opencode-ai/sdk
# or
yarn add @opencode-ai/sdk
# or
pnpm add @opencode-ai/sdk
```

---

## Usage Modes

### Mode 1: Full Instance (Server + Client)

Creates both a server and client. The server runs the OpenCode HTTP API.

```typescript
import { createOpencode } from "@opencode-ai/sdk"

const { client, server } = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  timeout: 5000,
  config: {
    model: "anthropic/claude-3-5-sonnet-20241022",
  }
})

console.log(`Server running at ${server.url}`)

// Use the client
const health = await client.global.health()

// Clean up when done
server.close()
```

**Server Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hostname` | `string` | `127.0.0.1` | Server hostname |
| `port` | `number` | `4096` | Server port |
| `signal` | `AbortSignal` | `undefined` | Abort signal for cancellation |
| `timeout` | `number` | `5000` | Timeout for server start (ms) |
| `config` | `Config` | `{}` | Configuration object |

### Mode 2: Client-Only (Connect to Existing Server)

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  fetch: customFetch,
  parseAs: "auto",
  responseStyle: "fields",
  throwOnError: false,
})
```

**Client Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `http://localhost:4096` | URL of the server |
| `fetch` | `function` | `globalThis.fetch` | Custom fetch implementation |
| `parseAs` | `string` | `auto` | Response parsing method |
| `responseStyle` | `string` | `fields` | Return style (`data` or `fields`) |
| `throwOnError` | `boolean` | `false` | Throw errors instead of returning |

---

## Core API Examples

### Health Check

```typescript
const health = await client.global.health()
console.log(health.data.version)
console.log(health.data.healthy)
```

### Session Management

```typescript
import type { Session } from "@opencode-ai/sdk"

// List sessions
const sessions = await client.session.list()

// Create session
const session = await client.session.create({
  body: {
    title: "My Session",
    parentID: "optional-parent-id"
  }
})

// Get session
const details = await client.session.get({
  path: { id: session.id }
})

// Update session
await client.session.update({
  path: { id: session.id },
  body: { title: "Updated Title" }
})

// Delete session
await client.session.delete({ path: { id: session.id } })

// Abort running session
await client.session.abort({ path: { id: session.id } })
```

### Sending Prompts

```typescript
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    model: {
      providerID: "anthropic",
      modelID: "claude-3-5-sonnet-20241022"
    },
    parts: [
      { type: "text", text: "Explain closures in JavaScript" }
    ],
    agent: "default",
    system: "You are a helpful coding assistant.",
    tools: { read: true, grep: true, glob: true }
  }
})

console.log(result.info)
console.log(result.parts)

// Inject context without AI response (for plugins)
await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "Context here" }]
  }
})
```

### File Operations

```typescript
// Search text in files
const results = await client.find.text({
  query: {
    pattern: "function.*opencode",
    path: "src/",
    limit: 50
  }
})

// Find files by name
const files = await client.find.files({
  query: {
    query: "*.ts",
    type: "file",
    directory: "src/",
    limit: 20
  }
})

// Find workspace symbols
const symbols = await client.find.symbols({
  query: { query: "MyClass" }
})

// Read file content
const file = await client.file.read({
  query: { path: "src/index.ts" }
})
console.log(file.content)
```

### TUI Control

```typescript
// Append to prompt
await client.tui.appendPrompt({
  body: { text: "Add this to prompt" }
})

// Show toast
await client.tui.showToast({
  body: {
    message: "Task completed!",
    variant: "success",
    title: "Success",
    duration: 3000
  }
})

// Open dialogs
await client.tui.openHelp()
await client.tui.openSessions()
await client.tui.openThemes()
await client.tui.openModels()

// Execute command
await client.tui.executeCommand({
  body: { command: "/help" }
})
```

### Real-time Events (SSE)

```typescript
const events = await client.event.subscribe()

for await (const event of events.stream) {
  console.log("Event type:", event.type)
  console.log("Properties:", event.properties)
  
  switch (event.type) {
    case "message.updated":
      console.log("Message updated:", event.properties.info)
      break
    case "server.instance.disposed":
      console.log("Server disposed:", event.properties.directory)
      break
  }
}

// Cancel stream
events.controller.abort()
```

### Configuration

```typescript
// Get config
const config = await client.config.get()

// Update config
await client.config.patch({
  body: {
    model: "anthropic/claude-3-5-sonnet",
  }
})

// List providers
const { providers, default: defaults } = await client.app.providers()
```

### Authentication

```typescript
// Set provider auth
await client.auth.set({
  path: { id: "anthropic" },
  body: {
    type: "api",
    key: "your-api-key"
  }
})

// OAuth flow
const authUrl = await client.provider.oauthAuthorize({
  path: { id: "github" }
})
// Handle callback
await client.provider.oauthCallback({
  path: { id: "github" },
  body: { code: "oauth-code" }
})
```

---

## Error Handling

```typescript
import { 
  APIError, 
  BadRequestError, 
  AuthenticationError, 
  NotFoundError,
  RateLimitError,
  InternalServerError 
} from "@opencode-ai/sdk"

try {
  await client.session.get({ path: { id: "invalid-id" } })
} catch (error) {
  if (error instanceof BadRequestError) {
    console.error("Bad request:", error.message)
  } else if (error instanceof AuthenticationError) {
    console.error("Auth failed:", error.message)
  } else if (error instanceof NotFoundError) {
    console.error("Not found:", error.message)
  } else if (error instanceof RateLimitError) {
    console.error("Rate limited:", error.message)
  } else if (error instanceof InternalServerError) {
    console.error("Server error:", error.message)
  } else if (error instanceof APIError) {
    console.error("API error:", error.status, error.message)
  }
}
```

**Error Types by HTTP Status:**

| Status | Error Type |
|--------|------------|
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 422 | `UnprocessableEntityError` |
| 429 | `RateLimitError` |
| >=500 | `InternalServerError` |

---

## Key Types

```typescript
import type { 
  Session, 
  Message, 
  Part, 
  UserMessage, 
  AssistantMessage,
  TextPart,
  ToolPart,
  Config,
  Project,
  Provider
} from "@opencode-ai/sdk"

// Session
type Session = {
  id: string
  title?: string
  parentID?: string
  path: { cwd: string; root: string }
  time: { created: number; updated?: number }
}

// Message types
type Message = UserMessage | AssistantMessage

type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: { created: number; completed?: number }
  modelID: string
  providerID: string
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
  cost: number
}

// Part types
type Part = TextPart | FilePart | ToolPart | ReasoningPart

type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
}
```

---

## Server Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_SERVER_PASSWORD` | HTTP basic auth password |
| `OPENCODE_SERVER_USERNAME` | HTTP basic auth username (default: "opencode") |
| `OPENCODE_CONFIG_CONTENT` | JSON string of config |
| `OPENCODE_LOG` | Log level for SDK |

### Starting Server via CLI

```bash
opencode serve --port 4096 --hostname 127.0.0.1

# With auth
export OPENCODE_SERVER_PASSWORD=your-password
opencode serve

# With CORS
opencode serve --cors http://localhost:5173
```

### Advanced Client Options

```typescript
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  maxRetries: 2,
  timeout: 30 * 1000,
  fetch: customFetch,
  fetchOptions: {
    // Bun proxy
    proxy: 'http://localhost:8888',
  },
  logLevel: 'debug',
  logger: customLogger,
  parseAs: 'auto',
  responseStyle: 'fields',
  throwOnError: false,
})
```

---

## Complete Example

```typescript
import { createOpencode } from "@opencode-ai/sdk"

async function main() {
  const { client, server } = await createOpencode({
    port: 4096,
    config: {
      model: "anthropic/claude-3-5-sonnet"
    }
  })
  
  try {
    // Check health
    const health = await client.global.health()
    console.log(`Connected to OpenCode v${health.data.version}`)
    
    // Create session
    const session = await client.session.create({
      body: { title: "SDK Demo" }
    })
    
    // Send prompt
    const result = await client.session.prompt({
      path: { id: session.id },
      body: {
        model: {
          providerID: "anthropic",
          modelID: "claude-3-5-sonnet-20241022"
        },
        parts: [{ 
          type: "text", 
          text: "Write a hello world in TypeScript" 
        }]
      }
    })
    
    // Print response
    for (const part of result.parts) {
      if (part.type === "text") {
        console.log(part.text)
      }
    }
    
    // Cleanup
    await client.session.delete({ path: { id: session.id } })
    
  } catch (error) {
    console.error("Error:", (error as Error).message)
  } finally {
    server?.close()
  }
}

main()
```

---

## SDK Structure

```
packages/sdk/
├── src/
│   ├── index.ts            # Main entry
│   ├── client.ts           # Client creation
│   ├── server.ts           # Server management
│   ├── gen/                # Generated files
│   │   ├── sdk.gen.ts      # SDK methods
│   │   ├── types.gen.ts    # TypeScript types
│   │   └── client.gen.ts   # HTTP client
│   └── v2/                 # V2 API
├── example/                # Usage examples
└── package.json
```

The SDK is auto-generated from the OpenAPI 3.1 specification using Stainless, ensuring type safety and API consistency.
