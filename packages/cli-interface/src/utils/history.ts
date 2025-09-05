import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// History entry schema
export const HistoryEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  command: z.string(),
  args: z.array(z.string()),
  goal: z.string().optional(),
  success: z.boolean(),
  executionTime: z.number(),
  steps: z.number().optional(),
  error: z.string().optional(),
  workingDirectory: z.string(),
  provider: z.string().optional(),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

// History configuration
export interface HistoryConfig {
  maxEntries: number;
  saveToFile: boolean;
  filePath?: string;
}

export class CLIHistory {
  private entries: HistoryEntry[] = [];
  private config: HistoryConfig;
  private filePath: string;

  constructor(config: HistoryConfig = { maxEntries: 100, saveToFile: true }) {
    this.config = config;
    this.filePath = config.filePath || path.join(os.homedir(), '.ai-code', 'history.json');
    this.loadHistory();
  }

  private loadHistory(): void {
    if (!this.config.saveToFile) return;

    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readJsonSync(this.filePath);
        this.entries = data.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        
        // Validate entries
        this.entries = this.entries.filter(entry => {
          try {
            HistoryEntrySchema.parse(entry);
            return true;
          } catch {
            return false;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load history:', error);
      this.entries = [];
    }
  }

  private saveHistory(): void {
    if (!this.config.saveToFile) return;

    try {
      fs.ensureDirSync(path.dirname(this.filePath));
      fs.writeJsonSync(this.filePath, this.entries, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save history:', error);
    }
  }

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const historyEntry: HistoryEntry = {
      id: nanoid(),
      timestamp: new Date(),
      ...entry,
    };

    this.entries.unshift(historyEntry);

    // Limit entries
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(0, this.config.maxEntries);
    }

    this.saveHistory();
  }

  getEntries(limit?: number): HistoryEntry[] {
    return limit ? this.entries.slice(0, limit) : [...this.entries];
  }

  getRecentEntries(count: number = 10): HistoryEntry[] {
    return this.entries.slice(0, count);
  }

  searchEntries(query: string): HistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(entry =>
      entry.command.toLowerCase().includes(lowerQuery) ||
      entry.goal?.toLowerCase().includes(lowerQuery) ||
      entry.args.some(arg => arg.toLowerCase().includes(lowerQuery))
    );
  }

  getSuccessfulEntries(): HistoryEntry[] {
    return this.entries.filter(entry => entry.success);
  }

  getFailedEntries(): HistoryEntry[] {
    return this.entries.filter(entry => !entry.success);
  }

  getEntriesByCommand(command: string): HistoryEntry[] {
    return this.entries.filter(entry => entry.command === command);
  }

  getEntriesByTimeRange(start: Date, end: Date): HistoryEntry[] {
    return this.entries.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  clear(): void {
    this.entries = [];
    this.saveHistory();
  }

  removeEntry(id: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(entry => entry.id !== id);
    
    if (this.entries.length < initialLength) {
      this.saveHistory();
      return true;
    }
    return false;
  }

  // Statistics
  getStats(): {
    total: number;
    successful: number;
    failed: number;
    averageExecutionTime: number;
    mostUsedCommands: Array<{ command: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  } {
    const successful = this.getSuccessfulEntries().length;
    const failed = this.getFailedEntries().length;
    const total = this.entries.length;

    const averageExecutionTime = total > 0
      ? this.entries.reduce((sum, entry) => sum + entry.executionTime, 0) / total
      : 0;

    // Most used commands
    const commandCounts = new Map<string, number>();
    this.entries.forEach(entry => {
      commandCounts.set(entry.command, (commandCounts.get(entry.command) || 0) + 1);
    });
    const mostUsedCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyCounts = new Map<string, number>();

    this.entries
      .filter(entry => entry.timestamp >= sevenDaysAgo)
      .forEach(entry => {
        const date = entry.timestamp.toISOString().split('T')[0];
        dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      });

    const recentActivity = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      successful,
      failed,
      averageExecutionTime,
      mostUsedCommands,
      recentActivity,
    };
  }

  // Export/Import
  exportToFile(filePath: string): void {
    fs.writeJsonSync(filePath, this.entries, { spaces: 2 });
  }

  importFromFile(filePath: string): void {
    try {
      const data = fs.readJsonSync(filePath);
      const importedEntries = data.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      // Validate and merge
      const validEntries = importedEntries.filter((entry: any) => {
        try {
          HistoryEntrySchema.parse(entry);
          return true;
        } catch {
          return false;
        }
      });

      this.entries = [...validEntries, ...this.entries]
        .slice(0, this.config.maxEntries);

      this.saveHistory();
    } catch (error) {
      throw new Error(`Failed to import history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Configuration management
  updateConfig(config: Partial<HistoryConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.filePath) {
      this.filePath = config.filePath;
    }
    
    if (config.maxEntries && this.entries.length > config.maxEntries) {
      this.entries = this.entries.slice(0, config.maxEntries);
    }
    
    this.saveHistory();
  }

  getConfig(): HistoryConfig {
    return { ...this.config };
  }
}