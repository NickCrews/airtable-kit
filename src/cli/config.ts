import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { BaseId, TableId } from "../types.ts";

export interface AtkConfig {
  currentBase?: BaseId | string;
  currentTable?: TableId | string;
  _schemaCachePath?: string;
}

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private config: AtkConfig;

  constructor(configDir: string = ".atk") {
    this.configDir = configDir;
    this.configPath = join(configDir, "config.json");
    this.config = this.loadConfig();
  }

  private loadConfig(): AtkConfig {
    if (!existsSync(this.configPath)) {
      return {};
    }
    try {
      const content = readFileSync(this.configPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private ensureDir(): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  saveConfig(): void {
    this.ensureDir();
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  getContext(): { base?: BaseId | string; table?: TableId | string } {
    return {
      base: this.config.currentBase,
      table: this.config.currentTable,
    };
  }

  setContext(context: { base?: BaseId | string; table?: TableId | string }): void {
    if (context.base !== undefined) {
      this.config.currentBase = context.base;
    }
    if (context.table !== undefined) {
      this.config.currentTable = context.table;
    }
    this.saveConfig();
  }

  setBase(baseId: BaseId | string): void {
    this.config.currentBase = baseId;
    this.config.currentTable = undefined;
    this.saveConfig();
  }

  setTable(tableId: TableId | string): void {
    this.config.currentTable = tableId;
    this.saveConfig();
  }

  getBaseId(): BaseId | string | undefined {
    return this.config.currentBase;
  }

  getTableId(): TableId | string | undefined {
    return this.config.currentTable;
  }

  getSchemaCachePath(): string {
    return this.config._schemaCachePath || join(this.configDir, "schemas.json");
  }

  static getDefault(): ConfigManager {
    return new ConfigManager(".atk");
  }
}
