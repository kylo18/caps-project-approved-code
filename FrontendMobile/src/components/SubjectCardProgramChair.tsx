import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../src/services/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { showToast } from '../../src/hooks/useToast';

export default function SubjectCardProgramChair({ subject, onDelete, onPress }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
    red: '#EF4444',
  };

  const handleDelete = () => {
    Alert.alert('Delete Subject', `Are you sure you want to delete ${subject?.subjectName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/api/subjects/${subject?.subjectID}/delete`, { method: 'DELETE' });
            showToast('Subject deleted', 'success');
            if (onDelete) onDelete(subject?.subjectID);
          } catch (error) {
            showToast('Failed to delete subject', 'error');
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.subjectIcon}>
        <Ionicons name="book" size={24} color={colors.orange} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>{subject?.subjectName || 'Unknown Subject'}</Text>
        <Text style={[styles.subjectMeta, { color: colors.textSecondary }]}>{subject?.subjectCode || 'GEN'} • {subject?.questionCount || 0} questions</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
        <Ionicons name="trash" size={20} color={colors.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, gap: 12, elevation: 2, marginBottom: 10 },
  subjectIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700' },
  subjectMeta: { fontSize: 13, marginTop: 2 },
  deleteBtn: { padding: 6 },
});
