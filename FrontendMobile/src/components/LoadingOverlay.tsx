import { View, ActivityIndicator, Modal, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function LoadingOverlay({ visible = false, message = 'Loading...' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff' }]}>
          <ActivityIndicator size="large" color="#FE6902" />
          {message && <Text style={[styles.message, { color: isDark ? '#f9fafb' : '#111827' }]}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, borderRadius: 16, alignItems: 'center', minWidth: 120 },
  message: { marginTop: 12, fontSize: 14, textAlign: 'center' },
});
