/**
 * OpenCode API Service
 *
 * Service layer wrapping @opencode-ai/sdk for communicating with opencode servers.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import type { Server } from '@/stores';

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
  async getMessages(sessionId: string): Promise<
    Array<{
      id: string;
      sessionId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      agent?: string;
      model?: string;
      timestamp: number;
    }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientAny = this.client as any;
    const response = await clientAny.session?.get?.({
      path: { id: sessionId },
    });

    const data = response?.data || response;
    const messages: Array<{
      id: string;
      sessionId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      agent?: string;
      model?: string;
      timestamp: number;
    }> = [];

    if (data?.messages && Array.isArray(data.messages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const msg of data.messages) {
        const content = this.extractMessageContent(msg);
        messages.push({
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          role: (msg.role as 'user' | 'assistant' | 'system') || 'assistant',
          content,
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
}

/**
 * Create an API client instance for a server
 */
export function createApiClient(server: Server): OpencodeApi {
  return new OpencodeApi(server);
}
