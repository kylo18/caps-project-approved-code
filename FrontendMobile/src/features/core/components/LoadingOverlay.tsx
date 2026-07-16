import { View, Modal, Text } from 'react-native';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import AnimatedCapsLoader from '../../../features/core/components/AnimatedCapsLoader';
import { getRoleThemeColors } from '../styles/roleTheme';

export default function LoadingOverlay({ visible = false, message = 'Loading...' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.overlay }}>
        <View className="p-6 rounded-2xl items-center border" style={{ minWidth: 120, backgroundColor: colors.surface, borderColor: colors.border }}>
          <AnimatedCapsLoader
            size="md"
            color={colors.text}
            accentColor={colors.accent}
          />
          {message && (
            <Text className="mt-3 text-sm text-center" style={{ color: colors.text }}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
