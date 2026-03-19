export type SyncState = "idle" | "syncing" | "pending";

export interface PluginError {
  pluginId: string;
  pluginName: string;
  timestamp: string;
  phase: "css" | "html" | "js-inject" | "js-runtime" | "sync";
  message: string;
  stack?: string;
}

export interface CleanupHandle {
  abort(): void;
  signal: AbortSignal;
}

export interface AppliedPlugin {
  ruleId: string;
  version: number;
  cleanup: CleanupHandle | null;
  styleEl: HTMLStyleElement | null;
  htmlEl: HTMLDivElement | null;
  /** Whether JS was injected (so we know not to re-inject on DOM repair) */
  hasJs: boolean;
  /** The plugin's CSS content (for repair without storage read) */
  cssContent: string;
  /** The plugin's HTML content (for repair without storage read) */
  htmlContent: string;
}

export interface InjectionResult {
  success: boolean;
  error?: string;
}
