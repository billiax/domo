/**
 * Domo Plugin API type definitions.
 * For IDE autocompletion when writing plugin JavaScript.
 *
 * Usage: reference this file in your editor or tsconfig for type hints.
 */

interface DomoStorage {
  get(key: string): unknown | null;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  keys(): string[];
  clear(): void;
}

interface DomoFetchResponse {
  status: number;
  headers: Record<string, string>;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

interface DomoApi {
  /** Unique plugin identifier */
  pluginId: string;
  /** @alias pluginId */
  ruleId: string;
  /** Current version number */
  ruleVersion: number;
  /** Plugin settings object */
  options: Record<string, unknown>;
  /** Page URL at injection time */
  url: string;
  /** AbortSignal that fires on cleanup */
  signal: AbortSignal;

  /** Log with [domo vN] prefix */
  log(...args: unknown[]): void;
  /** Register cleanup function */
  onCleanup(fn: () => void): void;

  /** Wait for a DOM element (polls every 100ms) */
  waitForSelector(selector: string, opts?: { timeoutMs?: number }): Promise<Element | null>;
  /** Auto-cleanup setInterval */
  setInterval(fn: () => void, ms: number): number;
  /** Auto-cleanup setTimeout */
  setTimeout(fn: () => void, ms: number): number;
  /** Auto-cleanup addEventListener with error isolation */
  addEventListener(
    target: EventTarget,
    event: string,
    handler: (...args: any[]) => void,
    opts?: AddEventListenerOptions,
  ): void;

  /** Persist runtime CSS for early injection */
  updateCSS(css: string): void;

  /** Per-plugin localStorage-backed storage */
  storage: DomoStorage;

  /** Cross-origin fetch via background proxy */
  fetch(url: string, opts?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<DomoFetchResponse>;

  /** Load external script */
  require(url: string): Promise<void>;
}

declare const api: DomoApi;
