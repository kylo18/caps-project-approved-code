import { useEffect, useState } from 'react';
import { AppState, Dimensions, NativeModules, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';

const DARK_NAV_BAR_COLOR = '#0F0F0F';
const RESYNC_DELAYS_MS = [0, 120, 450];

type CapsAppControlModule = {
  hideSystemNavigation?: () => void;
  setSystemNavigationHidden?: (hidden: boolean) => void;
};

const CapsAppControl = NativeModules.CapsAppControl as CapsAppControlModule | undefined;

async function syncAndroidNavigationBar(isThreeButtonMode: boolean) {
  try {
    NavigationBar.setStyle('dark');
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setBackgroundColorAsync(DARK_NAV_BAR_COLOR);
    await NavigationBar.setBorderColorAsync(DARK_NAV_BAR_COLOR);

    if (isThreeButtonMode) {
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      await NavigationBar.setVisibilityAsync('hidden');
      CapsAppControl?.setSystemNavigationHidden?.(true);
      CapsAppControl?.hideSystemNavigation?.();
      return;
    }

    CapsAppControl?.setSystemNavigationHidden?.(false);
    await NavigationBar.setVisibilityAsync('visible');
  } catch {
    // Some Android builds expose only part of the navigation-bar API.
  }
}

export function useSystemNavigationMode(): boolean {
  const [isThreeButtonMode, setIsThreeButtonMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const check = () => {
      const screenH = Dimensions.get('screen').height;
      const windowH = Dimensions.get('window').height;
      const hasNavigationInset = screenH > windowH + 10;
      setIsThreeButtonMode((previous) => previous || hasNavigationInset);
    };

    check();
    const sub = Dimensions.addEventListener('change', check);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let active = true;
    const timers = RESYNC_DELAYS_MS.map((delay) =>
      setTimeout(() => {
        if (active) {
          void syncAndroidNavigationBar(isThreeButtonMode);
        }
      }, delay)
    );

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncAndroidNavigationBar(isThreeButtonMode);
      }
    });

    const visibilitySubscription = isThreeButtonMode
      ? NavigationBar.addVisibilityListener(({ visibility }) => {
          if (visibility === 'visible') {
            void syncAndroidNavigationBar(true);
          }
        })
      : null;

    return () => {
      active = false;
      timers.forEach(clearTimeout);
      appStateSubscription.remove();
      visibilitySubscription?.remove();
    };
  }, [isThreeButtonMode, pathname]);

  return isThreeButtonMode;
}
