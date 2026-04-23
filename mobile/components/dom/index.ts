// Typed re-exports for the shared Expo DOM components.
// The shared .jsx sources don't declare the `dom` prop that Expo's "use dom"
// pipeline threads through at runtime. Casting here keeps TS happy without
// touching the shared files (which would cross-branch contaminate).

import type { DOMProps } from 'expo/dom';
import type { FC } from 'react';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import SandpackPreviewRaw from './SandpackPreviewNative';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import MonacoEditorRaw from './MonacoEditorNative';

export type SandpackFiles = Record<string, string | { code: string }>;

export type SandpackPreviewError = {
  message: string;
  file?: string | null;
  line?: number | null;
  column?: number | null;
};

export type SandpackPreviewProps = {
  files: SandpackFiles;
  theme?: 'light' | 'dark' | string;
  height?: number;
  onError?: (err: SandpackPreviewError) => void;
  dom?: DOMProps;
};

export type MonacoEditorProps = {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  mode?: 'light' | 'dark' | string;
  height?: string | number;
  instanceKey?: string | number;
  dom?: DOMProps;
};

export const SandpackPreview = SandpackPreviewRaw as unknown as FC<SandpackPreviewProps>;
export const MonacoEditor = MonacoEditorRaw as unknown as FC<MonacoEditorProps>;
