import type { PluginCode } from "./plugin";
import type { PluginError } from "./engine";

// ── Content-bound messages ──

export interface GetPageInfoMessage {
  type: "getPageInfo";
  target?: "content";
}

export interface StartPickerMessage {
  type: "startPicker";
  target?: "content";
}

export interface SyncPluginsMessage {
  type: "syncPlugins";
  target?: "content";
}

export interface PreviewPluginMessage {
  type: "previewPlugin";
  target?: "content";
  code: { css: string; html: string };
}

export interface StopPreviewMessage {
  type: "stopPreview";
  target?: "content";
}

export interface CommandMessage {
  type: "command";
  command: string;
}

export interface NavigationChangedMessage {
  type: "navigationChanged";
  url: string;
  tabId: number;
}

export interface OpenFloatingPanelMessage {
  type: "openFloatingPanel";
  target?: "content";
  pluginId: string;
}

export interface CloseFloatingPanelMessage {
  type: "closeFloatingPanel";
  target?: "content";
}

export interface ProxyFetchMessage {
  type: "proxyFetch";
  target?: "content";
  requestId: string;
  pluginId: string;
  url: string;
  options?: { method?: string; headers?: Record<string, string>; body?: string };
}

export type ContentBoundMessage =
  | GetPageInfoMessage
  | StartPickerMessage
  | SyncPluginsMessage
  | PreviewPluginMessage
  | StopPreviewMessage
  | CommandMessage
  | NavigationChangedMessage
  | OpenFloatingPanelMessage
  | CloseFloatingPanelMessage
  | ProxyFetchMessage;

// ── Sidepanel-bound messages ──

export interface PluginsUpdatedMessage {
  type: "pluginsUpdated";
  target?: "sidepanel";
  count: number;
  hiderCount: number;
  errors?: Record<string, PluginError[]>;
}

export interface ElementPickedMessage {
  type: "elementPicked";
  target?: "sidepanel";
  selector: string;
}

export interface PageInfoMessage {
  type: "pageInfo";
  target?: "sidepanel";
  url: string;
  hostname: string;
  title: string;
}

export interface PluginErrorMessage {
  type: "pluginError";
  target?: "sidepanel";
  error: PluginError;
}

export interface PluginAutoDisabledMessage {
  type: "pluginAutoDisabled";
  target?: "sidepanel";
  pluginId: string;
  pluginName: string;
}

export interface OpenEditorMessage {
  type: "openEditor";
  pluginId?: string;
}

export interface PreviewJSMessage {
  type: "previewJS";
  ruleId: string;
  jsCode: string;
  options: Record<string, unknown>;
}

export interface EditorConsoleMessage {
  type: "editorConsole";
  target?: "sidepanel";
  pluginId: string;
  level: string;
  args: unknown[];
}

export type SidepanelBoundMessage =
  | PluginsUpdatedMessage
  | ElementPickedMessage
  | PageInfoMessage
  | PluginErrorMessage
  | PluginAutoDisabledMessage
  | EditorConsoleMessage;

// ── Background-bound messages ──

export interface InjectJSMessage {
  type: "injectJS";
  ruleId: string;
  ruleVersion: number;
  options: Record<string, unknown>;
  jsCode: string;
}

export interface CleanupJSMessage {
  type: "cleanupJS";
  ruleId: string;
}

export interface OpenSidePanelMessage {
  type: "openSidePanel";
}

export interface ProxyFetchBackgroundMessage {
  type: "proxyFetch";
  requestId: string;
  pluginId: string;
  url: string;
  options?: { method?: string; headers?: Record<string, string>; body?: string };
}

export interface ProxyFetchResponseMessage {
  __domo: true;
  type: "domo:proxyFetchResponse";
  requestId: string;
  ok: boolean;
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}

export type BackgroundBoundMessage =
  | InjectJSMessage
  | CleanupJSMessage
  | OpenSidePanelMessage
  | OpenEditorMessage
  | PreviewJSMessage
  | ProxyFetchBackgroundMessage;

// ── Union ──

export type DomoMessage =
  | ContentBoundMessage
  | SidepanelBoundMessage
  | BackgroundBoundMessage;
