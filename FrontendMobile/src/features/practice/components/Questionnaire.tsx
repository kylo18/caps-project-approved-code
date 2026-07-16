import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';

export default function Questionnaire({ onPress }: { onPress?: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? '#374151' : '#f3f4f6',
    icon: isDark ? '#f9fafb' : '#6b7280',
  };

  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.bg }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="help-circle" size={22} color={colors.icon} />
    </TouchableOpacity>
  );
}
