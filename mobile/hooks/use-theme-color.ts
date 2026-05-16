import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

type ColorKey = 'background' | 'text';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey,
) {
  const mode = useTheme().mode as 'light' | 'dark';
  const fromProps = props[mode];
  if (fromProps) return fromProps;
  const theme = getTheme(mode);
  return colorName === 'background' ? theme.colors.bg.primary : theme.colors.text.primary;
}
