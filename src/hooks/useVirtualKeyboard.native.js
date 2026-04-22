/**
 * useVirtualKeyboard for React Native.
 *
 * Metro auto-selects this over useVirtualKeyboard.js for iOS/Android builds.
 * Phase 1 will replace the placeholder with react-native Keyboard events:
 *
 *   import { Keyboard } from 'react-native';
 *   Keyboard.addListener('keyboardDidShow', ...)
 *
 * Until `react-native` is installed (Phase 1), this returns the same shape
 * as the web hook so consumers can import it without crashing at bundle time.
 */
import { useState } from 'react';

export const useVirtualKeyboard = () => {
  const [keyboardState] = useState({
    isKeyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: 0,
  });
  return keyboardState;
};
