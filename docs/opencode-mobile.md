# OpenCode Mobile Client Guide

A comprehensive guide for building a fully-featured mobile client for OpenCode using Expo and React Native.

---

## Overview

This guide covers best practices for building a mobile client that connects to an OpenCode server, enabling users to:
- Connect to and manage OpenCode server instances
- Browse projects and sessions
- Participate in real-time chat sessions
- Send and receive messages with AI
- Handle streaming responses and tool executions

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Setup](#2-project-setup)
3. [Server Connection & Health](#3-server-connection--health)
4. [Configuration Management](#4-configuration-management)
5. [Projects & Sessions](#5-projects--sessions)
6. [Real-time Messaging](#6-real-time-messaging)
7. [Mobile-Specific Considerations](#7-mobile-specific-considerations)
8. [Performance Optimization](#8-performance-optimization)
9. [Complete Example](#9-complete-example)

---

## 1. Architecture Overview

### Mobile Client Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT (Expo)                      │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Server    │   Session   │   Message   │    Settings      │
│   Manager   │   Browser   │   Composer  │    & Config      │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬─────────┘
       │             │             │               │
       └─────────────┴─────────────┴───────────────┘
                         │
              OpenCode SDK (@opencode-ai/sdk)
                         │
                    HTTP API + SSE
                         │
       ┌─────────────────┴─────────────────┐
       │           OPENCODE SERVER          │
       │     (Running on desktop/remote)    │
       └────────────────────────────────────┘
```

### Key Components

1. **Server Connection Manager** - Handles server discovery, connection, health monitoring
2. **Session Store** - Manages session state, caching, and real-time updates
3. **Message Stream Handler** - Processes SSE streams for live messages
4. **Composer** - Input handling with mobile-optimized UX
5. **Settings** - Configuration, auth management, preferences

---

## 2. Project Setup

### Dependencies

```bash
# Core dependencies
npm install @opencode-ai/sdk
npm install expo-router
npm install zustand
npm install @tanstack/react-query

# UI & utilities
npm install expo-image
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install @gorhom/bottom-sheet

# Storage
npm install @react-native-async-storage/async-storage
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/stores/*": ["./stores/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

### Directory Structure

```
app/
├── _layout.tsx                 # Root layout with providers
├── (tabs)/
│   ├── _layout.tsx             # Tab navigation
│   ├── servers.tsx             # Server management
│   ├── sessions.tsx            # Session browser
│   └── settings.tsx            # App settings
├── server/
│   ├── [id]/
│   │   ├── _layout.tsx         # Server detail layout
│   │   ├── index.tsx           # Server overview
│   │   ├── sessions.tsx        # Server sessions list
│   │   └── session/
│   │       └── [sessionId].tsx # Chat interface
│   └── add.tsx                 # Add new server
components/
├── server/
│   ├── server-card.tsx
│   ├── server-status.tsx
│   └── connection-form.tsx
├── session/
│   ├── session-list.tsx
│   ├── session-card.tsx
│   └── session-preview.tsx
├── chat/
│   ├── message-list.tsx
│   ├── message-bubble.tsx
│   ├── composer.tsx
│   └── streaming-indicator.tsx
├── ui/                         # Reusable UI components
hooks/
├── use-opencode-client.ts
├── use-server-events.ts
├── use-session-stream.ts
stores/
├── servers-store.ts
├── sessions-store.ts
├── messages-store.ts
└── settings-store.ts
lib/
├── opencode-client.ts
├── event-emitter.ts
└── storage.ts
types/
├── server.ts
├── session.ts
└── message.ts
```

---

## 3. Server Connection & Health

### Server Configuration Storage

```typescript
// stores/servers-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ServerConfig {
  id: string
  name: string
  url: string
  username?: string
  password?: string
  lastConnected?: number
  isDefault?: boolean
}

interface ServersState {
  servers: ServerConfig[]
  activeServerId: string | null
  addServer: (server: Omit<ServerConfig, 'id'>) => void
  removeServer: (id: string) => void
  setActiveServer: (id: string) => void
  updateServer: (id: string, updates: Partial<ServerConfig>) => void
}

export const useServersStore = create<ServersState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      addServer: (server) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({
          servers: [...state.servers, { ...server, id }],
          activeServerId: state.activeServerId || id
        }))
      },
      removeServer: (id) => {
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId: state.activeServerId === id 
            ? null 
            : state.activeServerId
        }))
      },
      setActiveServer: (id) => set({ activeServerId: id }),
      updateServer: (id, updates) => {
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          )
        }))
      }
    }),
    {
      name: 'opencode-servers',
      storage: AsyncStorage
    }
  )
)
```

### Client Hook with Health Monitoring

```typescript
// hooks/use-opencode-client.ts
import { useEffect, useState, useCallback } from 'react'
import { createOpencodeClient } from '@opencode-ai/sdk'
import type { Client } from '@opencode-ai/sdk'
import { useServersStore } from '@/stores/servers-store'

interface ServerHealth {
  status: 'healthy' | 'unhealthy' | 'checking' | 'error'
  version?: string
  error?: string
}

export function useOpencodeClient(serverId?: string) {
  const { servers, activeServerId } = useServersStore()
  const targetId = serverId || activeServerId
  const server = servers.find((s) => s.id === targetId)
  
  const [client, setClient] = useState<Client | null>(null)
  const [health, setHealth] = useState<ServerHealth>({ status: 'checking' })
  const [isConnecting, setIsConnecting] = useState(false)

  // Create client instance
  useEffect(() => {
    if (!server) {
      setClient(null)
      setHealth({ status: 'error', error: 'No server configured' })
      return
    }

    const newClient = createOpencodeClient({
      baseUrl: server.url,
      throwOnError: false
    })
    
    setClient(newClient)
  }, [server?.url, server?.username, server?.password])

  // Health check
  const checkHealth = useCallback(async () => {
    if (!client) return
    
    setHealth((prev) => ({ ...prev, status: 'checking' }))
    
    try {
      const response = await client.global.health()
      
      if (response.data?.healthy) {
        setHealth({
          status: 'healthy',
          version: response.data.version
        })
      } else {
        setHealth({
          status: 'unhealthy',
          error: 'Server reported unhealthy status'
        })
      }
    } catch (error) {
      setHealth({
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }, [client])

  // Auto-check health on mount and when client changes
  useEffect(() => {
    if (client) {
      checkHealth()
    }
  }, [client, checkHealth])

  // Periodic health check (every 30 seconds when connected)
  useEffect(() => {
    if (!client || health.status !== 'healthy') return
    
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [client, health.status, checkHealth])

  return {
    client,
    server,
    health,
    isConnecting,
    checkHealth,
    isConnected: health.status === 'healthy'
  }
}
```

### Server Card Component

```typescript
// components/server/server-card.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { useOpencodeClient } from '@/hooks/use-opencode-client'
import { ServerConfig } from '@/stores/servers-store'

interface ServerCardProps {
  server: ServerConfig
}

export function ServerCard({ server }: ServerCardProps) {
  const { health, isConnected } = useOpencodeClient(server.id)

  const statusColor = {
    healthy: '#22c55e',
    unhealthy: '#ef4444',
    checking: '#f59e0b',
    error: '#ef4444'
  }[health.status]

  return (
    <Link href={`/server/${server.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={styles.name}>{server.name}</Text>
        </View>
        
        <Text style={styles.url}>{server.url}</Text>
        
        {health.version && (
          <Text style={styles.version}>v{health.version}</Text>
        )}
        
        {health.error && (
          <Text style={styles.error}>{health.error}</Text>
        )}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  name: {
    fontSize: 16,
    fontWeight: '600'
  },
  url: {
    fontSize: 14,
    color: '#6b7280'
  },
  version: {
    fontSize: 12,
    color: '#22c55e'
  },
  error: {
    fontSize: 12,
    color: '#ef4444'
  }
})
```

---

## 4. Configuration Management

### Configuration Store

```typescript
// stores/settings-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsState {
  // Connection settings
  autoConnect: boolean
  defaultServerId: string | null
  
  // UI preferences
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  codeTheme: string
  
  // Behavior
  enableNotifications: boolean
  autoScroll: boolean
  showTimestamps: boolean
  
  // Actions
  setAutoConnect: (value: boolean) => void
  setDefaultServer: (id: string | null) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoConnect: true,
      defaultServerId: null,
      theme: 'system',
      fontSize: 'medium',
      codeTheme: 'github',
      enableNotifications: true,
      autoScroll: true,
      showTimestamps: false,
      
      setAutoConnect: (value) => set({ autoConnect: value }),
      setDefaultServer: (id) => set({ defaultServerId: id }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize })
    }),
    {
      name: 'opencode-settings',
      storage: AsyncStorage
    }
  )
)
```

### Fetching Server Configuration

```typescript
// hooks/use-server-config.ts
import { useQuery } from '@tanstack/react-query'
import { useOpencodeClient } from './use-opencode-client'

export function useServerConfig(serverId?: string) {
  const { client, isConnected } = useOpencodeClient(serverId)

  return useQuery({
    queryKey: ['server-config', serverId],
    queryFn: async () => {
      if (!client) throw new Error('No client available')
      
      const response = await client.config.get()
      return response.data
    },
    enabled: isConnected,
    staleTime: 60000 // 1 minute
  })
}

// hooks/use-providers.ts
export function useProviders(serverId?: string) {
  const { client, isConnected } = useOpencodeClient(serverId)

  return useQuery({
    queryKey: ['providers', serverId],
    queryFn: async () => {
      if (!client) throw new Error('No client available')
      
      const response = await client.app.providers()
      return {
        providers: response.providers,
        defaults: response.default
      }
    },
    enabled: isConnected,
    staleTime: 300000 // 5 minutes
  })
}
```

---

## 5. Projects & Sessions

### Sessions Store with Real-time Updates

```typescript
// stores/sessions-store.ts
import { create } from 'zustand'
import { createOpencodeClient } from '@opencode-ai/sdk'
import type { Session } from '@opencode-ai/sdk'

interface SessionWithSync extends Session {
  isLoading?: boolean
  lastSynced?: number
}

interface SessionsState {
  sessions: Map<string, SessionWithSync> // key: `${serverId}:${sessionId}`
  activeSessionId: string | null
  
  // Actions
  setSessions: (serverId: string, sessions: Session[]) => void
  addSession: (serverId: string, session: Session) => void
  updateSession: (serverId: string, sessionId: string, updates: Partial<Session>) => void
  removeSession: (serverId: string, sessionId: string) => void
  setActiveSession: (id: string | null) => void
  getSession: (serverId: string, sessionId: string) => SessionWithSync | undefined
  getServerSessions: (serverId: string) => SessionWithSync[]
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,

  setSessions: (serverId, sessions) => {
    set((state) => {
      const newSessions = new Map(state.sessions)
      sessions.forEach((session) => {
        const key = `${serverId}:${session.id}`
        newSessions.set(key, {
          ...session,
          lastSynced: Date.now()
        })
      })
      return { sessions: newSessions }
    })
  },

  addSession: (serverId, session) => {
    set((state) => {
      const newSessions = new Map(state.sessions)
      const key = `${serverId}:${session.id}`
      newSessions.set(key, {
        ...session,
        lastSynced: Date.now()
      })
      return { sessions: newSessions }
    })
  },

  updateSession: (serverId, sessionId, updates) => {
    set((state) => {
      const key = `${serverId}:${sessionId}`
      const existing = state.sessions.get(key)
      if (!existing) return state

      const newSessions = new Map(state.sessions)
      newSessions.set(key, {
        ...existing,
        ...updates,
        lastSynced: Date.now()
      })
      return { sessions: newSessions }
    })
  },

  removeSession: (serverId, sessionId) => {
    set((state) => {
      const newSessions = new Map(state.sessions)
      newSessions.delete(`${serverId}:${sessionId}`)
      return { sessions: newSessions }
    })
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  getSession: (serverId, sessionId) => {
    return get().sessions.get(`${serverId}:${sessionId}`)
  },

  getServerSessions: (serverId) => {
    const sessions: SessionWithSync[] = []
    get().sessions.forEach((session, key) => {
      if (key.startsWith(`${serverId}:`)) {
        sessions.push(session)
      }
    })
    return sessions.sort((a, b) => 
      (b.time.updated || b.time.created) - (a.time.updated || a.time.created)
    )
  }
}))
```

### Sessions List Hook

```typescript
// hooks/use-sessions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOpencodeClient } from './use-opencode-client'
import { useSessionsStore } from '@/stores/sessions-store'
import { useEffect } from 'react'

export function useSessions(serverId?: string) {
  const { client, isConnected } = useOpencodeClient(serverId)
  const { setSessions, getServerSessions } = useSessionsStore()
  
  const queryClient = useQueryClient()

  // Fetch sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', serverId],
    queryFn: async () => {
      if (!client) throw new Error('No client available')
      
      const response = await client.session.list()
      return response.data
    },
    enabled: isConnected,
    staleTime: 30000 // 30 seconds
  })

  // Sync to store when data changes
  useEffect(() => {
    if (data && serverId) {
      setSessions(serverId, data)
    }
  }, [data, serverId, setSessions])

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (title: string) => {
      if (!client) throw new Error('No client available')
      
      const response = await client.session.create({
        body: { title }
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', serverId] })
    }
  })

  // Delete session mutation
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!client) throw new Error('No client available')
      
      await client.session.delete({ path: { id: sessionId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', serverId] })
    }
  })

  return {
    sessions: serverId ? getServerSessions(serverId) : [],
    isLoading,
    error,
    createSession,
    deleteSession
  }
}
```

### Session List Component

```typescript
// components/session/session-list.tsx
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useSessions } from '@/hooks/use-sessions'
import { formatDistanceToNow } from '@/lib/date'

interface SessionListProps {
  serverId: string
}

export function SessionList({ serverId }: SessionListProps) {
  const { sessions, isLoading } = useSessions(serverId)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading sessions...</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      renderItem={({ item }) => (
        <Link href={`/server/${serverId}/session/${item.id}`} asChild>
          <Pressable style={styles.sessionCard}>
            <Text style={styles.title}>{item.title || 'Untitled Session'}</Text>
            <Text style={styles.meta}>
              {formatDistanceToNow(item.time.updated || item.time.created)}
            </Text>
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No sessions yet</Text>
          <Text style={styles.hint}>Create a new session to get started</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  sessionCard: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  meta: {
    fontSize: 12,
    color: '#6b7280'
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  hint: {
    fontSize: 14,
    color: '#6b7280'
  }
})
```

---

## 6. Real-time Messaging

### Message Store

```typescript
// stores/messages-store.ts
import { create } from 'zustand'
import type { Message, Part, TextPart, ToolPart } from '@opencode-ai/sdk'

interface MessageWithSync extends Message {
  isStreaming?: boolean
  streamingContent?: string
}

interface MessagesState {
  messages: Map<string, MessageWithSync> // key: `${serverId}:${sessionId}:${messageId}`
  
  setMessages: (serverId: string, sessionId: string, messages: Message[]) => void
  addMessage: (serverId: string, sessionId: string, message: Message) => void
  updateMessage: (serverId: string, sessionId: string, messageId: string, updates: Partial<MessageWithSync>) => void
  appendStreamingContent: (serverId: string, sessionId: string, messageId: string, delta: string) => void
  getSessionMessages: (serverId: string, sessionId: string) => MessageWithSync[]
  clearSession: (serverId: string, sessionId: string) => void
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: new Map(),

  setMessages: (serverId, sessionId, messages) => {
    set((state) => {
      const newMessages = new Map(state.messages)
      messages.forEach((message) => {
        const key = `${serverId}:${sessionId}:${message.id}`
        newMessages.set(key, message)
      })
      return { messages: newMessages }
    })
  },

  addMessage: (serverId, sessionId, message) => {
    set((state) => {
      const newMessages = new Map(state.messages)
      const key = `${serverId}:${sessionId}:${message.id}`
      newMessages.set(key, message)
      return { messages: newMessages }
    })
  },

  updateMessage: (serverId, sessionId, messageId, updates) => {
    set((state) => {
      const key = `${serverId}:${sessionId}:${messageId}`
      const existing = state.messages.get(key)
      if (!existing) return state

      const newMessages = new Map(state.messages)
      newMessages.set(key, { ...existing, ...updates })
      return { messages: newMessages }
    })
  },

  appendStreamingContent: (serverId, sessionId, messageId, delta) => {
    set((state) => {
      const key = `${serverId}:${sessionId}:${messageId}`
      const existing = state.messages.get(key)
      if (!existing) return state

      const newMessages = new Map(state.messages)
      newMessages.set(key, {
        ...existing,
        streamingContent: (existing.streamingContent || '') + delta,
        isStreaming: true
      })
      return { messages: newMessages }
    })
  },

  getSessionMessages: (serverId, sessionId) => {
    const messages: MessageWithSync[] = []
    const prefix = `${serverId}:${sessionId}:`
    
    get().messages.forEach((message, key) => {
      if (key.startsWith(prefix)) {
        messages.push(message)
      }
    })
    
    return messages.sort((a, b) => a.time.created - b.time.created)
  },

  clearSession: (serverId, sessionId) => {
    set((state) => {
      const newMessages = new Map(state.messages)
      const prefix = `${serverId}:${sessionId}:`
      
      state.messages.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          newMessages.delete(key)
        }
      })
      
      return { messages: newMessages }
    })
  }
}))
```

### Session Stream Hook (SSE)

```typescript
// hooks/use-session-stream.ts
import { useEffect, useRef, useCallback } from 'react'
import { useOpencodeClient } from './use-opencode-client'
import { useMessagesStore } from '@/stores/messages-store'
import { useSessionsStore } from '@/stores/sessions-store'
import { AppState, AppStateStatus } from 'react-native'

export function useSessionStream(serverId: string, sessionId: string) {
  const { client, isConnected } = useOpencodeClient(serverId)
  const { addMessage, updateMessage, appendStreamingContent } = useMessagesStore()
  const { updateSession } = useSessionsStore()
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const appStateRef = useRef<AppStateStatus>('active')

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState
      
      if (nextAppState === 'active') {
        // Reconnect when app comes to foreground
        startStream()
      } else if (nextAppState === 'background') {
        // Cancel stream when app goes to background
        abortControllerRef.current?.abort()
      }
    })

    return () => subscription.remove()
  }, [serverId, sessionId])

  const startStream = useCallback(async () => {
    if (!client || !isConnected) return
    
    // Cancel existing stream
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const events = await client.session.event({
        path: { id: sessionId }
      })

      for await (const event of events.stream) {
        // Skip if app is in background
        if (appStateRef.current !== 'active') continue

        switch (event.type) {
          case 'message.updated':
            if (event.properties.info) {
              addMessage(serverId, sessionId, event.properties.info)
            }
            break

          case 'message.part.updated':
            // Handle streaming text
            if (event.properties.delta && event.properties.part) {
              const { part, delta } = event.properties
              
              if (part.type === 'text') {
                appendStreamingContent(
                  serverId,
                  sessionId,
                  part.messageID,
                  delta
                )
              }
            }
            break

          case 'session.updated':
            if (event.properties.info) {
              updateSession(serverId, sessionId, event.properties.info)
            }
            break

          case 'message.part.finished':
            // Streaming finished
            if (event.properties.part) {
              updateMessage(serverId, sessionId, event.properties.part.messageID, {
                isStreaming: false
              })
            }
            break
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream error:', error)
      }
    }
  }, [client, isConnected, serverId, sessionId])

  // Start stream when connected
  useEffect(() => {
    if (isConnected) {
      startStream()
    }
    
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isConnected, startStream])

  return {
    isStreaming: isConnected
  }
}
```

### Message Composer

```typescript
// components/chat/composer.tsx
import { useState, useCallback } from 'react'
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native'
import { useOpencodeClient } from '@/hooks/use-opencode-client'
import { useMessagesStore } from '@/stores/messages-store'

interface ComposerProps {
  serverId: string
  sessionId: string
  model?: { providerID: string; modelID: string }
}

export function Composer({ serverId, sessionId, model }: ComposerProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { client } = useOpencodeClient(serverId)
  const { addMessage } = useMessagesStore()

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !client || isSending) return

    setIsSending(true)
    
    try {
      // Optimistically add user message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sessionID: sessionId,
        role: 'user' as const,
        time: { created: Date.now() },
        agent: 'default',
        model: model || { providerID: '', modelID: '' },
        parts: [{ type: 'text' as const, text: text.trim() }]
      }
      addMessage(serverId, sessionId, optimisticMessage)

      // Send to server
      await client.session.prompt({
        path: { id: sessionId },
        body: {
          model,
          parts: [{ type: 'text', text: text.trim() }]
        }
      })

      setText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }, [text, client, isSending, serverId, sessionId, model, addMessage])

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        multiline
        maxLength={4000}
      />
      <Pressable
        onPress={sendMessage}
        disabled={!text.trim() || isSending}
        style={[
          styles.sendButton,
          (!text.trim() || isSending) && styles.sendButtonDisabled
        ]}
      >
        <Text style={styles.sendButtonText}>
          {isSending ? '...' : 'Send'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  input: {
    flex: 1,
    maxHeight: 100,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 20
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af'
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600'
  }
})
```

### Message Bubble Component

```typescript
// components/chat/message-bubble.tsx
import { View, Text, StyleSheet } from 'react-native'
import type { MessageWithSync } from '@/stores/messages-store'

interface MessageBubbleProps {
  message: MessageWithSync
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const content = message.streamingContent || 
    message.parts
      ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('') || ''

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {content}
        </Text>
        {message.isStreaming && (
          <Text style={styles.streamingIndicator}>...</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  userContainer: {
    alignItems: 'flex-end'
  },
  assistantContainer: {
    alignItems: 'flex-start'
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4
  },
  text: {
    fontSize: 16,
    lineHeight: 22
  },
  userText: {
    color: 'white'
  },
  assistantText: {
    color: '#1f2937'
  },
  streamingIndicator: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4
  }
})
```

---

## 7. Mobile-Specific Considerations

### Background/Foreground Handling

```typescript
// hooks/use-app-state.ts
import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useAppState(
  onForeground?: () => void,
  onBackground?: () => void
) {
  const appStateRef = useRef<AppStateStatus>('active')

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        onForeground?.()
      } else if (appStateRef.current === 'active' && nextAppState !== 'active') {
        onBackground?.()
      }
      
      appStateRef.current = nextAppState
    })

    return () => subscription.remove()
  }, [onForeground, onBackground])

  return appStateRef.current
}
```

### Network Status

```typescript
// hooks/use-network-status.ts
import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [connectionType, setConnectionType] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected)
      setConnectionType(state.type)
    })

    return () => unsubscribe()
  }, [])

  return { isConnected, connectionType }
}
```

### Keyboard Handling

```typescript
// hooks/use-keyboard.ts
import { useEffect, useState } from 'react'
import { Keyboard, KeyboardEvent } from 'react-native'

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsVisible(true)
      }
    )
    
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
        setIsVisible(false)
      }
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  return { keyboardHeight, isVisible }
}
```

### Reconnection Logic

```typescript
// hooks/use-reconnection.ts
import { useEffect, useRef, useCallback } from 'react'
import { useNetworkStatus } from './use-network-status'
import { useAppState } from './use-app-state'

export function useReconnection(
  isConnected: boolean,
  reconnect: () => void,
  options: {
    maxRetries?: number
    retryDelay?: number
    enabled?: boolean
  } = {}
) {
  const { maxRetries = 5, retryDelay = 3000, enabled = true } = options
  const { isConnected: isNetworkConnected } = useNetworkStatus()
  
  const retryCountRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const attemptReconnect = useCallback(() => {
    if (!enabled || isConnected || !isNetworkConnected) return
    if (retryCountRef.current >= maxRetries) return

    retryCountRef.current++
    reconnect()

    timeoutRef.current = setTimeout(() => {
      if (!isConnected) {
        attemptReconnect()
      } else {
        retryCountRef.current = 0
      }
    }, retryDelay * retryCountRef.current) // Exponential backoff
  }, [enabled, isConnected, isNetworkConnected, reconnect, maxRetries, retryDelay])

  // Reconnect when network comes back
  useEffect(() => {
    if (isNetworkConnected && !isConnected) {
      attemptReconnect()
    }
  }, [isNetworkConnected, isConnected, attemptReconnect])

  // Reset retry count on successful connection
  useEffect(() => {
    if (isConnected) {
      retryCountRef.current = 0
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isConnected])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    retryCount: retryCountRef.current,
    isReconnecting: retryCountRef.current > 0 && !isConnected
  }
}
```

---

## 8. Performance Optimization

### Virtualized Message List

```typescript
// components/chat/message-list.tsx
import { useCallback } from 'react'
import { LegendList } from '@legendapp/list'
import { MessageBubble } from './message-bubble'
import { useMessagesStore } from '@/stores/messages-store'

interface MessageListProps {
  serverId: string
  sessionId: string
}

export function MessageList({ serverId, sessionId }: MessageListProps) {
  const messages = useMessagesStore(
    useCallback(
      (state) => state.getSessionMessages(serverId, sessionId),
      [serverId, sessionId]
    )
  )

  return (
    <LegendList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      estimatedItemSize={80}
      maintainVisibleContentPosition
      contentInsetAdjustmentBehavior="automatic"
    />
  )
}
```

### Optimized Session Card

```typescript
// components/session/session-card.tsx
import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

interface SessionCardProps {
  id: string
  serverId: string
  title: string
  updatedAt: number
}

// Memoize to prevent re-renders when list updates
export const SessionCard = memo(function SessionCard({
  id,
  serverId,
  title,
  updatedAt
}: SessionCardProps) {
  return (
    <Link href={`/server/${serverId}/session/${id}`} asChild>
      <Pressable style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{formatTime(updatedAt)}</Text>
      </Pressable>
    </Link>
  )
})

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '600'
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  }
})
```

### Image Optimization

```typescript
// components/ui/optimized-image.tsx
import { Image } from 'expo-image'

interface OptimizedImageProps {
  uri: string
  width: number
  height: number
}

export function OptimizedImage({ uri, width, height }: OptimizedImageProps) {
  // Request 2x size for retina displays
  const highResUri = `${uri}?w=${width * 2}&h=${height * 2}&fit=cover`

  return (
    <Image
      source={{ uri: highResUri }}
      style={{ width, height }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
    />
  )
}
```

---

## 9. Complete Example

### Chat Screen

```typescript
// app/server/[id]/session/[sessionId].tsx
import { View, StyleSheet } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useMessagesStore } from '@/stores/messages-store'
import { MessageList } from '@/components/chat/message-list'
import { Composer } from '@/components/chat/composer'
import { useServerConfig } from '@/hooks/use-server-config'

export default function ChatScreen() {
  const { id: serverId, sessionId } = useLocalSearchParams<{
    id: string
    sessionId: string
  }>()

  const { isStreaming } = useSessionStream(serverId, sessionId)
  const { data: config } = useServerConfig(serverId)
  
  const messages = useMessagesStore((state) =>
    state.getSessionMessages(serverId, sessionId)
  )

  const defaultModel = config?.model
    ? {
        providerID: config.model.split('/')[0],
        modelID: config.model.split('/')[1]
      }
    : undefined

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: messages.length > 0 
            ? `Chat (${messages.length})` 
            : 'Chat',
          headerLargeTitle: false
        }}
      />
      
      <MessageList serverId={serverId} sessionId={sessionId} />
      
      <Composer
        serverId={serverId}
        sessionId={sessionId}
        model={defaultModel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
```

### Root Layout with Providers

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 2
    }
  }
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="server" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
```

---

## Summary

### Key Best Practices

1. **State Management**
   - Use Zustand for client-side state (servers, sessions, messages)
   - Use React Query for server state
   - Separate optimistic updates from server confirmations

2. **Real-time Updates**
   - Use SSE streams for live message updates
   - Handle app background/foreground transitions
   - Implement reconnection logic with exponential backoff

3. **Performance**
   - Use LegendList/FlashList for message lists
   - Memoize list items to prevent unnecessary re-renders
   - Pass primitives to list items, not objects

4. **Mobile UX**
   - Handle keyboard appearance/disappearance
   - Respect safe areas with `contentInsetAdjustmentBehavior`
   - Show loading states and connection status

5. **Error Handling**
   - Handle network errors gracefully
   - Implement offline detection
   - Show user-friendly error messages

6. **Security**
   - Store server credentials securely
   - Use HTTPS for production servers
   - Implement proper auth flows

### Recommended Libraries

- **State**: Zustand + React Query
- **Lists**: LegendList or FlashList
- **Images**: expo-image
- **Storage**: AsyncStorage (non-sensitive), SecureStore (sensitive)
- **Network**: @react-native-community/netinfo
- **Navigation**: Expo Router
- **UI**: React Native built-in components + custom styling

### Next Steps

1. Set up Expo project with dependencies
2. Implement server connection management
3. Build session browser with virtualized lists
4. Create chat interface with real-time streaming
5. Add settings and configuration screens
6. Implement offline support and error handling
7. Add polish: animations, haptics, native UI elements
