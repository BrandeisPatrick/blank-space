import { Text, type TextProps, type TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

export type TextVariant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'accent'
  | 'link'
  | 'inverse'
  | 'error';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: TextVariant;
  tone?: TextTone;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

const LEGACY_TYPE_TO_VARIANT: Record<NonNullable<ThemedTextProps['type']>, TextVariant> = {
  default: 'body',
  defaultSemiBold: 'headline',
  title: 'display',
  subtitle: 'title2',
  link: 'body',
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant,
  tone,
  type,
  ...rest
}: ThemedTextProps) {
  const defaultColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const mode = useTheme().mode as 'light' | 'dark';
  const theme = getTheme(mode);

  const resolvedVariant: TextVariant = variant ?? (type ? LEGACY_TYPE_TO_VARIANT[type] : 'body');
  const variantStyle = theme.typography.text[resolvedVariant] as TextStyle;

  let color = defaultColor;
  if (tone) color = theme.tone[tone];
  else if (type === 'link') color = theme.tone.link;

  return (
    <Text
      style={[variantStyle, { color }, style]}
      {...rest}
    />
  );
}
