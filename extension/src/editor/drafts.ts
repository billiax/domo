import type { Match, PluginCode } from "../types/plugin";

const DRAFTS_KEY = "domo_editor_drafts";

export interface EditorDraft {
  pluginId: string | null;
  name: string;
  description: string;
  platform: string;
  match: Match;
  matchAll: Match[];
  exclude: Match[];
  code: PluginCode;
  runAt?: "document_start" | "document_idle";
  savedAt: string;
}

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function saveDraft(draft: EditorDraft): Promise<void> {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    try {
      const key = draft.pluginId || "__new__";
      const data = await chrome.storage.local.get(DRAFTS_KEY);
      const drafts = (data[DRAFTS_KEY] as Record<string, EditorDraft>) || {};
      drafts[key] = { ...draft, savedAt: new Date().toISOString() };
      await chrome.storage.local.set({ [DRAFTS_KEY]: drafts });
    } catch { /* ignore */ }
  }, 2000);
}

export async function loadDraft(pluginId: string | null): Promise<EditorDraft | null> {
  try {
    const key = pluginId || "__new__";
    const data = await chrome.storage.local.get(DRAFTS_KEY);
    const drafts = (data[DRAFTS_KEY] as Record<string, EditorDraft>) || {};
    return drafts[key] || null;
  } catch {
    return null;
  }
}

export async function clearDraft(pluginId: string | null): Promise<void> {
  try {
    const key = pluginId || "__new__";
    const data = await chrome.storage.local.get(DRAFTS_KEY);
    const drafts = (data[DRAFTS_KEY] as Record<string, EditorDraft>) || {};
    delete drafts[key];
    await chrome.storage.local.set({ [DRAFTS_KEY]: drafts });
  } catch { /* ignore */ }
}
