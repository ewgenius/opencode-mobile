/**
 * SSE Client Service
 *
 * React Native compatible Server-Sent Events client using XMLHttpRequest.
 * Provides event stream parsing, connection management, and error handling.
 */

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;
export type SSEErrorHandler = (error: Error) => void;
export type SSECloseHandler = () => void;

export interface SSEClientOptions {
  url: string;
  headers?: Record<string, string>;
  onMessage?: SSEEventHandler;
  onError?: SSEErrorHandler;
  onClose?: SSECloseHandler;
  retryDelay?: number;
  maxRetries?: number;
}

export class SSEClient {
  private xhr: XMLHttpRequest | null = null;
  private options: SSEClientOptions;
  private retryCount = 0;
  private buffer = '';
  private isClosed = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SSEClientOptions) {
    this.options = {
      retryDelay: 1000,
      maxRetries: 3,
      ...options,
    };
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.isClosed) {
      throw new Error('SSE client has been closed');
    }

    this.xhr = new XMLHttpRequest();
    this.buffer = '';

    this.xhr.open('GET', this.options.url, true);
    this.xhr.setRequestHeader('Accept', 'text/event-stream');
    this.xhr.setRequestHeader('Cache-Control', 'no-cache');

    // Set custom headers
    if (this.options.headers) {
      Object.entries(this.options.headers).forEach(([key, value]) => {
        this.xhr?.setRequestHeader(key, value);
      });
    }

    this.xhr.onprogress = () => {
      if (!this.xhr) return;

      const newData = this.xhr.responseText.substring(this.buffer.length);
      this.buffer = this.xhr.responseText;

      if (newData) {
        this.parseEvents(newData);
      }
    };

    this.xhr.onreadystatechange = () => {
      if (!this.xhr) return;

      if (this.xhr.readyState === XMLHttpRequest.DONE) {
        if (this.xhr.status === 200) {
          // Connection completed normally
          this.options.onClose?.();
        } else {
          // Connection error
          const error = new Error(
            `SSE connection failed: ${this.xhr.status} ${this.xhr.statusText}`
          );
          this.handleError(error);
        }
      }
    };

    this.xhr.onerror = () => {
      const error = new Error('SSE connection error');
      this.handleError(error);
    };

    this.xhr.send();
  }

  /**
   * Parse SSE formatted events from data
   */
  private parseEvents(data: string): void {
    const lines = data.split('\n');
    let currentEvent: Partial<SSEEvent> = {};

    for (const line of lines) {
      if (line.startsWith('id:')) {
        currentEvent.id = line.substring(3).trim();
      } else if (line.startsWith('event:')) {
        currentEvent.event = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const dataValue = line.substring(5).trim();
        if (currentEvent.data) {
          currentEvent.data += '\n' + dataValue;
        } else {
          currentEvent.data = dataValue;
        }
      } else if (line === '' && currentEvent.data !== undefined) {
        // End of event
        this.options.onMessage?.(currentEvent as SSEEvent);
        currentEvent = {};
      }
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleError(error: Error): void {
    this.options.onError?.(error);

    if (this.retryCount < (this.options.maxRetries || 0) && !this.isClosed) {
      this.retryCount++;
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.options.retryDelay);
    }
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    this.isClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }

  /**
   * Check if the connection is active
   */
  get isConnected(): boolean {
    return this.xhr !== null && this.xhr.readyState === XMLHttpRequest.LOADING;
  }
}

/**
 * Create an SSE client instance
 */
export function createSseClient(options: SSEClientOptions): SSEClient {
  return new SSEClient(options);
}

/**
 * Parse SSE event data as JSON
 */
export function parseSSEData<T>(event: SSEEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}
