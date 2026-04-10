// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin Support Tickets screen — lists all student support requests and
//          allows admins to cycle ticket status through pending -> in_review ->
//          resolved -> reopened. Displays ticket details including subject,
//          message, student ID, and creation date.
// Key sections: Header with back button, ticket cards (with status badges and
//               action buttons), empty state, pull-to-refresh.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function AdminSupportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/admin/support/tickets');
      setTickets(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Unable to load tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketID, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'in_review' : currentStatus === 'in_review' ? 'resolved' : 'pending';
    try {
      await apiRequest(`/api/admin/support/tickets/${ticketID}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      setTickets(prev => prev.map(t => t.ticketID === ticketID ? { ...t, status: nextStatus } : t));
      showToast(`Status updated to ${nextStatus.replace('_', ' ')}`, 'success');
    } catch (error) {
      showToast('Failed to update ticket', 'error');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets();
    setIsRefreshing(false);
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
    green: '#10B981',
    yellow: '#F59E0B',
    blue: '#3B82F6',
  };

  const statusColors = {
    pending: colors.yellow,
    in_review: colors.blue,
    resolved: colors.green,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} />}>
          {tickets.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="mail" size={48} color={colors.orange} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tickets</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All caught up! No support requests.</Text>
            </View>
          ) : (
            tickets.map(ticket => (
              <TouchableOpacity key={ticket.ticketID} style={[styles.ticketCard, { backgroundColor: colors.card }]} activeOpacity={0.7}>
                <View style={styles.ticketHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[ticket.status] || colors.yellow }]}>
                    <Text style={styles.statusText}>{ticket.status?.replace('_', ' ') || 'pending'}</Text>
                  </View>
                  <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={1}>{ticket.subject || 'No Subject'}</Text>
                <Text style={[styles.ticketMessage, { color: colors.textSecondary }]} numberOfLines={2}>{ticket.message || ''}</Text>
                <View style={styles.ticketFooter}>
                  <Text style={[styles.ticketStudent, { color: colors.text }]}>Student #{ticket.studentID || 'N/A'}</Text>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: statusColors[ticket.status] || colors.yellow }]} onPress={() => handleStatusUpdate(ticket.ticketID, ticket.status)} activeOpacity={0.7}>
                    <Text style={styles.actionBtnText}>
                      {ticket.status === 'pending' ? 'Mark In Review' : ticket.status === 'in_review' ? 'Resolve' : 'Reopen'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 100, gap: 12 },
  emptyState: { borderRadius: 24, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  ticketCard: { borderRadius: 16, padding: 16, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ticketDate: { fontSize: 12 },
  ticketSubject: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  ticketMessage: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketStudent: { fontSize: 13, fontWeight: '600' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
