import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type ColorMode = 'light' | 'dark';

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
