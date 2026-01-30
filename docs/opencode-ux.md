# OpenCode UI/UX Architecture Analysis

Comprehensive analysis of the OpenCode UI/UX patterns, session management, streaming connections, and message architecture from the `packages/ui` and `packages/app` directories.

---

## Table of Contents

1. [Sessions UI/UX](#1-sessions-uiux)
2. [Streaming Connections (SSE)](#2-streaming-connections-sse)
3. [Messages Architecture](#3-messages-architecture)
4. [Key Architectural Patterns](#4-key-architectural-patterns)
5. [Component Registry System](#5-component-registry-system)
6. [State Management Deep Dive](#6-state-management-deep-dive)

---

## 1. Sessions UI/UX

### Session Organization

**Hierarchical Data Structure:**

```
Session
├── Messages (by sessionID)
│   └── Parts (by messageID)
├── Status (session state)
└── Metadata (title, timestamps, etc.)
```

**Session List Display** (`app/src/pages/home.tsx`):

- Shows recent projects with worktree paths
- Relative timestamps using Luxon
- Sorted by `time.updated` or `time.created`
- Limited to 5 most recent projects

```tsx
<For
  each={sync.data.project
    .toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
    .slice(0, 5)}
>
  {project => (
    <Button onClick={() => openProject(project.worktree)}>
      {project.worktree.replace(homedir(), '~')}
      <div>{DateTime.fromMillis(project.time.updated ?? project.time.created).toRelative()}</div>
    </Button>
  )}
</For>
```

### Session Detail Layout

**Main Session Page** (`app/src/pages/session.tsx` - 1,600+ lines):

Complex responsive layout with:

- **Header**: Search, share, review toggle, terminal toggle
- **Left Panel**: Chat/session view with message list
- **Right Panel**: Review panel with file diffs (collapsible)
- **Bottom Panel**: Terminal (collapsible)
- **Mobile**: Tab switching between panels

```tsx
// Session layout structure
<div class={layoutStyles.container}>
  <SessionHeader
    title={session.title}
    onSearch={handleSearch}
    onShare={handleShare}
    onToggleReview={() => setShowReview(!showReview)}
    onToggleTerminal={() => setShowTerminal(!showTerminal)}
  />

  <div class={layoutStyles.content}>
    <div class={layoutStyles.chat}>
      <SessionTurns sessionID={session.id} />
      <PromptInput sessionID={session.id} />
    </div>

    <Show when={showReview()}>
      <SessionReview sessionID={session.id} />
    </Show>

    <Show when={showTerminal()}>
      <Terminal sessionID={session.id} />
    </Show>
  </div>
</div>
```

### Key Session Components

| Component           | Path                                   | Purpose                       |
| ------------------- | -------------------------------------- | ----------------------------- |
| `SessionHeader`     | `session-header.tsx`                   | Title bar with controls       |
| `SessionTurn`       | `ui/src/components/session-turn.tsx`   | User + assistant message pair |
| `SessionReview`     | `ui/src/components/session-review.tsx` | File diff review panel        |
| `NewSessionView`    | `session-new-view.tsx`                 | Empty state for new sessions  |
| `SessionContextTab` | `session-context-tab.tsx`              | Debug/context info            |

### Session Creation Flow

**New Session Options** (`session-new-view.tsx`):

- "main" worktree (default)
- Existing sandboxes
- Create new sandbox

```tsx
interface NewSessionViewProps {
  worktree: string;
  onWorktreeChange: (value: string) => void;
}

const options = createMemo(() => [MAIN_WORKTREE, ...sandboxes(), CREATE_WORKTREE]);
```

### Session State Storage

**Data Structure in Global Sync:**

```tsx
{
  session: Session[]                    // All sessions
  message: Record<sessionID, Message[]> // Messages by session
  part: Record<messageID, Part[]>       // Parts by message
  session_status: Record<sessionID, Status>
}
```

---

## 2. Streaming Connections (SSE)

### SSE Architecture Overview

**Global Event Stream** (`app/src/context/global-sdk.tsx`):

```tsx
const eventSdk = createOpencodeClient({
  baseUrl: server.url,
  signal: abort.signal,
  fetch: platform.fetch,
});

void (async () => {
  const events = await eventSdk.global.event();
  for await (const event of events.stream) {
    const directory = event.directory ?? 'global';
    const payload = event.payload;
    const k = key(directory, payload);

    // Coalesce duplicate events
    if (k) {
      const i = coalesced.get(k);
      if (i !== undefined) queue[i] = undefined;
      coalesced.set(k, queue.length);
    }

    queue.push({ directory, payload });
    schedule(); // Batch process with 16ms debounce
  }
})();
```

### Event Coalescing Strategy

**Smart Deduplication** to prevent UI thrashing:

```tsx
const key = (directory: string, payload: Event) => {
  // Coalesce rapid session status updates
  if (payload.type === 'session.status')
    return `session.status:${directory}:${payload.properties.sessionID}`;

  // Coalesce LSP updates
  if (payload.type === 'lsp.updated') return `lsp.updated:${directory}`;

  // Coalesce streaming text updates per part
  if (payload.type === 'message.part.updated') {
    const part = payload.properties.part;
    return `message.part.updated:${directory}:${part.messageID}:${part.id}`;
  }
};
```

**Batch Processing:**

```tsx
let scheduled = false;
let queue: Event[] = [];

const schedule = () => {
  if (scheduled) return;
  scheduled = true;

  setTimeout(() => {
    scheduled = false;
    const batch = queue.filter(Boolean); // Remove undefined (coalesced)
    queue = [];
    coalesced.clear();

    // Distribute to workspace handlers
    batch.forEach(({ directory, payload }) => {
      globalSync.event.listen(directory, payload);
    });
  }, 16); // 16ms = ~60fps
};
```

### Event Distribution Flow

```
SSE Stream (global-sdk.tsx)
    ↓
Event Coalescing (deduplication)
    ↓
Batch Processing (16ms debounce)
    ↓
globalSync.event.listen(directory, payload)
    ↓
Workspace-specific handlers
    ↓
SolidJS Store updates
    ↓
UI re-renders
```

### Connection State Management

**No explicit reconnection logic** - relies on:

1. Browser's native SSE reconnection
2. SDK-level retry mechanisms
3. Global health checks on bootstrap

```tsx
// Health check on app startup
async function bootstrap() {
  const health = await globalSDK.client.global.health();
  if (!health?.healthy) {
    setGlobalStore('error', new Error('Connection failed'));
    return;
  }
  // Proceed with app initialization
}
```

### Event Types Handled

| Event Type              | Purpose                      | Coalesced? |
| ----------------------- | ---------------------------- | ---------- |
| `session.created`       | New session                  | No         |
| `session.updated`       | Session metadata change      | No         |
| `session.status`        | Session state (idle/working) | Yes        |
| `session.deleted`       | Session removal              | No         |
| `message.updated`       | New message                  | No         |
| `message.part.updated`  | Streaming content            | Yes        |
| `message.part.finished` | Streaming complete           | No         |
| `permission.asked`      | User permission needed       | No         |
| `project.updated`       | Project metadata             | No         |
| `lsp.updated`           | LSP server status            | Yes        |

---

## 3. Messages Architecture

### Message Data Model

**Message Structure:**

```tsx
interface Message {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  time: {
    created: number;
    completed?: number;
  };
  agent?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
  cost?: number;
  error?: ErrorInfo;
}
```

**Part Types:**

```tsx
type Part =
  | TextPart // Plain text content
  | FilePart // File references
  | ToolPart // Tool execution
  | ReasoningPart // AI reasoning/thinking
  | AgentPart // Sub-agent delegation
  | StepStartPart // Tool execution start
  | StepFinishPart // Tool execution end
  | SnapshotPart; // Code snapshot
```

### Message Rendering Components

**SessionTurn Component** (`ui/src/components/session-turn.tsx`):

Renders a complete "turn" (user message + assistant response):

```tsx
export function SessionTurn(props: {
  sessionID: string;
  messageID: string;
  stepsExpanded?: boolean;
  onStepsExpandedToggle?: () => void;
}) {
  // Fetch data from global sync
  const message = createMemo(() =>
    globalSync.data.message[props.sessionID]?.find(m => m.id === props.messageID)
  );

  const assistantMessages = createMemo(() =>
    globalSync.data.message[props.sessionID]?.filter(
      m => m.role === 'assistant' && m.parentID === props.messageID
    )
  );

  const parts = createMemo(() => globalSync.data.part[props.messageID] ?? []);

  // Compute streaming status
  const working = createMemo(() => {
    const status = globalSync.data.session_status[props.sessionID];
    return status?.type !== 'idle' && isLastUserMessage();
  });

  return (
    <div class={styles.turn} data-message-id={props.messageID}>
      {/* User message */}
      <div class={styles.user}>
        <For each={parts()}>{part => <MessagePart part={part} message={message()} />}</For>
      </div>

      {/* Assistant responses */}
      <For each={assistantMessages()}>{msg => <AssistantMessage message={msg} />}</For>

      {/* Loading indicator */}
      <Show when={working()}>
        <StreamingIndicator />
      </Show>
    </div>
  );
}
```

**MessagePart Component** (`ui/src/components/message-part.tsx`):

Dynamic part rendering via registry pattern:

```tsx
// Registry of part renderers
export const PART_MAPPING: Record<string, PartComponent | undefined> = {
  text: TextPart,
  file: FilePart,
  tool: ToolPart,
  reasoning: ReasoningPart,
  agent: AgentPart,
  // ...
};

export function MessagePart(props: MessagePartProps) {
  const component = createMemo(() => PART_MAPPING[props.part.type]);

  return (
    <Show when={component()}>
      <Dynamic component={component()} part={props.part} message={props.message} />
    </Show>
  );
}
```

### Streaming Text Handling

**Throttled Rendering** for performance:

```tsx
const TEXT_RENDER_THROTTLE_MS = 50; // Max 20 updates/second

function createThrottledValue(getValue: () => string) {
  const [value, setValue] = createSignal(getValue());
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let last = 0;

  createEffect(() => {
    const next = getValue();
    const now = Date.now();
    const remaining = TEXT_RENDER_THROTTLE_MS - (now - last);

    if (remaining <= 0) {
      // Immediate update if throttle period passed
      last = now;
      setValue(next);
      return;
    }

    // Schedule delayed update
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      last = Date.now();
      setValue(next);
    }, remaining);
  });

  return value;
}

// Usage in TextPart component
export function TextPart(props: { part: TextPart }) {
  const text = createThrottledValue(() => props.part.text);

  return (
    <div class={styles.text}>
      <Markdown text={text()} />
    </div>
  );
}
```

### Optimistic Updates

**Immediate UI Feedback** before server confirmation:

```tsx
// From sync.tsx
addOptimisticMessage(input: {
  sessionID: string
  messageID: string
  parts: Part[]
  agent: string
  model: ModelRef
}) {
  const message: Message = {
    id: input.messageID,
    sessionID: input.sessionID,
    role: "user",
    time: { created: Date.now() },
    agent: input.agent,
    model: input.model
  }

  setStore(produce((draft) => {
    // Add message to session
    const messages = draft.message[input.sessionID]
    if (!messages) {
      draft.message[input.sessionID] = [message]
    } else {
      const result = Binary.search(messages, input.messageID, (m) => m.id)
      messages.splice(result.index, 0, message)
    }

    // Add parts
    draft.part[input.messageID] = input.parts
  }))
}
```

### Message Composition UI

**PromptInput Component** (`app/src/components/prompt-input.tsx`):

Rich text input with advanced features:

```tsx
export const PromptInput: Component<PromptInputProps> = props => {
  const [store, setStore] = createStore({
    popover: null as 'at' | 'slash' | null, // @-mentions or /-commands
    historyIndex: -1, // Command history navigation
    mode: 'normal' as 'normal' | 'shell', // Shell mode with ! prefix
  });

  // @-mention detection
  const atMatch = createMemo(() => {
    const text = getText();
    const cursor = getCursorPosition();
    return text.substring(0, cursor).match(/@(\S*)$/);
  });

  // /-command detection
  const slashMatch = createMemo(() => {
    const text = getText();
    return text.match(/^\/(\S*)$/);
  });

  // Submit handler with optimistic update
  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    const content = getContent(); // Parsed content with attachments
    const messageID = generateID();

    // Optimistic update
    addOptimisticMessage({
      sessionID: props.sessionID,
      messageID,
      parts: content.parts,
      agent: content.agent,
      model: content.model,
    });

    try {
      // Send to server
      await sdk.session.prompt({
        path: { id: props.sessionID },
        body: {
          model: content.model,
          parts: content.parts,
        },
      });
    } catch (error) {
      // Rollback on error
      removeOptimisticMessage(props.sessionID, messageID);
      showError(error);
    }

    clearInput();
  };

  return (
    <div class={styles.container}>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        class={styles.editor}
      />

      {/* @-mention popover */}
      <Show when={store.popover === 'at' && atMatch()}>
        <MentionPopover filter={atMatch()[1]} onSelect={insertMention} />
      </Show>

      {/* /-command popover */}
      <Show when={store.popover === 'slash' && slashMatch()}>
        <CommandPopover filter={slashMatch()[1]} onSelect={executeCommand} />
      </Show>
    </div>
  );
};
```

**Features:**

- Contenteditable for rich text
- @-mentions for files and agents
- /-commands for slash commands
- Image attachments (drag-drop, paste)
- Command history (up/down arrows)
- Shell mode (prefix with `!`)

---

## 4. Key Architectural Patterns

### State Management with SolidJS

**Hierarchical Store Structure:**

```tsx
// Global state split by directory/workspace
const children: Record<string, [Store<State>, SetStoreFunction<State>]> = {};

function ensureChild(directory: string) {
  if (!children[directory]) {
    children[directory] = createStore<State>({
      session: [],
      message: {},
      part: {},
      session_status: {},
      project: [],
      // ...
    });
  }
  return children[directory];
}
```

**Reconcile Pattern** for efficient array updates:

```tsx
// Use reconcile for efficient updates without re-rendering unchanged items
setStore('session', reconcile(sessions, { key: 'id' }));
setStore('part', messageID, reconcile(parts, { key: 'id' }));
```

**Produce Pattern** for immutable updates:

```tsx
setStore(
  produce(draft => {
    const messages = draft.message[sessionID];
    if (!messages) {
      draft.message[sessionID] = [newMessage];
    } else {
      messages.push(newMessage);
    }
  })
);
```

### Context/Provider Hierarchy

```
AppBaseProviders
├── MetaProvider, ThemeProvider, LanguageProvider
├── DialogProvider, MarkedProvider, DiffComponentProvider, CodeComponentProvider
└── ServerProvider
    └── GlobalSDKProvider
        └── GlobalSyncProvider
            └── Router
                ├── SettingsProvider
                ├── PermissionProvider
                ├── LayoutProvider
                ├── NotificationProvider
                └── CommandProvider
                    └── Layout
                        └── Route-specific providers
                            ├── TerminalProvider
                            ├── FileProvider
                            └── PromptProvider
```

### Event Handling Patterns

**Command Pattern** for keyboard shortcuts and actions:

```tsx
// From command.tsx
command.register(() => [
  {
    id: 'session.new',
    title: 'New session',
    category: 'Session',
    keybind: 'mod+shift+s',
    slash: 'new',
    onSelect: () => navigate(`/${params.dir}/session`),
  },
  {
    id: 'session.close',
    title: 'Close session',
    category: 'Session',
    keybind: 'mod+w',
    onSelect: () => closeCurrentSession(),
  },
  // ...
]);
```

**Auto-scroll Management**:

```tsx
// From create-auto-scroll.tsx
export function createAutoScroll(options: AutoScrollOptions) {
  const [store, setStore] = createStore({
    userScrolled: false, // Track if user manually scrolled
  });

  const handleWheel = (e: WheelEvent) => {
    if (e.deltaY >= 0) return; // Only track upward scrolls
    stop(); // User scrolled up, pause auto-scroll
  };

  const scrollToBottom = (force: boolean) => {
    if (!force && store.userScrolled) return;
    // Scroll to bottom
    scrollRef.scrollTop = scrollRef.scrollHeight;
  };

  return {
    scrollRef,
    contentRef,
    handleScroll,
    handleInteraction,
    forceScrollToBottom,
    userScrolled: () => store.userScrolled,
  };
}
```

### Virtual Scrolling with Turn Backfill

**Progressive Message Rendering** for performance:

```tsx
const TURN_INIT = 20; // Initial messages to render
const TURN_BATCH = 20; // Messages per batch
const [store, setStore] = createStore({ turnStart: 0 });

// Only render messages from turnStart to end
const renderedUserMessages = createMemo(() => {
  const msgs = visibleUserMessages();
  const start = store.turnStart;
  if (start <= 0) return msgs;
  return msgs.slice(start);
});

// Backfill older messages when idle
function scheduleTurnBackfill() {
  if (window.requestIdleCallback) {
    turnHandle = window.requestIdleCallback(() => {
      setStore('turnStart', prev => Math.max(0, prev - TURN_BATCH));
      if (store.turnStart > 0) {
        scheduleTurnBackfill(); // Schedule next batch
      }
    });
  }
}
```

### Scroll Spy for Active Message

**Track which message is in view**:

```tsx
const getActiveMessageId = (container: HTMLDivElement) => {
  const cutoff = container.scrollTop + 100;
  const nodes = container.querySelectorAll<HTMLElement>('[data-message-id]');
  let id: string | undefined;

  for (const node of nodes) {
    if (node.offsetTop > cutoff) break;
    id = node.dataset.messageId;
  }

  return id;
};
```

---

## 5. Component Registry System

### Tool Registry Pattern

**Pluggable Tool Components:**

```tsx
// Tool registry definition
export const ToolRegistry = {
  tools: new Map<string, ToolDefinition>(),

  register(def: ToolDefinition) {
    this.tools.set(def.name, def)
  },

  render(name: string, props: ToolProps) {
    const tool = this.tools.get(name)
    return tool?.render(props) ?? null
  }
}

// Register a tool
ToolRegistry.register({
  name: "bash",
  render(props) {
    return (
      <BasicTool
        icon="console"
        trigger={{ title: "Shell", subtitle: props.input.command }}
      >
        <Markdown text={`\`\`\`bash\n$ ${props.input.command}\n\`\`\``} />
      </BasicTool>
    )
  },
})

// Usage in UI
<ToolRegistry.render name={part.tool} props={part.input} />
```

### Registered Tools

| Tool          | Purpose            | Display                          |
| ------------- | ------------------ | -------------------------------- |
| `read`        | View file contents | Code block with syntax highlight |
| `list`        | List directory     | File tree                        |
| `glob`        | Find files         | File list                        |
| `grep`        | Search files       | Search results                   |
| `webfetch`    | Web scraping       | Preview card                     |
| `task`        | Sub-agent          | Task status                      |
| `bash`        | Shell commands     | Terminal output                  |
| `edit`        | File edits         | Diff view                        |
| `write`       | Create files       | File preview                     |
| `apply_patch` | Apply patches      | Diff view                        |
| `todowrite`   | Update todos       | Todo list                        |
| `todoread`    | Read todos         | Todo list                        |
| `question`    | Ask user           | Interactive prompt               |

### Dynamic Context Injection

```tsx
// From data.tsx - Context for pluggable components
export const { use: useData, provider: DataProvider } = createSimpleContext({
  init: (props: {
    data: Data;
    directory: string;
    onPermissionRespond?: PermissionRespondFn;
    onQuestionReply?: QuestionReplyFn;
  }) => ({
    store: props.data,
    directory: props.directory,
    respondToPermission: props.onPermissionRespond,
    replyToQuestion: props.onQuestionReply,
  }),
});
```

---

## 6. State Management Deep Dive

### Persisted State

**LocalStorage Persistence** (`app/src/context/persist.ts`):

```tsx
const [store, setStore, _, ready] = persisted(
  Persist.global('layout', ['layout.v6']),
  createStore({
    sidebar: { open: true, width: 250 },
    panels: { review: false, terminal: false },
    theme: 'system' as 'light' | 'dark' | 'system',
  })
);
```

### Workspace Isolation

**Per-Directory State:**

```tsx
// Each workspace has isolated state
const [workspaceStore, setWorkspaceStore] = ensureChild(directory);

// Updates only affect that workspace
setWorkspaceStore('session', reconcile(newSessions, { key: 'id' }));
```

### Binary Search for Efficient Lookups

```tsx
// Fast message lookup by ID
const result = Binary.search(messages, messageID, m => m.id);
if (result.found) {
  return messages[result.index];
}
// Insert at correct position to maintain sort
messages.splice(result.index, 0, newMessage);
```

### Reactive Computations

```tsx
// Computed values that auto-update
const sessionCount = createMemo(() => globalSync.data.session.length);

const hasMessages = createMemo(() => Object.keys(globalSync.data.message).length > 0);

const isStreaming = createMemo(() => {
  const status = globalSync.data.session_status[sessionID];
  return status?.type === 'working';
});
```

---

## Summary of Key Files

| Category               | File Path                                         | Description         |
| ---------------------- | ------------------------------------------------- | ------------------- |
| **Entry Points**       | `app/src/entry.tsx`                               | Web app entry       |
|                        | `app/src/app.tsx`                                 | Root providers      |
| **Pages**              | `app/src/pages/home.tsx`                          | Project list        |
|                        | `app/src/pages/session.tsx`                       | Main chat interface |
| **Session Components** | `app/src/components/session/session-header.tsx`   | Header UI           |
|                        | `app/src/components/session/session-new-view.tsx` | New session         |
|                        | `ui/src/components/session-turn.tsx`              | Message turn        |
|                        | `ui/src/components/session-review.tsx`            | Diff review         |
| **Message Components** | `ui/src/components/message-part.tsx`              | Part rendering      |
|                        | `ui/src/components/message-text.tsx`              | Text content        |
| **State Management**   | `app/src/context/global-sync.tsx`                 | Global state        |
|                        | `app/src/context/sync.tsx`                        | Workspace state     |
|                        | `app/src/context/layout.tsx`                      | UI layout           |
| **Streaming**          | `app/src/context/global-sdk.tsx`                  | SSE connection      |
| **Input**              | `app/src/components/prompt-input.tsx`             | Rich input          |
| **Hooks**              | `ui/src/hooks/create-auto-scroll.tsx`             | Auto-scroll         |

---

## Key Takeaways for Mobile Implementation

1. **Event Coalescing**: Implement smart deduplication for streaming events to prevent UI thrashing
2. **Optimistic Updates**: Show messages immediately while sending to server
3. **Throttled Rendering**: Limit text update frequency during streaming (50ms throttle)
4. **Progressive Loading**: Render initial messages first, backfill older ones when idle
5. **Workspace Isolation**: Keep per-project state separate
6. **Auto-scroll Management**: Pause auto-scroll when user interacts
7. **Registry Pattern**: Use registries for tools and part types for extensibility
8. **Command Pattern**: Centralize keyboard shortcuts and actions
9. **Batch Processing**: Process SSE events in batches with debouncing
10. **Reconcile Pattern**: Use efficient array updates to minimize re-renders
