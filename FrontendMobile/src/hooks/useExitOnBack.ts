// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Double-back press to exit app — Facebook-style.
// First press shows a toast "Press again to exit", second press within 2s exits.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { showToast } from './useToast';

export function useExitOnBack() {
  const lastBackPress = useRef<number>(0);

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

      showToast('Press again to exit', 'info');

      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, []);
}