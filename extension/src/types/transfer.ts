import type { Match, PluginCode, PluginSource } from "./plugin";

export interface ExportedPlugin {
  "$schema": "https://domo.dev/schemas/plugin-export-v1.json";
  formatVersion: 1;
  exportedAt: string;
  plugin: ExportedPluginData;
}

export interface ExportedPluginData {
  name: string;
  description: string;
  platform: string;
  match: Match;
  matchAll?: Match[];
  exclude?: Match[];
  code: PluginCode;
  settings: Record<string, unknown>;
  source: PluginSource;
  definitionId: string | null;
  priority: number;
  runAt?: "document_start" | "document_idle";
}

export interface ExportedBackup {
  "$schema": "https://domo.dev/schemas/backup-v1.json";
  formatVersion: 1;
  exportedAt: string;
  plugins: ExportedPluginData[];
}
