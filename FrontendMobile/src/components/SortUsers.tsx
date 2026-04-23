import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
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
      <TouchableOpacity
        className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg border"
        style={{ borderColor: colors.border }}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
        <Text className="text-sm" style={{ color: colors.text }}>{currentLabel}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.bg }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-bold" style={{ color: colors.text }}>Sort By</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  className="flex-row items-center justify-between py-3 border-b"
                  style={{ borderBottomColor: colors.border, backgroundColor: currentValue === option.value ? `${colors.orange}15` : 'transparent' }}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm"
                    style={{ color: currentValue === option.value ? colors.orange : colors.text, fontWeight: currentValue === option.value ? '700' : '400' }}
                  >
                    {option.label}
                  </Text>
                  {currentValue === option.value && <Ionicons name="checkmark" size={20} color={colors.orange} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
