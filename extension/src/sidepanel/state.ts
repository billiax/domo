import type { Plugin } from "../types/plugin";
import type { PluginError } from "../types/engine";
import type { PageInfo } from "./shared";
import type { UpdateInfo } from "../core/updates";
import { getAllPlugins } from "../core/plugins";

interface SidepanelState {
  plugins: Plugin[];
  pageInfo: PageInfo | null;
  dirtyInstalled: boolean;
  dirtyDiscover: boolean;
  pluginErrors: Record<string, PluginError[]>;
  installedSearchQuery: string;
  availableUpdates: UpdateInfo[];
}

const state: SidepanelState = {
  plugins: [],
  pageInfo: null,
  dirtyInstalled: false,
  dirtyDiscover: false,
  pluginErrors: {},
  installedSearchQuery: "",
  availableUpdates: [],
};

type StateKey = keyof SidepanelState;
const subscribers = new Map<StateKey, Set<() => void>>();

export function getState(): Readonly<SidepanelState> {
  return state;
}

export function setState(partial: Partial<SidepanelState>): void {
  const changedKeys: StateKey[] = [];
  for (const [key, value] of Object.entries(partial) as [StateKey, unknown][]) {
    if ((state as any)[key] !== value) {
      (state as any)[key] = value;
      changedKeys.push(key);
    }
  }
  for (const key of changedKeys) {
    const subs = subscribers.get(key);
    if (subs) {
      for (const fn of subs) fn();
    }
  }
}

export function subscribe(key: StateKey, fn: () => void): () => void {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(fn);
  return () => subscribers.get(key)?.delete(fn);
}

export async function reloadPlugins(): Promise<void> {
  const plugins = await getAllPlugins();
  setState({ plugins });
}

export async function reloadAll(pageInfo?: PageInfo): Promise<void> {
  if (pageInfo) setState({ pageInfo });
  await reloadPlugins();
}
