// Chrome API mocks for testing
// In-memory chrome.storage.local implementation

const storage = new Map<string, unknown>();
const storageListeners: Array<(changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void> = [];

const chromeStorageLocal = {
  get(keys: string | string[] | Record<string, unknown> | null, callback?: (items: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
    let keyList: string[];
    if (keys === null || keys === undefined) {
      keyList = [...storage.keys()];
    } else if (typeof keys === "string") {
      keyList = [keys];
    } else if (Array.isArray(keys)) {
      keyList = keys;
    } else {
      keyList = Object.keys(keys);
    }
    const result: Record<string, unknown> = {};
    for (const key of keyList) {
      if (storage.has(key)) {
        result[key] = JSON.parse(JSON.stringify(storage.get(key)));
      }
    }
    if (callback) callback(result);
    return Promise.resolve(result);
  },
  set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};
    for (const [key, value] of Object.entries(items)) {
      const oldValue = storage.has(key) ? JSON.parse(JSON.stringify(storage.get(key))) : undefined;
      storage.set(key, JSON.parse(JSON.stringify(value)));
      changes[key] = { oldValue, newValue: JSON.parse(JSON.stringify(value)) };
    }
    for (const listener of storageListeners) {
      listener(changes, "local");
    }
    if (callback) callback();
    return Promise.resolve();
  },
  remove(keys: string | string[], callback?: () => void): Promise<void> {
    const keyList = typeof keys === "string" ? [keys] : keys;
    for (const key of keyList) {
      storage.delete(key);
    }
    if (callback) callback();
    return Promise.resolve();
  },
  clear(callback?: () => void): Promise<void> {
    storage.clear();
    if (callback) callback();
    return Promise.resolve();
  },
};

const messageLog: Array<{ msg: unknown; callback?: Function }> = [];

const chromeMock = {
  storage: {
    local: chromeStorageLocal,
    onChanged: {
      addListener(fn: (changes: Record<string, unknown>, areaName: string) => void): void {
        storageListeners.push(fn as any);
      },
      removeListener(fn: (changes: Record<string, unknown>, areaName: string) => void): void {
        const idx = storageListeners.indexOf(fn as any);
        if (idx >= 0) storageListeners.splice(idx, 1);
      },
    },
  },
  runtime: {
    sendMessage(msg: unknown, callback?: Function): Promise<void> {
      messageLog.push({ msg, callback });
      return Promise.resolve();
    },
    onMessage: {
      addListener(): void {},
      removeListener(): void {},
    },
    getURL(path: string): string {
      return `chrome-extension://test-id/${path}`;
    },
  },
  tabs: {
    query(_queryInfo: unknown, callback?: (tabs: unknown[]) => void): Promise<unknown[]> {
      const tabs = [{ id: 1, url: "https://example.com", windowId: 1 }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    },
    sendMessage(_tabId: number, _msg: unknown, _opts?: unknown, callback?: Function): Promise<void> {
      if (callback) callback();
      return Promise.resolve();
    },
    onActivated: { addListener(): void {} },
    onUpdated: { addListener(): void {} },
  },
  scripting: {
    executeScript(): Promise<void> {
      return Promise.resolve();
    },
  },
  sidePanel: {
    setPanelBehavior(): void {},
    open(): void {},
  },
  commands: {
    onCommand: { addListener(): void {} },
  },
  webNavigation: {
    onHistoryStateUpdated: { addListener(): void {} },
  },
};

// Set as global
(globalThis as any).chrome = chromeMock;

// Expose storage for test cleanup
export function clearTestStorage(): void {
  storage.clear();
}

export function getMessageLog(): Array<{ msg: unknown; callback?: Function }> {
  return messageLog;
}

// Clear storage before each test
beforeEach(() => {
  storage.clear();
  messageLog.length = 0;
});
