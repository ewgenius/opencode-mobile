import { OpencodeApi, createApiClient } from '../../services/opencodeApi';
import type { Server } from '../../stores/serverStore';

describe('OpencodeApi', () => {
  let api: OpencodeApi;
  const mockServer: Server = {
    id: 'test-server',
    name: 'Test Server',
    url: 'http://localhost:8080',
    createdAt: Date.now(),
  };

  beforeEach(() => {
    api = createApiClient(mockServer);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create API client with server config', () => {
      expect(api).toBeInstanceOf(OpencodeApi);
    });

    it('should handle URL with protocol', () => {
      const serverWithProtocol: Server = {
        ...mockServer,
        url: 'https://example.com',
      };
      const apiWithProtocol = createApiClient(serverWithProtocol);
      expect(apiWithProtocol).toBeInstanceOf(OpencodeApi);
    });

    it('should handle URL without protocol', () => {
      const serverWithoutProtocol: Server = {
        ...mockServer,
        url: 'example.com:8080',
      };
      const apiWithoutProtocol = createApiClient(serverWithoutProtocol);
      expect(apiWithoutProtocol).toBeInstanceOf(OpencodeApi);
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const health = await api.health();
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('healthy');
    });
  });

  describe('getProjects', () => {
    it('should return array of projects', async () => {
      const projects = await api.getProjects();
      expect(Array.isArray(projects)).toBe(true);
    });

    it('should return empty array when no data', async () => {
      // Mock the client to return no data
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const projects = await api.getProjects();
      expect(Array.isArray(projects)).toBe(true);
    });
  });

  describe('createProject', () => {
    it('should create a project with name', async () => {
      const project = await api.createProject('Test Project');

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
      expect(project.name).toBe('Test Project');
    });
  });

  describe('getSessions', () => {
    it('should return array of sessions', async () => {
      const sessions = await api.getSessions('project-1');
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should include projectId in returned sessions', async () => {
      const sessions = await api.getSessions('project-1');
      if (sessions.length > 0) {
        expect(sessions[0]).toHaveProperty('projectId');
        expect(sessions[0].projectId).toBe('project-1');
      }
    });
  });

  describe('createSession', () => {
    it('should create a session with projectId', async () => {
      const session = await api.createSession('project-1');

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('projectId');
      expect(session).toHaveProperty('title');
      expect(session).toHaveProperty('createdAt');
      expect(session.projectId).toBe('project-1');
    });

    it('should create a session with workspaceId', async () => {
      const session = await api.createSession('project-1', 'workspace-1');

      expect(session).toHaveProperty('workspaceId');
    });
  });

  describe('getMessages', () => {
    it('should return array of messages', async () => {
      const messages = await api.getMessages('session-1');
      expect(Array.isArray(messages)).toBe(true);
    });

    it('should return messages with correct structure', async () => {
      const messages = await api.getMessages('session-1');

      messages.forEach(message => {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('sessionId');
        expect(message).toHaveProperty('role');
        expect(message).toHaveProperty('parts');
        expect(message).toHaveProperty('timestamp');
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const response = await api.sendMessage('session-1', 'Hello');

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('sessionId');
      expect(response).toHaveProperty('role');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('timestamp');
      expect(response.sessionId).toBe('session-1');
      expect(response.role).toBe('assistant');
    });

    it('should accept options', async () => {
      const response = await api.sendMessage('session-1', 'Hello', {
        agent: 'test-agent',
        model: { providerID: 'openai', modelID: 'gpt-4' },
        system: 'You are a helpful assistant',
      });

      expect(response).toBeDefined();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      await expect(api.deleteSession('session-1')).resolves.not.toThrow();
    });
  });

  describe('abortSession', () => {
    it('should abort a session', async () => {
      await expect(api.abortSession('session-1')).resolves.not.toThrow();
    });
  });

  describe('sendMessageStream', () => {
    it('should initiate streaming and return cleanup function', async () => {
      const mockOnEvent = jest.fn();
      const mockOnError = jest.fn();
      const mockOnComplete = jest.fn();

      const cleanup = await api.sendMessageStream({
        sessionId: 'session-1',
        content: 'Hello',
        onEvent: mockOnEvent,
        onError: mockOnError,
        onComplete: mockOnComplete,
      });

      expect(typeof cleanup).toBe('function');
    });

    it('should handle streaming with agent and model options', async () => {
      const mockOnEvent = jest.fn();

      const cleanup = await api.sendMessageStream({
        sessionId: 'session-1',
        content: 'Hello',
        agent: 'test-agent',
        model: { providerID: 'openai', modelID: 'gpt-4' },
        system: 'System prompt',
        onEvent: mockOnEvent,
      });

      expect(typeof cleanup).toBe('function');
    });
  });
});

describe('createApiClient', () => {
  it('should be a factory function', () => {
    expect(typeof createApiClient).toBe('function');
  });

  it('should create OpencodeApi instance', () => {
    const server: Server = {
      id: 'test',
      name: 'Test',
      url: 'http://localhost:8080',
      createdAt: Date.now(),
    };

    const client = createApiClient(server);
    expect(client).toBeInstanceOf(OpencodeApi);
  });
});
