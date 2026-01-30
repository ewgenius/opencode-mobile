/**
 * useApi Hook
 *
 * Hook for accessing the OpenCode API client based on the active server.
 */

import { useMemo } from 'react';
import { OpencodeApi, createApiClient } from '@/services/opencodeApi';
import { useActiveServer } from '@/stores';

export interface UseApiResult {
  client: OpencodeApi | null;
  isConnected: boolean;
  serverUrl: string | null;
}

/**
 * Hook to get the API client for the active server
 */
export function useApi(): UseApiResult {
  const activeServer = useActiveServer();

  return useMemo(() => {
    if (!activeServer) {
      return {
        client: null,
        isConnected: false,
        serverUrl: null,
      };
    }

    const client = createApiClient(activeServer);

    return {
      client,
      isConnected: true,
      serverUrl: activeServer.url,
    };
  }, [activeServer]);
}

/**
 * Hook to check if API is available (server is connected)
 */
export function useIsApiAvailable(): boolean {
  const { isConnected } = useApi();
  return isConnected;
}
