import type { SymbolViewProps } from 'expo-symbols';

export type Suggestion = {
  icon: SymbolViewProps['name'];
  label: string;
  prompt: string;
};

export const SUGGESTIONS: Suggestion[] = [
  { icon: 'timer', label: 'Pomodoro timer', prompt: 'Build me a pomodoro timer with start, pause, and reset.' },
  { icon: 'checklist', label: 'Todo list', prompt: 'Make a to-do list app with categories and a search bar.' },
  { icon: 'dollarsign.circle', label: 'Tip calculator', prompt: 'Create a tip calculator with split-by-people support.' },
  { icon: 'paintpalette', label: 'Color picker', prompt: 'Code a color palette picker that copies hex codes on tap.' },
];
