import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

const sortOptions = [
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Date (Newest)', value: 'date_desc' },
  { label: 'Date (Oldest)', value: 'date_asc' },
  { label: 'Status', value: 'status' },
  { label: 'Role', value: 'role' },
];

export default function SortUsers({ onSelect, currentValue }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [visible, setVisible] = useState(false);

  const colors = {
    bg: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
  };

  const handleSelect = (value) => {
    if (onSelect) onSelect(value);
    setVisible(false);
  };

  const currentLabel = sortOptions.find(o => o.value === currentValue)?.label || 'Sort';

  return (
    <>
      <TouchableOpacity style={[styles.button, { borderColor: colors.border }]} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
        <Text style={[styles.buttonText, { color: colors.text }]}>{currentLabel}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
          <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Sort By</Text>
              <TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>

            {sortOptions.map(option => (
              <TouchableOpacity key={option.value} style={[styles.option, { borderBottomColor: colors.border }, currentValue === option.value && { backgroundColor: `${colors.orange}15` }]} onPress={() => handleSelect(option.value)} activeOpacity={0.7}>
                <Text style={[styles.optionText, { color: colors.text }, currentValue === option.value && { color: colors.orange, fontWeight: '700' }]}>{option.label}</Text>
                {currentValue === option.value && <Ionicons name="checkmark" size={20} color={colors.orange} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  buttonText: { fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  optionText: { fontSize: 15 },
});
