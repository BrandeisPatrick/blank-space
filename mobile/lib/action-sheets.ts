import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { MODEL_TIERS } from '../../src/services/config/modelConfig';

type ColorMode = 'light' | 'dark';
type TierKey = keyof typeof MODEL_TIERS;
const TIER_KEYS = Object.keys(MODEL_TIERS) as TierKey[];

export function confirmDestructive({
  title,
  message,
  confirmLabel = 'Delete',
  mode,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  mode: ColorMode;
  onConfirm: () => void;
}) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  if (Platform.OS !== 'ios') {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onConfirm();
        },
      },
    ]);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      message,
      options: [confirmLabel, 'Cancel'],
      destructiveButtonIndex: 0,
      cancelButtonIndex: 1,
      userInterfaceStyle: mode,
    },
    (idx) => {
      if (idx === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onConfirm();
      }
    },
  );
}

export function openTierPickerSheet({
  current,
  mode,
  onChange,
}: {
  current: TierKey;
  mode: ColorMode;
  onChange: (next: TierKey) => void;
}) {
  Haptics.selectionAsync();
  if (Platform.OS !== 'ios') {
    const next = TIER_KEYS[(TIER_KEYS.indexOf(current) + 1) % TIER_KEYS.length];
    onChange(next);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Model',
      options: [...TIER_KEYS.map((k) => MODEL_TIERS[k].name), 'Cancel'],
      cancelButtonIndex: TIER_KEYS.length,
      userInterfaceStyle: mode,
    },
    (index) => {
      if (index < 0 || index >= TIER_KEYS.length) return;
      onChange(TIER_KEYS[index]);
    },
  );
}

export function openAttachmentSheet(mode: ColorMode) {
  Haptics.selectionAsync();
  if (Platform.OS !== 'ios') {
    Alert.alert('Attachments', 'File and image attachments are coming soon.');
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Attach',
      message: 'File and image attachments are coming soon.',
      options: ['Cancel'],
      cancelButtonIndex: 0,
      userInterfaceStyle: mode,
    },
    () => {},
  );
}

export function openVoiceComingSoon() {
  Haptics.selectionAsync();
  Alert.alert('Voice input', 'Voice input is coming soon.');
}
