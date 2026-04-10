import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function Questionnaire({ onPress }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? '#374151' : '#f3f4f6',
    icon: isDark ? '#f9fafb' : '#6b7280',
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.bg }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="help-circle" size={22} color={colors.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
