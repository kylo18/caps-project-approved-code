import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';

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
      {label && <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>{label}</Text>}
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-3 rounded-xl border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text className="text-sm flex-1 mr-2" style={{ color: selectedItem ? colors.text : colors.textSecondary }} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.bg }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="mx-5 rounded-t-3xl p-4" style={{ backgroundColor: colors.card, maxHeight: '60%' }}>
              {label && <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>{label}</Text>}
              <ScrollView nestedScrollEnabled style={{ maxHeight: 300 }}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center justify-between py-3 border-b gap-2"
                    style={{ borderBottomColor: colors.border, backgroundColor: selectedItem?.value === item.value ? `${colors.orange}15` : 'transparent' }}
                    onPress={() => {
                      onSelect(item.value, item);
                      setIsOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm flex-1" style={{ color: selectedItem?.value === item.value ? colors.orange : colors.text, fontWeight: selectedItem?.value === item.value ? '700' : '400' }} numberOfLines={2}>
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
