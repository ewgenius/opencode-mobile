// Mock implementation of react-native-mmkv
export class MMKV {
  private storage: Map<string, string> = new Map();
  private id: string;

  constructor(config?: { id?: string }) {
    this.id = config?.id || 'default';
  }

  getString(key: string): string | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  contains(key: string): boolean {
    return this.storage.has(key);
  }

  clearAll(): void {
    this.storage.clear();
  }
}

export function createMMKV(config?: { id?: string }): MMKV {
  return new MMKV(config);
}

export default { MMKV, createMMKV };
