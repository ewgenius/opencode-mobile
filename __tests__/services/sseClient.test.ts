import { SSEClient, createSseClient, parseSSEData } from '../../services/sseClient';

describe('SSEClient', () => {
  let client: SSEClient;
  let mockXhr: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock XMLHttpRequest for each test
    mockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      abort: jest.fn(),
      readyState: 4,
      status: 200,
      statusText: 'OK',
      responseText: '',
      onprogress: null,
      onreadystatechange: null,
      onerror: null,
    };

    (global.XMLHttpRequest as unknown as jest.Mock).mockImplementation(() => mockXhr);
  });

  describe('constructor', () => {
    it('should create client with default options', () => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
      });

      expect(client).toBeInstanceOf(SSEClient);
    });

    it('should merge options with defaults', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();
      const onClose = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
        onError,
        onClose,
        retryDelay: 2000,
        maxRetries: 5,
      });

      expect(client).toBeInstanceOf(SSEClient);
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
      });
    });

    it('should open XMLHttpRequest connection', () => {
      client.connect();

      expect(mockXhr.open).toHaveBeenCalledWith('GET', 'http://localhost:8080/events', true);
    });

    it('should set required headers', () => {
      client.connect();

      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Accept', 'text/event-stream');
      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    });

    it('should set custom headers', () => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      });

      client.connect();

      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token123');
      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
    });

    it('should send the request', () => {
      client.connect();

      expect(mockXhr.send).toHaveBeenCalled();
    });

    it('should throw if client is closed', () => {
      client.close();

      expect(() => client.connect()).toThrow('SSE client has been closed');
    });
  });

  describe('event parsing', () => {
    it('should parse simple message event', done => {
      const onMessage = jest.fn(event => {
        expect(event.data).toBe('Hello, World!');
        done();
      });

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
      });

      client.connect();

      // Simulate receiving data
      mockXhr.responseText = 'data: Hello, World!\n\n';
      if (mockXhr.onprogress) {
        mockXhr.onprogress();
      }
    });

    it('should parse event with id', done => {
      const onMessage = jest.fn(event => {
        expect(event.id).toBe('123');
        expect(event.data).toBe('Test message');
        done();
      });

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
      });

      client.connect();

      mockXhr.responseText = 'id: 123\ndata: Test message\n\n';
      if (mockXhr.onprogress) {
        mockXhr.onprogress();
      }
    });

    it('should parse event with type', done => {
      const onMessage = jest.fn(event => {
        expect(event.event).toBe('user-message');
        expect(event.data).toBe('Hello');
        done();
      });

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
      });

      client.connect();

      mockXhr.responseText = 'event: user-message\ndata: Hello\n\n';
      if (mockXhr.onprogress) {
        mockXhr.onprogress();
      }
    });

    it('should handle multi-line data', done => {
      const onMessage = jest.fn(event => {
        expect(event.data).toBe('Line 1\nLine 2\nLine 3');
        done();
      });

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
      });

      client.connect();

      mockXhr.responseText = 'data: Line 1\ndata: Line 2\ndata: Line 3\n\n';
      if (mockXhr.onprogress) {
        mockXhr.onprogress();
      }
    });

    it('should parse multiple events', () => {
      const onMessage = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage,
      });

      client.connect();

      mockXhr.responseText = 'data: First event\n\ndata: Second event\n\n';
      if (mockXhr.onprogress) {
        mockXhr.onprogress();
      }

      expect(onMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('connection handling', () => {
    beforeEach(() => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
      });
    });

    it('should handle successful connection close', async () => {
      const onClose = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onClose,
      });

      client.connect();

      mockXhr.readyState = 4;
      mockXhr.status = 200;
      if (mockXhr.onreadystatechange) {
        mockXhr.onreadystatechange();
      }

      // Wait a tick for async callback
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle connection error', async () => {
      const onError = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onError,
        maxRetries: 0, // Disable retries for this test
      });

      client.connect();

      mockXhr.readyState = 4;
      mockXhr.status = 500;
      mockXhr.statusText = 'Internal Server Error';
      if (mockXhr.onreadystatechange) {
        mockXhr.onreadystatechange();
      }

      // Wait a tick for async callback
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toContain('failed');
    });

    it('should handle XHR error event', async () => {
      const onError = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onError,
        maxRetries: 0,
      });

      client.connect();

      if (mockXhr.onerror) {
        mockXhr.onerror();
      }

      // Wait a tick for async callback
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toBe('SSE connection error');
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on error', () => {
      const onError = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onError,
        retryDelay: 1000,
        maxRetries: 3,
      });

      client.connect();

      // Trigger error
      if (mockXhr.onerror) {
        mockXhr.onerror();
      }

      expect(onError).toHaveBeenCalled();

      // Fast-forward past retry delay
      jest.advanceTimersByTime(1000);

      // Should have attempted to reconnect
      expect(mockXhr.open).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after maxRetries', () => {
      const onError = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onError,
        retryDelay: 100,
        maxRetries: 2,
      });

      client.connect();

      // Trigger errors multiple times
      for (let i = 0; i < 5; i++) {
        if (mockXhr.onerror) {
          mockXhr.onerror();
        }
        jest.advanceTimersByTime(100);
      }

      // Should have attempted initial + 2 retries = 3 total
      expect(mockXhr.open).toHaveBeenCalledTimes(3);
    });

    it('should not retry if client is closed', () => {
      const onError = jest.fn();

      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
        onError,
        retryDelay: 1000,
        maxRetries: 3,
      });

      client.connect();

      // Close the client
      client.close();

      // Trigger error
      if (mockXhr.onerror) {
        mockXhr.onerror();
      }

      // Fast-forward past retry delay
      jest.advanceTimersByTime(1000);

      // Should not have retried
      expect(mockXhr.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
      });

      client.connect();
    });

    it('should abort XMLHttpRequest', () => {
      client.close();

      expect(mockXhr.abort).toHaveBeenCalled();
    });

    it('should clear reconnect timeout', () => {
      client.close();

      // Should not throw when closing
      expect(() => client.close()).not.toThrow();
    });

    it('should prevent further reconnects', () => {
      client.close();

      // Manually trigger error after close
      if (mockXhr.onerror) {
        mockXhr.onerror();
      }

      // Should not attempt to reconnect
      expect(mockXhr.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('isConnected', () => {
    beforeEach(() => {
      client = new SSEClient({
        url: 'http://localhost:8080/events',
        onMessage: jest.fn(),
      });
    });

    it('should return false before connection', () => {
      expect(client.isConnected).toBe(false);
    });

    it('should return true when connection is loading', () => {
      client.connect();

      // Get the actual XHR instance created by the client
      const clientXhr = (client as any).xhr;
      clientXhr.readyState = 3; // LOADING

      expect(client.isConnected).toBe(true);
    });

    it('should return false after connection closes', () => {
      client.connect();

      // Get the actual XHR instance created by the client
      const clientXhr = (client as any).xhr;
      clientXhr.readyState = 4; // DONE

      expect(client.isConnected).toBe(false);
    });
  });
});

describe('createSseClient', () => {
  it('should be a factory function', () => {
    expect(typeof createSseClient).toBe('function');
  });

  it('should create SSEClient instance', () => {
    const client = createSseClient({
      url: 'http://localhost:8080/events',
      onMessage: jest.fn(),
    });

    expect(client).toBeInstanceOf(SSEClient);
  });
});

describe('parseSSEData', () => {
  it('should parse valid JSON', () => {
    const event = { data: '{"key": "value", "number": 123}' };
    const result = parseSSEData(event);

    expect(result).toEqual({ key: 'value', number: 123 });
  });

  it('should return null for invalid JSON', () => {
    const event = { data: 'not valid json' };
    const result = parseSSEData(event);

    expect(result).toBeNull();
  });

  it('should handle empty data', () => {
    const event = { data: '' };
    const result = parseSSEData(event);

    expect(result).toBeNull();
  });

  it('should parse arrays', () => {
    const event = { data: '[1, 2, 3]' };
    const result = parseSSEData<number[]>(event);

    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse nested objects', () => {
    const event = { data: '{"nested": {"key": "value"}}' };
    const result = parseSSEData(event);

    expect(result).toEqual({ nested: { key: 'value' } });
  });
});
