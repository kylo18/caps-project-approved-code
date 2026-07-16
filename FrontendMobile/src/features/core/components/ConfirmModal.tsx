import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../src/contexts/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#242424' : '#F3F4F6',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6B7280',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    accent: isDark ? '#FF8C00' : '#FE6902',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.58)' }}>
        <View className="w-full max-w-[340px] p-6 rounded-[24px] border" style={{ backgroundColor: colors.bg, borderColor: colors.border, elevation: 4 }}>
          <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>{title}</Text>
          <Text className="text-sm leading-5 mb-5" style={{ color: colors.textSecondary }}>{message}</Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity className="py-2.5 px-4 rounded-xl" style={{ backgroundColor: colors.surface }} onPress={onCancel} activeOpacity={0.7}>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-2.5 px-4 rounded-xl" style={{ backgroundColor: colors.accent }} onPress={onConfirm} activeOpacity={0.8}>
              <Text className="text-white text-sm font-semibold">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
