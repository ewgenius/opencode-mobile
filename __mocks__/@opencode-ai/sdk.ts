export const createOpencodeClient = jest.fn(() => ({
  global: {
    health: jest.fn().mockResolvedValue({
      data: { version: '1.0.0', healthy: true },
    }),
  },
  project: {
    list: jest.fn().mockResolvedValue({
      data: [
        { id: 'proj-1', name: 'Project 1', time: { created: Date.now(), updated: Date.now() } },
      ],
    }),
    create: jest.fn().mockResolvedValue({
      data: { id: 'proj-new', name: 'New Project', time: { created: Date.now() } },
    }),
  },
  session: {
    list: jest.fn().mockResolvedValue({
      data: [{ id: 'session-1', title: 'Session 1', time: { created: Date.now() } }],
    }),
    create: jest.fn().mockResolvedValue({
      data: { id: 'session-new', title: 'New Session', time: { created: Date.now() } },
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'session-1',
        messages: [],
      },
    }),
    prompt: jest.fn().mockResolvedValue({
      data: {
        id: 'response-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hello' }],
      },
    }),
    prompt_async: jest.fn().mockResolvedValue({
      data: { success: true },
    }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    abort: jest.fn().mockResolvedValue({ success: true }),
  },
  event: {
    subscribe: jest.fn(() => jest.fn()),
  },
}));
