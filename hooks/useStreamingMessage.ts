/**
 * Streaming Message Hook
 *
 * Hook for sending messages with streaming responses.
 * Provides optimistic user messages, streaming assistant message state,
 * and stream cancellation support.
 */

import { useState, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { useSessionStore } from '@/stores';
import type {
  StreamingEvent,
  MessageCreatedEvent,
  PartCreatedEvent,
  PartUpdatedEvent,
  MessageCompletedEvent,
  StreamErrorEvent,
} from '@/services/opencodeApi';
import type { MessageWithParts, Part, TextPart } from '@/types/messageParts';

export interface StreamingState {
  isStreaming: boolean;
  isLoading: boolean;
  streamingMessage: MessageWithParts | null;
  error: Error | null;
}

export interface UseStreamingMessageResult extends StreamingState {
  sendMessage: (
    sessionId: string,
    content: string,
    options?: {
      agent?: string;
      model?: { providerID: string; modelID: string };
    }
  ) => Promise<void>;
  cancelStream: () => void;
  reset: () => void;
}

export function useStreamingMessage(): UseStreamingMessageResult {
  const { client } = useApi();
  const addMessage = useSessionStore(state => state.addMessage);
  const updateMessage = useSessionStore(state => state.updateMessage);

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    isLoading: false,
    streamingMessage: null,
    error: null,
  });

  const cleanupRef = useRef<(() => void) | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const partsRef = useRef<Map<string, Part>>(new Map());

  const reset = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setState({
      isStreaming: false,
      isLoading: false,
      streamingMessage: null,
      error: null,
    });
    currentSessionIdRef.current = null;
    streamingMessageIdRef.current = null;
    partsRef.current.clear();
  }, []);

  const cancelStream = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // If we have a streaming message in progress, we should remove it
    if (currentSessionIdRef.current && streamingMessageIdRef.current) {
      // The streaming message was never saved to the store, so we just clear local state
    }

    setState(prev => ({
      ...prev,
      isStreaming: false,
      isLoading: false,
      streamingMessage: null,
    }));

    currentSessionIdRef.current = null;
    streamingMessageIdRef.current = null;
    partsRef.current.clear();
  }, []);

  const handleEvent = useCallback(
    (event: StreamingEvent) => {
      switch (event.type) {
        case 'message.created': {
          const msgEvent = event as MessageCreatedEvent;
          streamingMessageIdRef.current = msgEvent.messageID;

          const newMessage: MessageWithParts = {
            id: msgEvent.messageID,
            sessionId: msgEvent.sessionID,
            role: 'assistant',
            parts: [],
            timestamp: Date.now(),
          };

          setState(prev => ({
            ...prev,
            isStreaming: true,
            isLoading: false,
            streamingMessage: newMessage,
          }));
          break;
        }

        case 'part.created': {
          const partEvent = event as PartCreatedEvent;
          const partId = partEvent.partID;

          const newPart: TextPart = {
            id: partId,
            type: 'text',
            sessionID: partEvent.sessionID,
            messageID: partEvent.messageID,
            text: '',
          };

          partsRef.current.set(partId, newPart);

          setState(prev => {
            if (!prev.streamingMessage) return prev;
            return {
              ...prev,
              streamingMessage: {
                ...prev.streamingMessage,
                parts: [...prev.streamingMessage.parts, newPart],
              },
            };
          });
          break;
        }

        case 'part.updated': {
          const updateEvent = event as PartUpdatedEvent;
          const partId = updateEvent.partID;
          const delta = updateEvent.delta;

          const existingPart = partsRef.current.get(partId);
          if (existingPart && existingPart.type === 'text') {
            const updatedPart: TextPart = {
              ...existingPart,
              text: existingPart.text + (delta.text || ''),
            };
            partsRef.current.set(partId, updatedPart);

            setState(prev => {
              if (!prev.streamingMessage) return prev;
              return {
                ...prev,
                streamingMessage: {
                  ...prev.streamingMessage,
                  parts: prev.streamingMessage.parts.map(p => (p.id === partId ? updatedPart : p)),
                },
              };
            });
          }
          break;
        }

        case 'message.completed': {
          const completedEvent = event as MessageCompletedEvent;

          // Save the completed message to the store
          setState(prev => {
            if (prev.streamingMessage) {
              addMessage(prev.streamingMessage.sessionId, {
                role: prev.streamingMessage.role,
                content: prev.streamingMessage.parts
                  .map(p => (p.type === 'text' ? p.text : ''))
                  .join(''),
                agent: prev.streamingMessage.agent,
                model: prev.streamingMessage.model,
                timestamp: prev.streamingMessage.timestamp,
              });
            }
            return {
              ...prev,
              isStreaming: false,
              streamingMessage: null,
            };
          });

          // Clean up
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
          currentSessionIdRef.current = null;
          streamingMessageIdRef.current = null;
          partsRef.current.clear();
          break;
        }

        case 'error': {
          const errorEvent = event as StreamErrorEvent;
          setState(prev => ({
            ...prev,
            isStreaming: false,
            isLoading: false,
            error: new Error(errorEvent.error),
          }));

          // Clean up
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
          break;
        }
      }
    },
    [addMessage]
  );

  const sendMessage = useCallback(
    async (
      sessionId: string,
      content: string,
      options?: {
        agent?: string;
        model?: { providerID: string; modelID: string };
      }
    ) => {
      if (!client) {
        throw new Error('No API client available');
      }

      // Reset any existing state
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      currentSessionIdRef.current = sessionId;
      partsRef.current.clear();

      // Add optimistic user message immediately
      addMessage(sessionId, {
        role: 'user',
        content,
        agent: options?.agent,
        model: options?.model?.modelID,
        timestamp: Date.now(),
      });

      // Set loading state while waiting for first event
      setState({
        isStreaming: false,
        isLoading: true,
        streamingMessage: null,
        error: null,
      });

      try {
        // Start streaming
        const cleanup = await client.sendMessageStream({
          sessionId,
          content,
          agent: options?.agent,
          model: options?.model,
          onEvent: handleEvent,
          onError: error => {
            setState(prev => ({
              ...prev,
              isStreaming: false,
              isLoading: false,
              error,
            }));
          },
          onComplete: () => {
            setState(prev => ({
              ...prev,
              isStreaming: false,
              isLoading: false,
            }));
          },
        });

        cleanupRef.current = cleanup;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));

        // Clean up on error
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      }
    },
    [client, addMessage, handleEvent]
  );

  return {
    ...state,
    sendMessage,
    cancelStream,
    reset,
  };
}
