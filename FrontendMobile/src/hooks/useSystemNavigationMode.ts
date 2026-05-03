import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

export function useSystemNavigationMode(): boolean {
  const [isThreeButtonMode, setIsThreeButtonMode] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const check = () => {
      const screenH = Dimensions.get('screen').height;
      const windowH = Dimensions.get('window').height;
      setIsThreeButtonMode(screenH > windowH + 10);
    };

    check();
    const sub = Dimensions.addEventListener('change', check);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        await SystemUI.setAsync({
          navigationBarColor: 'transparent',
          navigationBarVisibility: isThreeButtonMode ? 'hidden' : 'visible',
        });
      } catch { /* ignore if API unsupported on this Android version */ }
    })();
  }, [isThreeButtonMode]);

  return isThreeButtonMode;
}
