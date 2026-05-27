import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { getRoleThemeColors } from '../styles/roleTheme';

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
  const buttonRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find(i => i.value === selectedValue);
  const displayText = selectedItem?.label || placeholder;

  const roleColors = getRoleThemeColors(isDark);
  const colors = {
    bg: 'transparent',
    card: roleColors.surface,
    item: roleColors.surfaceSoft,
    text: roleColors.text,
    textSecondary: roleColors.muted,
    border: roleColors.border,
    orange: roleColors.accent,
  };

  const handleOpen = () => {
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setDropdownPosition({
        x: px,
        y: py + height,
        width: width,
      });
      setIsOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const handleSelect = (item: DropdownItem) => {
    onSelect(item.value, item);
    handleClose();
  };

  const shadowStyle = isDark ? {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  } : {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  };

  return (
    <>
      {label && <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>{label}</Text>}
      
      {/* Anchor View for measurement */}
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          className="flex-row items-center justify-between px-3 py-3 rounded-xl border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <Text className="text-sm flex-1 mr-2" style={{ color: selectedItem ? colors.text : colors.textSecondary }} numberOfLines={1}>
            {displayText}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        {/* Full-screen dismissable backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        {/* Dropdown Options List */}
        <Animated.View
          style={{
            position: 'absolute',
            left: dropdownPosition.x,
            top: dropdownPosition.y + 4,
            width: dropdownPosition.width,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            maxHeight: 250,
            overflow: 'hidden',
            ...shadowStyle,
          }}
        >
          <ScrollView nestedScrollEnabled style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center justify-between px-3 py-2.5 rounded-lg mb-0.5"
                style={{
                  backgroundColor: selectedItem?.value === item.value 
                    ? (isDark ? 'rgba(254, 105, 2, 0.15)' : 'rgba(254, 105, 2, 0.08)') 
                    : 'transparent'
                }}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm flex-1 mr-2"
                  style={{
                    color: selectedItem?.value === item.value ? colors.orange : colors.text,
                    fontWeight: selectedItem?.value === item.value ? '700' : '400',
                  }}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                {selectedItem?.value === item.value && (
                  <Ionicons name="checkmark" size={18} color={colors.orange} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}
