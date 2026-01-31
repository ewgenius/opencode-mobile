/**
 * Hooks Index
 *
 * Central export for all custom hooks.
 */

// Theme and UI hooks
export { useThemeColor } from './use-theme-color';
export { useColorScheme } from './use-color-scheme';
export { useFonts } from './useFonts';

// API hooks
export { useApi, useIsApiAvailable, type UseApiResult } from './useApi';

// Query hooks
export { useProjects, useSessions, useMessages, queryKeys } from './useQueries';

// Mutation hooks
export {
  useCreateProject,
  useCreateSession,
  useSendMessage,
  useDeleteSession,
  useAbortSession,
} from './useMutations';

// Streaming hooks
export {
  useStreamingMessage,
  type StreamingState,
  type UseStreamingMessageResult,
} from './useStreamingMessage';
