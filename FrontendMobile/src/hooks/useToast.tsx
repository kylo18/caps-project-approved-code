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
//
// ─────────────────────────────────────────────────────────────────────────────

import Toast, { ToastConfig } from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Toast Component - Custom render for mobile-native look
// ─────────────────────────────────────────────────────────────────────────────

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
    <View style={[styles.toastContainer, { backgroundColor: toastConfig.bg }]}>
      <Ionicons name={toastConfig.icon as any} size={24} color={toastConfig.iconColor} />
      <Text style={[styles.toastText, { color: toastConfig.textColor }]}>{message}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const toastConfig: ToastConfig = {
  success: (props) => (
    <ToastComponent type="success" message={props.text1 || ''} />
  ),
  error: (props) => (
    <ToastComponent type="error" message={props.text1 || ''} />
  ),
  info: (props) => (
    <ToastComponent type="info" message={props.text1 || ''} />
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Display Function
// ─────────────────────────────────────────────────────────────────────────────

export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info'
) {
  Toast.show({
    type: type,
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

// ─────────────────────────────────────────────────────────────────────────────
// Toast Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});
