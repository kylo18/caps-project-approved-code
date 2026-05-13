// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Double-back press to exit app — Facebook-style.
// First press shows a toast "Tap again to exit", second press within 2s exits.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { BackHandler, Toast } from 'react-native';

export function useExitOnBack() {
  const lastBackPress = useRef<number>(0);
  const toastShown = useRef<boolean>(false);

  useEffect(() => {
    const handleBackPress = () => {
      const now = Date.now();

      // If within 2 seconds of last back press, exit
      if (now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      // First press — show toast and record time
      lastBackPress.current = now;
      toastShown.current = true;

      Toast.show({
        type: 'info',
        text1: 'Tap again to exit',
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
      });

      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, []);
}