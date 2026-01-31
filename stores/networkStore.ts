/**
 * Network Store
 *
 * Zustand store for device network state using @react-native-community/netinfo.
 * Tracks internet reachability, connection type, and provides combined offline state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo';

// Lazy initialization of MMKV instance
let storageInstance: MMKV | null = null;

function getStorage(): MMKV {
  if (!storageInstance) {
    try {
      storageInstance = new MMKV({
        id: 'network-storage',
      });
    } catch (error) {
      console.error('Failed to initialize MMKV storage:', error);
      throw error;
    }
  }
  return storageInstance;
}

// Custom storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string): string | null => {
    try {
      const storage = getStorage();
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const storage = getStorage();
      storage.set(name, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  },
  removeItem: (name: string): void => {
    try {
      const storage = getStorage();
      storage.delete(name);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

export interface NetworkState {
  // Connection state
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isWifi: boolean;
  isCellular: boolean;

  // Last known states for graceful degradation
  lastKnownConnectionAt: number | null;
  offlineSince: number | null;

  // Actions
  updateNetworkState: (state: NetInfoState) => void;
  isOffline: () => boolean;
  getOfflineDuration: () => number | null;
}

const initialState = {
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  isWifi: false,
  isCellular: false,
  lastKnownConnectionAt: Date.now(),
  offlineSince: null,
};

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateNetworkState: (netInfoState: NetInfoState) => {
        const isConnected = netInfoState.isConnected ?? false;
        const isInternetReachable = netInfoState.isInternetReachable;
        const connectionType = netInfoState.type;

        const state = get();

        // Track when we went offline
        let offlineSince = state.offlineSince;
        let lastKnownConnectionAt = state.lastKnownConnectionAt;

        if (!isConnected || isInternetReachable === false) {
          if (!state.offlineSince) {
            offlineSince = Date.now();
          }
        } else {
          // Back online
          offlineSince = null;
          lastKnownConnectionAt = Date.now();
        }

        set({
          isConnected,
          isInternetReachable,
          connectionType,
          isWifi: connectionType === 'wifi',
          isCellular: connectionType === 'cellular',
          offlineSince,
          lastKnownConnectionAt,
        });
      },

      isOffline: () => {
        const state = get();
        return !state.isConnected || state.isInternetReachable === false;
      },

      getOfflineDuration: () => {
        const state = get();
        if (!state.offlineSince) return null;
        return Date.now() - state.offlineSince;
      },
    }),
    {
      name: 'network-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useIsDeviceOffline = () =>
  useNetworkStore(state => !state.isConnected || state.isInternetReachable === false);

export const useNetworkConnectionType = () => useNetworkStore(state => state.connectionType);

export const useIsWifiConnected = () => useNetworkStore(state => state.isWifi);

export const useOfflineDuration = () => useNetworkStore(state => state.getOfflineDuration());

export const useOfflineSince = () => useNetworkStore(state => state.offlineSince);

// Initialize network monitoring
let netInfoSubscription: NetInfoSubscription | null = null;

export function initializeNetworkMonitoring(): () => void {
  // Unsubscribe any existing subscription
  if (netInfoSubscription) {
    netInfoSubscription();
    netInfoSubscription = null;
  }

  // Subscribe to network state changes
  netInfoSubscription = NetInfo.addEventListener(state => {
    useNetworkStore.getState().updateNetworkState(state);
  });

  // Initial fetch
  NetInfo.fetch().then(state => {
    useNetworkStore.getState().updateNetworkState(state);
  });

  // Return cleanup function
  return () => {
    if (netInfoSubscription) {
      netInfoSubscription();
      netInfoSubscription = null;
    }
  };
}
