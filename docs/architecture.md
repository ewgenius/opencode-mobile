# opencode-mobile Architecture Specification

## Overview

opencode-mobile is a cross-platform mobile client for opencode servers, built with React Native and Expo. The app follows an **offline-first** architecture, allowing users to browse cached data even when servers are unreachable or the device is offline.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Expo SDK ~54 | Cross-platform development |
| Router | Expo Router v6 | File-based navigation |
| UI | React Native 0.81 | Native UI components |
| State | Zustand + Persist | Global state with offline persistence |
| Storage | MMKV | Fast local caching |
| Query | TanStack Query | Server state with caching |
| Styling | NativeWind / StyleSheet | Theme-aware styling |
| Animations | Reanimated v4 | Smooth UI transitions |
| Icons | @expo/vector-icons | System icons |
| Images | expo-image | Optimized image handling |

## Project Structure

```
app/
├── _layout.tsx                 # Root layout with sidebar
├── index.tsx                   # Default route (connect-server or redirect)
├── connect-server.tsx          # Add/connect server view (modal or main)
├── server-settings.tsx         # Edit server settings
├── project/
│   └── [id].tsx                # Project detail view
├── session/
│   └── [id].tsx                # Session chat view
├── preferences.tsx             # App preferences/settings
├── components/                 # Shared components
│   ├── ui/                     # Primitive UI components
│   ├── sidebar/                # Sidebar components
│   ├── chat/                   # Chat UI components
│   ├── project/                # Project view components
│   └── server/                 # Server connection components
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand stores (persisted to MMKV)
├── services/                   # API client services
├── themes/                     # Theme types & mapping
│   ├── mobileMapper.ts         # Token mapping (used by build script)
│   ├── types.ts                # Theme type definitions
│   └── index.ts                # Theme list & utilities
├── fonts/                      # Font configurations
├── types/                      # TypeScript definitions
├── utils/                      # Utility functions
├── scripts/                    # Build scripts
│   └── generateThemes.js       # Pre-resolve themes at build time
└── assets/
    └── themes/                 # Pre-resolved mobile themes (gitignored)
        ├── oc-1.json           # Generated at build time
        ├── dracula.json
        ├── tokyonight.json
        └── ... (18 total themes)
```

## Offline-First Architecture

### Core Principles

1. **Read-Only Offline**: Cache allows browsing past data when server unreachable
2. **Server Source of Truth**: All mutations go directly to opencode server
3. **Graceful Degradation**: Visual indicators when offline, actions disabled
4. **Automatic Refresh**: Data refreshes on app resume and navigation

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Server    │◄───▶│  API Client │◄───▶│    Cache    │
│  (Source)   │     │  (SDK)      │     │   (MMKV)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │     UI      │
                                        │  (Zustand)  │
                                        └─────────────┘
```

### Caching Strategy

- **Fetch**: API calls return fresh data from server
- **Store**: Data cached in MMKV with timestamps
- **Display**: UI shows cached data immediately while fetching updates
- **Offline**: Stale cache displayed with "offline mode" indicator
- **Actions**: Mutations (send message, create project) require connection

## State Management

### Zustand Stores

```typescript
// stores/serverStore.ts
interface ServerStore {
  servers: Server[];
  activeServerId: string | null;
  addServer: (server: Server) => void;
  setActiveServer: (id: string) => void;
  removeServer: (id: string) => void;
}

// stores/projectStore.ts
interface ProjectStore {
  projects: Record<string, Project[]>; // keyed by serverId
  activeProjectId: string | null;
  setProjects: (serverId: string, projects: Project[]) => void;
  setActiveProject: (id: string) => void;
  createProject: (serverId: string, name: string) => Promise<void>;
}

// stores/sessionStore.ts
interface SessionStore {
  sessions: Record<string, Session[]>; // keyed by projectId
  activeSessionId: string | null;
  messages: Record<string, Message[]>; // keyed by sessionId
  setSessions: (projectId: string, sessions: Session[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
}

// stores/preferencesStore.ts
interface PreferencesStore {
  theme: 'dark' | 'light' | 'system';
  colorScheme: string;
  uiFont: string;
  codeFont: string;
  lastActiveServer: string | null;
  lastActiveProject: string | null;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: string) => void;
  setFonts: (ui: string, code: string) => void;
  saveLastActive: (server: string, project: string) => void;
}
```

### Persistence

All stores use `persist` middleware with MMKV for synchronous, encrypted storage:

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const useStore = create(
  persist(storeConfig, {
    name: 'store-name',
    storage: createJSONStorage(() => storage),
  })
);
```

## Navigation Structure

### Routes

```
app/
├── _layout.tsx              # Root: ThemeProvider + SafeArea + Sidebar
├── index.tsx                # Default: connect-server or redirect to project
├── connect-server.tsx       # Add new server (first launch or from sidebar)
├── server-settings.tsx      # Edit existing server settings
├── project/
│   └── [id].tsx             # Project sessions list
├── session/
│   └── [id].tsx             # Chat view
└── preferences.tsx          # App settings
```

### Navigation Flow

1. **First Launch**: `index.tsx` detects no servers → renders `connect-server` with welcome instructions
2. **Subsequent**: `index.tsx` redirects to `project/[lastProjectId]` (from preferences)
3. **Add Server**: Sidebar [+] button → `connect-server` (without welcome text)
4. **Edit Server**: Server dropdown → Settings → `server-settings`
5. **Deep Linking**: `opencodemobile://session/[id]` opens directly to session

## UI/UX Architecture

### Layout Structure (Slack-like)

```
┌─────────────────────────────────────────────────────────────┐
│ [Server ▼]  [+]          Project Name    [New] [Workspace] │ Header
├───────────┬─────────────────────────────────────────────────┤
│           │                                                 │
│  Projects │                                                 │
│  ├─ Proj1 │              SESSIONS LIST                     │
│  ├─ Proj2 │                                                 │
│  ├─ Proj3 │         ┌──────────────────┐                   │
│  └─ + New │         │ Session 1        │                   │
│           │         │ Session 2        │                   │
│  [Prefs]  │         │ Session 3        │                   │
│           │         └──────────────────┘                   │
└───────────┴─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [Server ▼]  [+]          Session Title     [Agent] [Model]  │
├───────────┬─────────────────────────────────────────────────┤
│           │                                                 │
│  (same    │    User: Hello!                                │
│  sidebar) │    Agent: Hi! How can I help?                  │
│           │                                                 │
│           │    User: Code review                           │
│           │    Agent: Here's my analysis...                │
│           │    ```javascript                               │
│           │    // code with code font                      │
│           │    ```                                         │
│           │                                                 │
│           │┌──────────────────────────────────────────────┐│
│           ││ [Input text...    ] [Agent▼] [Model▼] [Send] ││
│           │└──────────────────────────────────────────────┘│
└───────────┴─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
AppShell
├── Sidebar
│   ├── ServerSelector (dropdown)
│   ├── ProjectList
│   │   ├── ProjectItem
│   │   └── NewProjectButton
│   └── PreferencesButton
├── MainContent
│   ├── ProjectView
│   │   ├── WorkspaceGroup
│   │   └── SessionList
│   ├── SessionView
│   │   ├── MessageList
│   │   └── InputPane
│   └── PreferencesView
└── Modals
    ├── ConnectServerModal
    ├── NewProjectModal
    └── NewWorkspaceModal
```

## Theming System

### Theme Source

Themes are sourced directly from opencode desktop theme JSON files located at `../opencode/packages/ui/src/theme/themes/`. These themes use a **seed-based color generation system** with OKLCH color space.

### Build-Time Theme Resolution

Themes are **pre-resolved at build time** to avoid runtime OKLCH calculations and ensure fast app startup.

#### Build Script

```javascript
// scripts/generateThemes.js
const fs = require('fs');
const path = require('path');
const { resolveTheme } = require('../opencode/packages/ui/src/theme/resolve');

const themesDir = '../opencode/packages/ui/src/theme/themes';
const outputDir = './assets/themes';

fs.mkdirSync(outputDir, { recursive: true });

const themes = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));

// Generate resolved themes
for (const file of themes) {
  const themeJson = JSON.parse(fs.readFileSync(path.join(themesDir, file)));
  
  // Resolve both light and dark variants
  const resolved = {
    id: themeJson.id,
    name: themeJson.name,
    light: resolveTheme(themeJson, false),
    dark: resolveTheme(themeJson, true),
  };
  
  // Map to mobile-friendly structure
  const mobileTheme = {
    id: resolved.id,
    name: resolved.name,
    light: mapToMobileTheme(resolved.light),
    dark: mapToMobileTheme(resolved.dark),
  };
  
  fs.writeFileSync(
    path.join(outputDir, file),
    JSON.stringify(mobileTheme, null, 2)
  );
}

console.log(`Generated ${themes.length} themes in ${outputDir}`);
```

#### NPM Script

```json
{
  "scripts": {
    "generate-themes": "node scripts/generateThemes.js",
    "prebuild": "npm run generate-themes",
    "prestart": "npm run generate-themes"
  }
}
```

### Generated Theme Format

After build, each theme file contains pre-computed mobile-friendly colors:

```json
{
  "id": "dracula",
  "name": "Dracula",
  "light": {
    "colors": {
      "background": "#f8f8f2",
      "surface": "#ffffff",
      "sidebar": "#f0f0f0",
      "header": "#e8e8e8",
      "input": "#ffffff",
      "text": "#282a36",
      "textMuted": "#6272a4",
      "textInverse": "#f8f8f2",
      "primary": "#bd93f9",
      "success": "#50fa7b",
      "warning": "#f1fa8c",
      "error": "#ff5555",
      "info": "#8be9fd",
      "border": "#e0e0e0",
      "borderMuted": "#f0f0f0",
      "hover": "#f0f0f0",
      "active": "#e8e8e8",
      "selected": "#bd93f920",
      "codeBackground": "#f0f0f0",
      "codeText": "#f8f8f2",
      "syntax": {
        "string": "#f1fa8c",
        "keyword": "#ff79c6",
        "property": "#66d9ef",
        "function": "#50fa7b",
        "number": "#bd93f9",
        "comment": "#6272a4"
      }
    }
  },
  "dark": {
    "colors": { "...": "same structure with dark values" }
  }
}
```

### Available Themes

18 themes available (copied from opencode and pre-resolved at build):

- `oc-1.json` (default)
- `tokyonight.json`, `dracula.json`, `monokai.json`
- `nord.json`, `catppuccin.json`, `ayu.json`
- `onedarkpro.json`, `shadesofpurple.json`, `nightowl.json`
- `vesper.json`, `carbonfox.json`, `gruvbox.json`
- `aura.json`, `solarized.json`, `deltarune.json`, `undertale.json`

### Theme Provider

```typescript
// components/ThemeProvider.tsx
export function ThemeProvider({ children }) {
  const { theme, colorSchemeId } = usePreferencesStore();
  const systemScheme = useColorScheme();
  
  const isDark = theme === 'system' 
    ? systemScheme === 'dark' 
    : theme === 'dark';
  
  // Load pre-resolved theme (fast, no calculations)
  const colors = useMemo(() => {
    const themeData = require(`@/assets/themes/${colorSchemeId}.json`);
    return isDark ? themeData.dark.colors : themeData.light.colors;
  }, [colorSchemeId, isDark]);
  
  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Mobile Theme Type

```typescript
// themes/types.ts
export interface MobileTheme {
  id: string;
  name: string;
  light: MobileThemeVariant;
  dark: MobileThemeVariant;
}

export interface MobileThemeVariant {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    sidebar: string;
    header: string;
    input: string;
    
    // Text
    text: string;
    textMuted: string;
    textInverse: string;
    
    // Accents
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Borders
    border: string;
    borderMuted: string;
    
    // Interactive
    hover: string;
    active: string;
    selected: string;
    
    // Code
    codeBackground: string;
    codeText: string;
    
    // Syntax highlighting
    syntax: {
      string: string;
      keyword: string;
      property: string;
      function: string;
      number: string;
      comment: string;
    };
  };
}

### Mobile Theme Mapper

```typescript
// themes/mobileMapper.ts
export function mapToMobileTheme(resolved: Record<string, string>): MobileThemeVariant {
  return {
    colors: {
      // Backgrounds
      background: resolved['background-base'],
      surface: resolved['surface-base'],
      sidebar: resolved['background-weak'],
      header: resolved['surface-raised-base'],
      input: resolved['surface-base'],
      
      // Text
      text: resolved['text-base'],
      textMuted: resolved['text-weak'],
      textInverse: resolved['neutral-0'] || resolved['background-strong'],
      
      // Accents
      primary: resolved['surface-brand-base'],
      success: resolved['surface-success-base'],
      warning: resolved['surface-warning-base'],
      error: resolved['surface-critical-base'],
      info: resolved['surface-info-base'],
      
      // Borders
      border: resolved['border-base'],
      borderMuted: resolved['border-weak'] || resolved['border-base'],
      
      // Interactive
      hover: resolved['surface-hover'] || resolved['surface-weak'],
      active: resolved['surface-active'] || resolved['surface-weak'],
      selected: resolved['surface-selected'] || resolved['surface-brand-weak'],
      
      // Code
      codeBackground: resolved['surface-weak'],
      codeText: resolved['text-base'],
      
      // Syntax highlighting
      syntax: {
        string: resolved['syntax-string'] || resolved['surface-success-base'],
        keyword: resolved['syntax-keyword'] || resolved['surface-brand-base'],
        property: resolved['syntax-property'] || resolved['text-base'],
        function: resolved['syntax-function'] || resolved['surface-info-base'],
        number: resolved['syntax-number'] || resolved['surface-warning-base'],
        comment: resolved['syntax-comment'] || resolved['text-weak'],
      }
    }
  };
}
```

### Font System

```typescript
// fonts/config.ts
interface FontConfig {
  ui: string;      // System font or custom
  code: string;    // Monospace font
}

// hooks/useFonts.ts
export function useFonts() {
  const { uiFont, codeFont } = usePreferencesStore();
  
  return {
    ui: { fontFamily: uiFont },
    code: { fontFamily: codeFont },
  };
}

// Usage in components
function MyComponent() {
  const fonts = useFonts();
  const { colors } = useTheme();
  
  return (
    <Text style={[fonts.ui, { color: colors.text }]}>
      UI Text
    </Text>
    <Text style={[fonts.code, { color: colors.codeText }]}>
      Code text
    </Text>
  );
}
```

## Data Layer

### Architecture

Simple client-server model with local caching:
- **API Layer**: Direct calls to opencode server via SDK
- **Cache Layer**: MMKV for fast local storage of fetched data
- **State Layer**: Zustand stores with persistence for UI state

No bidirectional sync - this is a pure client that fetches from and sends to opencode servers.

### API Service

```typescript
// services/opencodeApi.ts
import { OpenCodeSDK } from '@opencode-ai/sdk';

export class OpencodeApi {
  private client: OpenCodeSDK;
  
  constructor(serverUrl: string, password?: string) {
    this.client = new OpenCodeSDK({
      baseUrl: serverUrl,
      auth: password ? { type: 'password', value: password } : undefined,
    });
  }
  
  async getProjects(): Promise<Project[]> {
    return this.client.projects.list();
  }
  
  async getSessions(projectId: string): Promise<Session[]> {
    return this.client.sessions.list({ projectId });
  }
  
  async getMessages(sessionId: string): Promise<Message[]> {
    return this.client.sessions.messages.list({ sessionId });
  }
  
  async sendMessage(sessionId: string, content: string, agent?: string): Promise<Message> {
    return this.client.sessions.messages.create({
      sessionId,
      content,
      agent,
    });
  }
  
  async createProject(name: string): Promise<Project> {
    return this.client.projects.create({ name });
  }
  
  async createWorkspace(projectId: string, name: string): Promise<Workspace> {
    return this.client.workspaces.create({ projectId, name });
  }
  
  async createSession(projectId: string, workspaceId?: string): Promise<Session> {
    return this.client.sessions.create({ projectId, workspaceId });
  }
}

// hooks/useApi.ts
export function useApi(serverId: string) {
  const server = useServerStore(s => s.servers.find(s => s.id === serverId));
  return useMemo(() => 
    server ? new OpencodeApi(server.url, server.password) : null,
    [server]
  );
}
```

### Caching Strategy

```typescript
// stores/cacheStore.ts
interface CacheStore {
  // Cached data keyed by serverId
  projects: Record<string, { data: Project[]; timestamp: number }>;
  sessions: Record<string, { data: Session[]; timestamp: number }>;
  messages: Record<string, { data: Message[]; timestamp: number }>;
  
  // Cache operations
  setProjects: (serverId: string, projects: Project[]) => void;
  setSessions: (projectId: string, sessions: Session[]) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  getProjects: (serverId: string) => Project[] | null;
  getSessions: (projectId: string) => Session[] | null;
  getMessages: (sessionId: string) => Message[] | null;
  isStale: (timestamp: number, maxAge: number) => boolean;
  
  // Clear cache for a server
  clearServerCache: (serverId: string) => void;
}

// Cache TTL configuration
const CACHE_TTL = {
  projects: 5 * 60 * 1000,    // 5 minutes
  sessions: 2 * 60 * 1000,    // 2 minutes  
  messages: 30 * 1000,        // 30 seconds (more dynamic)
};
```

### Data Fetching with TanStack Query

```typescript
// hooks/useProjects.ts
export function useProjects(serverId: string) {
  const api = useApi(serverId);
  const cache = useCacheStore();
  
  return useQuery({
    queryKey: ['projects', serverId],
    queryFn: async () => {
      if (!api) throw new Error('No API client');
      const projects = await api.getProjects();
      cache.setProjects(serverId, projects);
      return projects;
    },
    initialData: () => cache.getProjects(serverId),
    staleTime: CACHE_TTL.projects,
    enabled: !!api,
  });
}

// hooks/useMessages.ts
export function useMessages(sessionId: string) {
  const { activeServerId } = useServerStore();
  const api = useApi(activeServerId!);
  const cache = useCacheStore();
  
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      if (!api) throw new Error('No API client');
      const messages = await api.getMessages(sessionId);
      cache.setMessages(sessionId, messages);
      return messages;
    },
    initialData: () => cache.getMessages(sessionId),
    staleTime: CACHE_TTL.messages,
    enabled: !!api && !!sessionId,
  });
}

// hooks/useSendMessage.ts
export function useSendMessage() {
  const { activeServerId } = useServerStore();
  const api = useApi(activeServerId!);
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, content, agent }: SendMessageParams) => {
      if (!api) throw new Error('No API client');
      return api.sendMessage(sessionId, content, agent);
    },
    onSuccess: (data, variables) => {
      // Invalidate messages query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['messages', variables.sessionId] });
    },
  });
}
```

## Storage Strategy

### Data Tiers

| Tier | Storage | Data | Persistence |
|------|---------|------|-------------|
| Critical | MMKV | Preferences, Server configs | Immediate |
| Cache | MMKV | Projects, Sessions, Messages | On fetch |
| Temp | Memory | UI state, Form data | Session only |

### Cache Management

- **Auto-expiry**: Data refreshes based on TTL (projects: 5min, sessions: 2min, messages: 30sec)
- **Manual refresh**: Pull-to-refresh in UI triggers immediate refetch
- **Offline reading**: Stale data displayed when offline with visual indicator
- **Cache limits**: Max 1000 messages per session stored locally

## Key Components

### Sidebar

```typescript
// components/sidebar/Sidebar.tsx
export function Sidebar() {
  const { servers, activeServerId } = useServerStore();
  const { projects, activeProjectId } = useProjectStore();
  const { colors } = useTheme();
  const fonts = useFonts();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.sidebar }]}>
      <ServerSelector 
        servers={servers}
        activeId={activeServerId}
        onSelect={setActiveServer}
        onAdd={() => router.push('/(auth)/connect-server')}
      />
      
      <ScrollView>
        <ProjectList
          projects={projects[activeServerId] || []}
          activeId={activeProjectId}
          onSelect={setActiveProject}
          onCreate={() => showNewProjectModal()}
        />
      </ScrollView>
      
      <PreferencesButton onPress={() => router.push('/preferences')} />
    </View>
  );
}
```

### Chat Input Pane

```typescript
// components/chat/InputPane.tsx
export function InputPane({ sessionId }: { sessionId: string }) {
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState('build');
  const [model, setModel] = useState('gpt-4');
  const { colors } = useTheme();
  const fonts = useFonts();
  const sendMessage = useSessionStore(s => s.sendMessage);
  const isOffline = useNetworkStore(s => !s.isConnected);
  
  const handleSend = async () => {
    if (!input.trim() || isOffline) return;
    
    await sendMessage(sessionId, input, { agent, model });
    setInput('');
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: colors.input,
      borderTopColor: colors.border 
    }]}>
      <TextInput
        value={input}
        onChangeText={setInput}
        style={[fonts.ui, { color: colors.text }]}
        placeholder="Type a message..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={4000}
      />
      
      <View style={styles.controls}>
        <AgentSelector value={agent} onChange={setAgent} />
        <ModelSelector value={model} onChange={setModel} />
        <SendButton 
          onPress={handleSend} 
          disabled={!input.trim() || isOffline}
        />
      </View>
    </View>
  );
}
```

### Preferences View

```typescript
// app/(app)/preferences.tsx
export default function PreferencesView() {
  const { 
    theme, setTheme,
    colorScheme, setColorScheme,
    uiFont, codeFont, setFonts 
  } = usePreferencesStore();
  const { colors } = useTheme();
  const fonts = useFonts();
  
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <Section title="Appearance">
        <Select
          label="Theme Mode"
          value={theme}
          options={['dark', 'light', 'system']}
          onChange={setTheme}
        />
        
        <Select
          label="Color Scheme"
          value={colorScheme}
          options={availableColorSchemes}
          onChange={setColorScheme}
        />
      </Section>
      
      <Section title="Typography">
        <FontSelector
          label="UI Font"
          value={uiFont}
          options={systemFonts}
          onChange={(font) => setFonts(font, codeFont)}
        />
        
        <FontSelector
          label="Code Font"
          value={codeFont}
          options={monospaceFonts}
          onChange={(font) => setFonts(uiFont, font)}
        />
      </Section>
    </ScrollView>
  );
}
```

## Dependencies to Add

### Runtime Dependencies

```json
{
  "dependencies": {
    "@opencode-ai/sdk": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "react-native-mmkv": "^2.12.0"
  }
}
```

### Build-Time Setup

No additional dependencies needed - the build script imports directly from opencode's theme resolver:

```javascript
// scripts/generateThemes.js
const { resolveTheme } = require('../opencode/packages/ui/src/theme/resolve');
```

**Prerequisites:**
- opencode repo available at `../opencode` (relative to mobile app)
- Run `npm run generate-themes` before building
- Generated themes are gitignored (rebuilt on each dev/build)

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup project structure with Expo Router
- [ ] Create `scripts/generateThemes.js` build script
- [ ] Create `themes/mobileMapper.ts` for token mapping
- [ ] Run build script to generate pre-resolved themes in `assets/themes/`
- [ ] Setup ThemeProvider with dark/light/system modes (load pre-resolved themes)
- [ ] Setup Zustand stores with MMKV persistence
- [ ] Create base UI components (Button, Input, Select) using theme colors

### Phase 2: Core Features (Week 2)
- [ ] Server connection views (connect-server, server-settings)
- [ ] Sidebar implementation with server/project navigation
- [ ] API service integration with @opencode-ai/sdk
- [ ] Preferences screen with theme selector (all 18 themes)
- [ ] Font selection (UI + Code fonts)

### Phase 3: Chat (Week 3)
- [ ] Project view with sessions list
- [ ] Session chat view with message list
- [ ] Input pane with agent/model selectors
- [ ] Message rendering with syntax highlighting using theme colors
- [ ] Code block styling with code font and theme syntax colors

### Phase 4: Polish (Week 4)
- [ ] Offline indicators and error handling
- [ ] Pull-to-refresh and cache management
- [ ] Performance optimization (FlashList, memoization)
- [ ] Testing & bug fixes

## Performance Considerations

1. **Virtualized Lists**: Use FlashList for long message lists
2. **Image Optimization**: expo-image with lazy loading
3. **Memoization**: React.memo for message items
4. **Cache Size Limits**: Auto-trim old messages per session
5. **Bundle Size**: Code split by route, lazy load heavy components

## Security

1. **Password Storage**: Keychain (iOS) / Keystore (Android) via `expo-secure-store`
2. **Cache Encryption**: MMKV supports encryption for sensitive cached data
3. **Certificate Pinning**: Optional for self-hosted servers
4. **Biometric Auth**: Optional app lock via `expo-local-authentication`

---

*Document Version: 1.0*
*Last Updated: 2026-01-30*
