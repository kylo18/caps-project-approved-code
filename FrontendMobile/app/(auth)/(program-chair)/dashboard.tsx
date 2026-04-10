// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair dashboard landing page — provides a quick-link card to
//          the Program Subjects management screen for overseeing all subjects and
//          questions within the program chair's program.
// Key sections: Header (with title), placeholder card with "Go to Subjects" CTA.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../src/contexts/ThemeContext';
import Header from '../../../src/components/Header';

export default function ProgramChairDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state) => state.auth);
  const user = auth.user;
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  const firstName = user?.firstName || 'Program Chair';

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Program Chair" />
      <View style={[styles.content, { paddingBottom: safeBottom + 20 }]}>
        <View style={[styles.placeholderCard, { backgroundColor: colors.card }]}>
          <Ionicons name="school" size={48} color={colors.orange} />
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Program Subjects</Text>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Manage all subjects and questions in your program
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/(program-chair)/subjects')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Go to Subjects</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  placeholderCard: { flex: 1, borderRadius: 24, padding: 32, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  placeholderTitle: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  placeholderText: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FE6902', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
});
