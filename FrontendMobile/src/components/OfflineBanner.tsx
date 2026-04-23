import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected ?? true));
    });

    NetInfo.fetch().then((state) => {
      setIsOffline(!(state.isConnected ?? true));
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View className="flex-row items-center justify-center py-2 px-4" style={{ backgroundColor: '#f59e0b' }}>
      <Text className="text-white text-xs font-semibold">You are offline. Some data may be cached.</Text>
    </View>
  );
}
