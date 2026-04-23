import { View, Modal, Text } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import AnimatedCapsLoader from './AnimatedCapsLoader';

export default function LoadingOverlay({ visible = false, message = 'Loading...' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className={`p-6 rounded-2xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`} style={{ minWidth: 120 }}>
          <AnimatedCapsLoader
            size="md"
            color={isDark ? '#f9fafb' : '#111827'}
            accentColor="#FE6902"
          />
          {message && (
            <Text className={`mt-3 text-sm text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
