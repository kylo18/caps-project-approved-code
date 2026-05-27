// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin Support Tickets screen — lists all student support requests
//          with status management and detail view functionality.
// Key sections: Ticket list with status badges, detail modal, status cycling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import {
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addTicketResponse,
  SUPPORT_TICKET_RESPONSES_SUPPORTED,
  getNextStatus,
  getStatusColor,
  getStatusLabel,
  type SupportTicket,
  type SupportTicketDetail,
} from '../../../src/services/adminSupportService';

export default function AdminSupportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Response state
  const [responseMessage, setResponseMessage] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data } = await getSupportTickets();
      setTickets(data);
    } catch (error) {
      showToast('Unable to load tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets();
    setIsRefreshing(false);
  };

  const handleViewTicket = async (ticketID: number) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const { data } = await getSupportTicketById(ticketID);
      setSelectedTicket(data);

      // Auto-transition pending to in_review when admin views
      if (data && data.status === 'pending') {
        await handleStatusUpdate(ticketID, 'pending', false);
      }
    } catch (error) {
      showToast('Failed to load ticket details', 'error');
      setShowDetailModal(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusUpdate = async (ticketID: number, currentStatus: string, showToastMessage: boolean = true) => {
    const nextStatus = getNextStatus(currentStatus);
    try {
      const { success, data } = await updateSupportTicketStatus(ticketID, nextStatus);
      if (success) {
        setTickets(prev => prev.map(t => t.ticketID === ticketID ? { ...t, status: nextStatus } : t));
        if (selectedTicket?.ticketID === ticketID) {
          setSelectedTicket(prev => prev ? { ...prev, status: nextStatus } : null);
        }
        if (showToastMessage) {
          showToast(`Status updated to ${getStatusLabel(nextStatus)}`, 'success');
        }
      }
    } catch (error) {
      showToast('Failed to update ticket', 'error');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    if (!SUPPORT_TICKET_RESPONSES_SUPPORTED) {
      showToast('Ticket responses are not supported by this server yet.', 'info');
      return;
    }

    setIsSendingResponse(true);
    try {
      const { success } = await addTicketResponse(selectedTicket.ticketID, responseMessage.trim());
      if (success) {
        showToast('Response sent', 'success');
        setResponseMessage('');
        // Refresh ticket details
        const { data } = await getSupportTicketById(selectedTicket.ticketID);
        setSelectedTicket(data);
      }
    } catch (error) {
      showToast('Failed to send response', 'error');
    } finally {
      setIsSendingResponse(false);
    }
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedTicket(null);
    setResponseMessage('');
  };

  const colors = {
    bg: isDark ? '#0F0F0F' : '#f3f4f6',
    card: isDark ? '#1A1A1A' : '#fff',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6b7280',
    border: isDark ? '#2A2A2A' : '#e5e7eb',
    orange: '#FE6902',
    green: '#10B981',
    yellow: '#F59E0B',
    blue: '#3B82F6',
    red: '#EF4444',
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={[styles.ticketCard, { backgroundColor: colors.card }]}
        onPress={() => handleViewTicket(item.ticketID)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
          <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={1}>
          {item.subject}
        </Text>
        <Text style={[styles.ticketMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.ticketFooter}>
          <View>
            <Text style={[styles.ticketStudent, { color: colors.text }]}>
              {item.studentName || `Student #${item.studentID}`}
            </Text>
            {item.studentEmail && (
              <Text style={[styles.ticketEmail, { color: colors.textSecondary }]}>{item.studentEmail}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: statusColor }]}
            onPress={() => handleStatusUpdate(item.ticketID, item.status)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>
              {item.status === 'pending' ? 'Review' : item.status === 'in_review' ? 'Resolve' : 'Reopen'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
      <Ionicons name="mail-open" size={64} color={colors.orange} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No support tickets to review right now.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
        <View style={styles.headerStats}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {tickets.filter(t => t.status === 'pending').length} open
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CapsActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketID.toString()}
          renderItem={renderTicketItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ticket Details</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isLoadingDetail ? (
              <View style={styles.modalLoading}>
                <CapsActivityIndicator size="large" color={colors.orange} />
              </View>
            ) : selectedTicket ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Status & Date */}
                <View style={styles.detailRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(selectedTicket.status)}</Text>
                  </View>
                  <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Student Info */}
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Student</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {selectedTicket.studentName || `Student #${selectedTicket.studentID}`}
                  </Text>
                  {selectedTicket.studentEmail && (
                    <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>
                      {selectedTicket.studentEmail}
                    </Text>
                  )}
                  {selectedTicket.userCode && (
                    <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>
                      Code: {selectedTicket.userCode}
                    </Text>
                  )}
                </View>

                {/* Subject */}
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Subject</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>{selectedTicket.subject}</Text>
                </View>

                {/* Message */}
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Message</Text>
                  <Text style={[styles.detailMessage, { color: colors.text }]}>{selectedTicket.message}</Text>
                </View>

                {SUPPORT_TICKET_RESPONSES_SUPPORTED ? (
                  <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Your Response</Text>
                    <TextInput
                      style={[styles.responseInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                      value={responseMessage}
                      onChangeText={setResponseMessage}
                      placeholder="Type your response..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, { opacity: isSendingResponse || !responseMessage.trim() ? 0.6 : 1 }]}
                      onPress={handleSendResponse}
                      disabled={isSendingResponse || !responseMessage.trim()}
                    >
                      {isSendingResponse ? (
                        <CapsActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="send" size={18} color="#fff" />
                          <Text style={styles.sendBtnText}>Send Response</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Responses</Text>
                    <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>
                      Ticket responses are not supported by this server yet.
                    </Text>
                  </View>
                )}

                {/* Status Actions */}
                <View style={styles.statusActions}>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: getStatusColor(selectedTicket.status) }]}
                    onPress={() => handleStatusUpdate(selectedTicket.ticketID, selectedTicket.status)}
                  >
                    <Text style={styles.statusBtnText}>
                      {selectedTicket.status === 'pending'
                        ? 'Mark In Review'
                        : selectedTicket.status === 'in_review'
                          ? 'Mark Resolved'
                          : 'Reopen Ticket'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerStats: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statsText: { fontSize: 12, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 12 },
  emptyState: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  ticketCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ticketDate: { fontSize: 12 },
  ticketSubject: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  ticketMessage: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketStudent: { fontSize: 13, fontWeight: '600' },
  ticketEmail: { fontSize: 11, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalLoading: { padding: 40, alignItems: 'center' },
  modalBody: { padding: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailDate: { fontSize: 12 },
  detailSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  detailText: { fontSize: 15, fontWeight: '500' },
  detailSubtext: { fontSize: 13, marginTop: 4 },
  detailMessage: { fontSize: 14, lineHeight: 22 },
  responseInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginTop: 8,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FE6902',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statusActions: { marginTop: 16 },
  statusBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
