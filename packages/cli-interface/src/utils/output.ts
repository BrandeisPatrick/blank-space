import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import { promisify } from 'util';

const figletAsync = promisify(figlet);

// Color themes
export const themes = {
  dark: {
    primary: chalk.cyan,
    secondary: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    muted: chalk.gray,
    highlight: chalk.magenta,
    info: chalk.blue,
  },
  light: {
    primary: chalk.blue,
    secondary: chalk.cyan,
    success: chalk.green,
    warning: chalk.orange,
    error: chalk.red,
    muted: chalk.gray,
    highlight: chalk.magenta,
    info: chalk.blue,
  },
};

export type Theme = keyof typeof themes;
export type ThemeColors = typeof themes.dark;

let currentTheme: Theme = 'dark';
let colors: ThemeColors = themes.dark;

export function setTheme(theme: Theme): void {
  currentTheme = theme;
  colors = themes[theme];
}

export function getTheme(): Theme {
  return currentTheme;
}

// Utility functions for styled output
export const output = {
  // Basic styled text
  primary: (text: string) => colors.primary(text),
  secondary: (text: string) => colors.secondary(text),
  success: (text: string) => colors.success(text),
  warning: (text: string) => colors.warning(text),
  error: (text: string) => colors.error(text),
  muted: (text: string) => colors.muted(text),
  highlight: (text: string) => colors.highlight(text),
  info: (text: string) => colors.info(text),

  // Formatted output functions
  logo: async (text: string = 'AI CODE') => {
    try {
      const ascii = await figletAsync(text, { font: 'ANSI Shadow' });
      return colors.primary(ascii);
    } catch {
      return colors.primary(`=== ${text} ===`);
    }
  },

  title: (text: string) => {
    return boxen(colors.primary(text), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    });
  },

  box: (text: string, options?: { type?: 'info' | 'success' | 'warning' | 'error' }) => {
    const type = options?.type || 'info';
    const colorMap = {
      info: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
    } as const;

    return boxen(text, {
      padding: 1,
      borderColor: colorMap[type],
      borderStyle: 'round',
    });
  },

  section: (title: string, content: string) => {
    return `\\n${colors.highlight('■')} ${colors.primary(title)}\\n${content}\\n`;
  },

  list: (items: string[], bullet: string = '•') => {
    return items.map(item => `  ${colors.muted(bullet)} ${item}`).join('\\n');
  },

  table: (data: Record<string, string>[]) => {
    if (data.length === 0) return '';

    const keys = Object.keys(data[0]);
    const maxLengths = keys.map(key => 
      Math.max(key.length, ...data.map(row => String(row[key]).length))
    );

    // Header
    const header = keys.map((key, i) => colors.primary(key.padEnd(maxLengths[i]))).join(' | ');
    const separator = maxLengths.map(len => '-'.repeat(len)).join('-|-');

    // Rows
    const rows = data.map(row => 
      keys.map((key, i) => String(row[key]).padEnd(maxLengths[i])).join(' | ')
    );

    return [header, colors.muted(separator), ...rows].join('\\n');
  },

  progress: (current: number, total: number, width: number = 30) => {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const bar = colors.success('█'.repeat(filled)) + colors.muted('░'.repeat(empty));
    return `[${bar}] ${percentage}% (${current}/${total})`;
  },

  spinner: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
};

// Status indicators
export const status = {
  loading: colors.info('◐'),
  success: colors.success('✓'),
  error: colors.error('✗'),
  warning: colors.warning('⚠'),
  info: colors.info('ℹ'),
  question: colors.highlight('?'),
  arrow: colors.muted('→'),
  bullet: colors.muted('•'),
};

// Logging functions with different levels
export const logger = {
  log: (message: string) => {
    console.log(message);
  },

  info: (message: string) => {
    console.log(`${status.info} ${message}`);
  },

  success: (message: string) => {
    console.log(`${status.success} ${colors.success(message)}`);
  },

  warning: (message: string) => {
    console.warn(`${status.warning} ${colors.warning(message)}`);
  },

  error: (message: string) => {
    console.error(`${status.error} ${colors.error(message)}`);
  },

  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(`${colors.muted('[DEBUG]')} ${colors.muted(message)}`);
    }
  },

  step: (step: number, total: number, message: string) => {
    const progress = colors.muted(`[${step}/${total}]`);
    console.log(`${progress} ${status.arrow} ${message}`);
  },
};

// Helper function to truncate text
export function truncate(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Helper function to format time
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// Helper function to format file size
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}