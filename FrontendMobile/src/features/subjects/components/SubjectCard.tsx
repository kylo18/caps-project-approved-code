import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';

export default function SubjectCard({ subject, onPress, onDelete }: { subject?: any; onPress?: () => void; onDelete?: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
    red: '#EF4444',
  };

  return (
    <TouchableOpacity
      className="flex-row items-center rounded-2xl p-4 gap-3 mb-2.5"
      style={{ backgroundColor: colors.card, elevation: 2 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
        <Ionicons name="book" size={24} color={colors.orange} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold" numberOfLines={1} style={{ color: colors.text }}>{subject?.subjectName || 'Unknown Subject'}</Text>
        <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{subject?.subjectCode || 'GEN'} • {subject?.questionCount || 0} questions</Text>
      </View>
      <TouchableOpacity className="p-1.5" onPress={onDelete} activeOpacity={0.7}>
        <Ionicons name="trash" size={20} color={colors.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
