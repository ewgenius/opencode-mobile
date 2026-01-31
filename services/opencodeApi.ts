/**
 * OpenCode API Service
 *
 * Service layer wrapping @opencode-ai/sdk for communicating with opencode servers.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import type { Server } from '@/stores';
import type { MessageWithParts, Part, TextPart } from '@/types/messageParts';

// Streaming event types
export type StreamingEvent =
  | MessageCreatedEvent
  | PartCreatedEvent
  | PartUpdatedEvent
  | MessageCompletedEvent
  | StreamErrorEvent;

export interface MessageCreatedEvent {
  type: 'message.created';
  messageID: string;
  sessionID: string;
  role: 'assistant';
}

export interface PartCreatedEvent {
  type: 'part.created';
  partID: string;
  messageID: string;
  sessionID: string;
  partType: string;
}

export interface PartUpdatedEvent {
  type: 'part.updated';
  partID: string;
  messageID: string;
  sessionID: string;
  delta: {
    text?: string;
  };
}

export interface MessageCompletedEvent {
  type: 'message.completed';
  messageID: string;
  sessionID: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
  code?: string;
}

export type StreamEventHandler = (event: StreamingEvent) => void;

export interface StreamMessageOptions {
  sessionId: string;
  content: string;
  agent?: string;
  model?: { providerID: string; modelID: string };
  system?: string;
  onEvent: StreamEventHandler;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export class OpencodeApi {
  private client: ReturnType<typeof createOpencodeClient>;
  private server: Server;

  constructor(server: Server) {
    this.server = server;
    this.client = createOpencodeClient({
      baseUrl: this.getBaseUrl(),
      throwOnError: true,
    });
  }

  private getBaseUrl(): string {
    const { url } = this.server;
    // If url already includes protocol, use it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise assume http
    return `http://${url}`;
  }

  /**
   * Check server health
   */
  async health(): Promise<{ version: string; healthy: boolean }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.global?.health?.();
    if (response?.data) {
      return response.data;
    }
    // Fallback if health endpoint doesn't exist
    return { version: 'unknown', healthy: true };
  }

  /**
   * Get all projects from the server
   */
  async getProjects(): Promise<
    Array<{
      id: string;
      name: string;
      path?: string;
      createdAt: number;
      updatedAt: number;
    }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.project?.list?.();

    if (!response?.data) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((project: any) => ({
      id: project.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: project.name || 'Untitled Project',
      path: project.path,
      createdAt: project.time?.created || Date.now(),
      updatedAt: project.time?.updated || project.time?.created || Date.now(),
    }));
  }

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<{
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.project?.create?.({
      body: { name },
    });

    const data = response?.data || response;
    return {
      id: data?.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data?.name || name,
      createdAt: data?.time?.created || Date.now(),
      updatedAt: data?.time?.updated || data?.time?.created || Date.now(),
    };
  }

  /**
   * Get all sessions for a project
   */
  async getSessions(projectId: string): Promise<
    Array<{
      id: string;
      projectId: string;
      title: string;
      workspaceId?: string;
      createdAt: number;
      updatedAt: number;
    }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.session?.list?.();

    if (!response?.data) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((session: any) => ({
      id: session.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId, // SDK session doesn't have projectId, we associate it
      title: session.title || 'Untitled Session',
      workspaceId: session.parentID,
      createdAt: session.time?.created || Date.now(),
      updatedAt: session.time?.updated || session.time?.created || Date.now(),
    }));
  }

  /**
   * Create a new session
   */
  async createSession(
    projectId: string,
    workspaceId?: string
  ): Promise<{
    id: string;
    projectId: string;
    title: string;
    workspaceId?: string;
    createdAt: number;
    updatedAt: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.session?.create?.({
      body: {
        title: 'New Session',
        parentID: workspaceId,
      },
    });

    const data = response?.data || response;
    return {
      id: data?.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: data?.title || 'New Session',
      workspaceId: data?.parentID,
      createdAt: data?.time?.created || Date.now(),
      updatedAt: data?.time?.updated || data?.time?.created || Date.now(),
    };
  }

  /**
   * Get all messages for a session
   */
  async getMessages(sessionId: string): Promise<MessageWithParts[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.session?.get?.({
      path: { id: sessionId },
    });

    const data = response?.data || response;
    const messages: MessageWithParts[] = [];

    if (data?.messages && Array.isArray(data.messages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const msg of data.messages) {
        const parts = this.extractMessageParts(msg, sessionId);
        messages.push({
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          role: (msg.role as 'user' | 'assistant' | 'system') || 'assistant',
          parts,
          agent: msg.agent,
          model: msg.modelID,
          timestamp: msg.time?.created || Date.now(),
        });
      }
    }

    return messages;
  }

  /**
   * Send a message to a session
   */
  async sendMessage(
    sessionId: string,
    content: string,
    options?: {
      agent?: string;
      model?: { providerID: string; modelID: string };
      system?: string;
    }
  ): Promise<{
    id: string;
    sessionId: string;
    role: 'assistant';
    content: string;
    agent?: string;
    model?: string;
    timestamp: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.session?.prompt?.({
      path: { id: sessionId },
      body: {
        agent: options?.agent || 'default',
        model: options?.model,
        system: options?.system,
        parts: [{ type: 'text', text: content }],
      },
    });

    // Extract the assistant's response content
    const data = response?.data || response;
    const responseContent = this.extractResponseContent(data);

    return {
      id: `msg_${Date.now()}`,
      sessionId,
      role: 'assistant',
      content: responseContent,
      agent: options?.agent,
      model: options?.model?.modelID,
      timestamp: Date.now(),
    };
  }

  /**
   * Extract content from SDK message format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractMessageContent(msg: any): string {
    if (msg?.parts && Array.isArray(msg.parts)) {
      return (
        msg.parts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((part: any) => {
            if (part?.type === 'text') return part.text || '';
            if (part?.type === 'tool') return `[Tool: ${part.name}]`;
            return '';
          })
          .join('')
      );
    }
    return msg?.content || msg?.text || '';
  }

  /**
   * Extract content from SDK prompt response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractResponseContent(response: any): string {
    if (response?.parts && Array.isArray(response.parts)) {
      return (
        response.parts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((part: any) => {
            if (part?.type === 'text') return part.text || '';
            if (part?.type === 'tool') return `[Tool: ${part.name}]`;
            return '';
          })
          .join('')
      );
    }
    return response?.content || response?.text || '';
  }

  /**
   * Extract parts from SDK message format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractMessageParts(msg: any, sessionId: string): Part[] {
    const messageId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (msg?.parts && Array.isArray(msg.parts)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return msg.parts.map((part: any, index: number) => {
        const basePart = {
          id: part.id || `${messageId}-part-${index}`,
          sessionID: sessionId,
          messageID: messageId,
        };

        switch (part?.type) {
          case 'text':
            return {
              ...basePart,
              type: 'text' as const,
              text: part.text || '',
            };
          case 'reasoning':
            return {
              ...basePart,
              type: 'reasoning' as const,
              text: part.text || '',
              time: part.time,
            };
          case 'tool':
            return {
              ...basePart,
              type: 'tool' as const,
              tool: part.tool || part.name || 'unknown',
              state: part.state || { input: {}, output: {}, status: 'pending' },
            };
          case 'patch':
            return {
              ...basePart,
              type: 'patch' as const,
              files: part.files || [],
            };
          case 'agent':
            return {
              ...basePart,
              type: 'agent' as const,
              name: part.name || 'unknown',
            };
          default:
            // Fallback to text for unknown types
            return {
              ...basePart,
              type: 'text' as const,
              text: part.text || JSON.stringify(part),
            };
        }
      });
    }

    // Fallback: if no parts, create a single text part from content
    return [
      {
        id: `${messageId}-part-0`,
        type: 'text',
        sessionID: sessionId,
        messageID: messageId,
        text: msg?.content || msg?.text || '',
      },
    ];
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    await clientAny.session?.delete?.({
      path: { id: sessionId },
    });
  }

  /**
   * Abort a running session
   */
  async abortSession(sessionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    await clientAny.session?.abort?.({
      path: { id: sessionId },
    });
  }

  /**
   * Send a message with streaming response
   */
  async sendMessageStream(options: StreamMessageOptions): Promise<() => void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const { sessionId, content, agent, model, system, onEvent, onError, onComplete } = options;

    // Subscribe to events first
    let unsubscribe: (() => void) | null = null;

    try {
      // Subscribe to server events
      if (clientAny.event?.subscribe) {
        unsubscribe = clientAny.event.subscribe((event: unknown) => {
          const serverEvent = event as Record<string, unknown>;
          const eventType = serverEvent.type as string;

          switch (eventType) {
            case 'message.created': {
              const messageEvent: MessageCreatedEvent = {
                type: 'message.created',
                messageID: (serverEvent.messageID as string) || '',
                sessionID: (serverEvent.sessionID as string) || sessionId,
                role: 'assistant',
              };
              onEvent(messageEvent);
              break;
            }

            case 'part.created': {
              const partEvent: PartCreatedEvent = {
                type: 'part.created',
                partID: (serverEvent.partID as string) || '',
                messageID: (serverEvent.messageID as string) || '',
                sessionID: (serverEvent.sessionID as string) || sessionId,
                partType: (serverEvent.partType as string) || 'text',
              };
              onEvent(partEvent);
              break;
            }

            case 'part.updated': {
              const updateEvent: PartUpdatedEvent = {
                type: 'part.updated',
                partID: (serverEvent.partID as string) || '',
                messageID: (serverEvent.messageID as string) || '',
                sessionID: (serverEvent.sessionID as string) || sessionId,
                delta: (serverEvent.delta as { text?: string }) || { text: '' },
              };
              onEvent(updateEvent);
              break;
            }

            case 'message.completed': {
              const completedEvent: MessageCompletedEvent = {
                type: 'message.completed',
                messageID: (serverEvent.messageID as string) || '',
                sessionID: (serverEvent.sessionID as string) || sessionId,
              };
              onEvent(completedEvent);
              onComplete?.();
              break;
            }

            case 'error': {
              const errorEvent: StreamErrorEvent = {
                type: 'error',
                error: (serverEvent.error as string) || 'Unknown error',
                code: serverEvent.code as string | undefined,
              };
              onEvent(errorEvent);
              onError?.(new Error(errorEvent.error));
              break;
            }

            default:
              // Unknown event type, ignore or log
              break;
          }
        });
      }

      // Send the message with prompt_async option
      await clientAny.session?.prompt_async?.({
        path: { id: sessionId },
        body: {
          agent: agent || 'default',
          model,
          system,
          parts: [{ type: 'text', text: content }],
        },
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      // Return cleanup function even on error
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

/**
 * Create an API client instance for a server
 */
export function createApiClient(server: Server): OpencodeApi {
  return new OpencodeApi(server);
}
