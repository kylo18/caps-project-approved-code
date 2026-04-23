import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { apiRequest } from '../../src/services/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import Constants from 'expo-constants';

export default function AppVersion() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [serverVersion, setServerVersion] = useState('');

  useEffect(() => {
    fetchVersion();
  }, []);

  const fetchVersion = async () => {
    try {
      const data = await apiRequest('/api/app-version');
      setServerVersion(data?.version || '');
    } catch (error) {
      console.error('Failed to fetch app version:', error);
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View className="py-1">
      <Text className="text-xs text-center" style={{ color: '#9ca3af' }}>
        v{appVersion}{serverVersion ? ` (Server: ${serverVersion})` : ''}
      </Text>
    </View>
  );
}
