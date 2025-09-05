import { Command } from 'commander';
import inquirer from 'inquirer';
import { CLIHistory, HistoryEntry } from '../utils/history';
import { logger, output, formatDuration } from '../utils/output';

export class HistoryCommand {
  private history: CLIHistory;

  constructor(history: CLIHistory) {
    this.history = history;
  }

  register(program: Command): Command {
    const historyCmd = program
      .command('history')
      .description('Manage command history');

    // List recent history
    historyCmd
      .command('list')
      .alias('ls')
      .description('List recent command history')
      .option('-n, --number <count>', 'Number of entries to show', (val) => parseInt(val), 10)
      .option('--success-only', 'Show only successful executions')
      .option('--failed-only', 'Show only failed executions')
      .action((options) => this.listHistory(options));

    // Search history
    historyCmd
      .command('search')
      .description('Search command history')
      .argument('<query>', 'Search query')
      .action((query) => this.searchHistory(query));

    // Show detailed entry
    historyCmd
      .command('show')
      .description('Show detailed information for a specific entry')
      .argument('<id>', 'Entry ID')
      .action((id) => this.showEntry(id));

    // Show statistics
    historyCmd
      .command('stats')
      .description('Show history statistics')
      .action(() => this.showStats());

    // Clear history
    historyCmd
      .command('clear')
      .description('Clear command history')
      .option('-y, --yes', 'Skip confirmation')
      .action((options) => this.clearHistory(options.yes));

    // Export history
    historyCmd
      .command('export')
      .description('Export history to a file')
      .argument('<file>', 'Output file path')
      .action((file) => this.exportHistory(file));

    // Import history
    historyCmd
      .command('import')
      .description('Import history from a file')
      .argument('<file>', 'Input file path')
      .action((file) => this.importHistory(file));

    return historyCmd;
  }

  private listHistory(options: {
    number?: number;
    successOnly?: boolean;
    failedOnly?: boolean;
  }): void {
    let entries = this.history.getEntries();

    if (options.successOnly) {
      entries = this.history.getSuccessfulEntries();
    } else if (options.failedOnly) {
      entries = this.history.getFailedEntries();
    }

    const limit = options.number || 10;
    const displayEntries = entries.slice(0, limit);

    if (displayEntries.length === 0) {
      logger.info('No history entries found');
      return;
    }

    console.log(output.title('Command History'));
    console.log(`Showing ${displayEntries.length} of ${entries.length} entries\\n`);

    displayEntries.forEach((entry, index) => {
      this.displayHistoryEntry(entry, index + 1);
    });

    if (entries.length > limit) {
      console.log(output.muted(`\\n... and ${entries.length - limit} more entries`));
      console.log(output.muted('Use --number option to show more entries'));
    }
  }

  private searchHistory(query: string): void {
    const results = this.history.searchEntries(query);

    if (results.length === 0) {
      logger.info(`No entries found matching: ${query}`);
      return;
    }

    console.log(output.title(`Search Results for: ${query}`));
    console.log(`Found ${results.length} matching entries\\n`);

    results.forEach((entry, index) => {
      this.displayHistoryEntry(entry, index + 1);
    });
  }

  private showEntry(id: string): void {
    const entries = this.history.getEntries();
    const entry = entries.find(e => e.id === id || e.id.startsWith(id));

    if (!entry) {
      logger.error(`Entry not found: ${id}`);
      return;
    }

    console.log(output.title('History Entry Details'));
    console.log(this.formatDetailedEntry(entry));
  }

  private showStats(): void {
    const stats = this.history.getStats();

    console.log(output.title('History Statistics'));

    const overview = [
      `Total executions: ${stats.total}`,
      `Successful: ${stats.successful} (${stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%)`,
      `Failed: ${stats.failed} (${stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%)`,
      `Average execution time: ${formatDuration(stats.averageExecutionTime)}`,
    ];

    console.log(output.section('Overview', overview.join('\\n')));

    if (stats.mostUsedCommands.length > 0) {
      const commandStats = stats.mostUsedCommands.map(
        cmd => `${cmd.command}: ${cmd.count} times`
      );
      console.log(output.section('Most Used Commands', commandStats.join('\\n')));
    }

    if (stats.recentActivity.length > 0) {
      const activityStats = stats.recentActivity.map(
        activity => `${activity.date}: ${activity.count} executions`
      );
      console.log(output.section('Recent Activity (Last 7 Days)', activityStats.join('\\n')));
    }
  }

  private async clearHistory(skipConfirmation: boolean): Promise<void> {
    if (!skipConfirmation) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'This will permanently delete all history entries. Continue?',
          default: false,
        },
      ]);

      if (!confirmed) {
        logger.info('Clear operation cancelled');
        return;
      }
    }

    this.history.clear();
    logger.success('History cleared successfully');
  }

  private exportHistory(filePath: string): void {
    try {
      this.history.exportToFile(filePath);
      logger.success(`History exported to: ${filePath}`);
    } catch (error) {
      logger.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private importHistory(filePath: string): void {
    try {
      this.history.importFromFile(filePath);
      logger.success(`History imported from: ${filePath}`);
    } catch (error) {
      logger.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private displayHistoryEntry(entry: HistoryEntry, index: number): void {
    const statusIcon = entry.success ? '✅' : '❌';
    const timeAgo = this.getTimeAgo(entry.timestamp);
    const duration = formatDuration(entry.executionTime);

    console.log(`${index}. ${statusIcon} ${output.primary(entry.command)} ${output.muted(`(${timeAgo})`)}`);
    
    if (entry.goal) {
      console.log(`   Goal: ${output.muted(this.truncateText(entry.goal, 60))}`);
    }
    
    console.log(`   Duration: ${duration}${entry.steps ? `, Steps: ${entry.steps}` : ''}`);
    
    if (entry.error) {
      console.log(`   Error: ${output.error(this.truncateText(entry.error, 60))}`);
    }
    
    console.log(`   ID: ${output.muted(entry.id.substring(0, 8))}`);
    console.log('');
  }

  private formatDetailedEntry(entry: HistoryEntry): string {
    const sections = [];

    // Basic info
    const basicInfo = [
      `ID: ${entry.id}`,
      `Command: ${entry.command} ${entry.args.join(' ')}`,
      `Status: ${entry.success ? 'Success ✅' : 'Failed ❌'}`,
      `Timestamp: ${entry.timestamp.toLocaleString()}`,
      `Execution Time: ${formatDuration(entry.executionTime)}`,
      `Working Directory: ${entry.workingDirectory}`,
    ];

    if (entry.provider) {
      basicInfo.push(`Provider: ${entry.provider}`);
    }

    if (entry.steps) {
      basicInfo.push(`Reasoning Steps: ${entry.steps}`);
    }

    sections.push(output.section('Basic Information', basicInfo.join('\\n')));

    // Goal
    if (entry.goal) {
      sections.push(output.section('Goal', entry.goal));
    }

    // Error
    if (entry.error) {
      sections.push(output.section('Error', entry.error));
    }

    return sections.join('\\n');
  }

  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}