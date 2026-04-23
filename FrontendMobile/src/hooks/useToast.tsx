// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Toast notification hook for consistent mobile feedback.
//
// Features:
// - Three toast types: success, error, info
// - Auto-dismiss with configurable timing
// - Positioned at top with safe area offset
// - Mobile-optimized styling
//
// Usage:
// import { showToast } from '../../../src/hooks/useToast';
// showToast('Operation successful', 'success');
// showToast('Something went wrong', 'error');
// showToast('Info message', 'info');
// ─────────────────────────────────────────────────────────────────────────────

import Toast, { ToastConfig } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ToastComponent = ({ type, message }: { type: string; message: string }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const config = {
    success: {
      bg: isDark ? '#065F46' : '#D1FAE5',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      textColor: isDark ? '#ECFDF5' : '#065F43',
    },
    error: {
      bg: isDark ? '#991B1B' : '#FEE2E2',
      icon: 'alert-circle',
      iconColor: '#EF4444',
      textColor: isDark ? '#FEE2E2' : '#991B1B',
    },
    info: {
      bg: isDark ? '#1E3A5F' : '#DBEAFE',
      icon: 'information-circle',
      iconColor: '#3B82F6',
      textColor: isDark ? '#DBEAFE' : '#1E40AF',
    },
  };

  const toastConfig = config[type as keyof typeof config] || config.info;

  return (
    <View
      className="flex-row items-center py-3 px-4 rounded-xl mx-4 my-2"
      style={{ backgroundColor: toastConfig.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
    >
      <Ionicons name={toastConfig.icon as any} size={24} color={toastConfig.iconColor} />
      <Text className="text-sm font-semibold ml-3 flex-1" style={{ color: toastConfig.textColor }}>
        {message}
      </Text>
    </View>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => <ToastComponent type="success" message={props.text1 || ''} />,
  error: (props) => <ToastComponent type="error" message={props.text1 || ''} />,
  info: (props) => <ToastComponent type="info" message={props.text1 || ''} />,
};

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
    onPress: () => Toast.hide(),
  });
}

export function hideToast() {
  Toast.hide();
}
