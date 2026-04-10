// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin (Dean) dashboard — fetches and displays key platform stats
//          (approved questions, active users, subjects) and provides quick-link
//          cards to sub-pages: Subjects, Users, Analytics, and Support.
// Key sections: Header, stats row (3 stat cards with counts), actions row
//               (Analytics and Support cards), loading state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import Header from '../../../src/components/Header';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state) => state.auth);
  const user = auth.user;
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  const [stats, setStats] = useState({ questions: 0, users: 0, subjects: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [qRes, uRes, sRes] = await Promise.all([
        apiRequest('/api/questions/count'),
        apiRequest('/api/users?limit=10000'),
        apiRequest('/api/subjects'),
      ]);
      const questions = Array.isArray(qRes?.data) ? qRes.data : [];
      const approvedCount = questions.filter((q) => q.status_id === 2).length;
      const users = Array.isArray(uRes?.users) ? uRes.users : Array.isArray(uRes?.data) ? uRes.data : [];
      const activeUsers = users.filter((u) => u.status === 'registered' && u.isActive).length;
      const subjects = Array.isArray(sRes?.data) ? sRes.data : Array.isArray(sRes) ? sRes : [];
      setStats({ questions: approvedCount, users: activeUsers, subjects: subjects.length });
    } catch (error) { console.error('Error fetching stats:', error); }
    finally { setIsLoading(false); }
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
  };

  const cards = [
    { icon: 'help-circle', label: 'Questions', value: stats.questions, color: '#FE6902', route: '/(auth)/(dean)/subjects' },
    { icon: 'people', label: 'Users', value: stats.users, color: '#10B981', route: '/(auth)/(dean)/users' },
    { icon: 'book', label: 'Subjects', value: stats.subjects, color: '#3B82F6', route: '/(auth)/(dean)/subjects' },
    { icon: 'analytics', label: 'Analytics', value: null, color: '#8B5CF6', route: '/(auth)/(dean)/analytics' },
    { icon: 'headset', label: 'Support', value: null, color: '#EF4444', route: '/(auth)/(dean)/support' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Admin Dashboard" />
      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: safeBottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            {cards.slice(0, 3).map((card, idx) => (
              <TouchableOpacity key={idx} style={[styles.statCard, { backgroundColor: colors.card }]} onPress={() => router.push(card.route)} activeOpacity={0.8}>
                <Ionicons name={card.icon} size={28} color={card.color} />
                <Text style={[styles.statValue, { color: colors.text }]}>{card.value ?? '--'}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionsRow}>
            {cards.slice(3).map((card, idx) => (
              <TouchableOpacity key={idx} style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => router.push(card.route)} activeOpacity={0.8}>
                <Ionicons name={card.icon} size={32} color={card.color} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flexGrow: 1, padding: 20, paddingBottom: 100, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2 },
  actionLabel: { fontSize: 14, fontWeight: '600', marginTop: 12 },
});
