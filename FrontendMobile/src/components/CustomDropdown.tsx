import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

interface DropdownItem {
  id: string | number;
  label: string;
  value: any;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValue: any;
  onSelect: (value: any, item: DropdownItem) => void;
  placeholder?: string;
  label?: string;
}

export default function CustomDropdown({ items, selectedValue, onSelect, placeholder = 'Select...', label }: CustomDropdownProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find(i => i.value === selectedValue);
  const displayText = selectedItem?.label || placeholder;

  const colors = {
    bg: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
  };

  return (
    <>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectedText, { color: selectedItem ? colors.text : colors.textSecondary }]} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.bg }]} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
              {label && <Text style={[styles.optionsTitle, { color: colors.text }]}>{label}</Text>}
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionItem, { borderBottomColor: colors.border }, selectedItem?.value === item.value && { backgroundColor: `${colors.orange}15` }]}
                    onPress={() => {
                      onSelect(item.value, item);
                      setIsOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, { color: colors.text }, selectedItem?.value === item.value && { color: colors.orange, fontWeight: '700' }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                    {selectedItem?.value === item.value && <Ionicons name="checkmark" size={20} color={colors.orange} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 12 },
  selectedText: { fontSize: 15, flex: 1, marginRight: 8 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  optionsCard: { marginHorizontal: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '60%' },
  optionsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  optionsList: { maxHeight: 300 },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  optionText: { fontSize: 15, flex: 1 },
});
