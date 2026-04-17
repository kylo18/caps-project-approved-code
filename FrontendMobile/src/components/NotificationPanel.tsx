import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../src/services/apiClient';

export default function NotificationPanel({ visible, onClose }) {
  const router = useRouter();
  const isDark = false;

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (visible) fetchNotifications();
  }, [visible]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/notifications');
      const data = response?.data ?? response;
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationID) => {
    if (!notificationID) return;
    try {
      await apiRequest(`/api/notifications/${notificationID}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => {
          const id = n.notificationID ?? n.id ?? n.notification_id;
          return id === notificationID ? { ...n, isRead: true } : n;
        })
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const extractNotificationData = (notification: any) => {
    const raw = notification?.data;
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    if (typeof raw === 'object') return raw;
    return {};
  };

  const normalizeRoleLabel = (rawRole: any): string | null => {
    if (rawRole == null) return null;
    const value = String(rawRole).trim().toLowerCase();
    if (!value) return null;

    if (value === '4' || value.includes('dean')) return 'Dean';
    if (value === '5' || value.includes('associate dean')) return 'Program Chair';
    if (value === '3' || value.includes('program chair') || value.includes('chair')) return 'Program Chair';
    if (value === '2' || value.includes('faculty') || value.includes('teacher')) return 'Faculty';
    if (value === '1' || value.includes('student')) return 'Student';
    return null;
  };

  const getSenderLabel = (notification: any): string => {
    const data = extractNotificationData(notification);
    const roleLabel = normalizeRoleLabel(
      notification?.senderRole ||
      notification?.sender_role ||
      data?.senderRole ||
      data?.sender_role ||
      data?.roleID ||
      data?.role_id ||
      data?.role
    );

    const senderName =
      notification?.senderName ||
      notification?.sender_name ||
      data?.senderName ||
      data?.sender_name ||
      data?.from ||
      data?.created_by_name;

    if (senderName && roleLabel) return `${senderName} (${roleLabel})`;
    if (senderName) return senderName;
    if (roleLabel) return roleLabel;

    if (notification?.type === 'system_announcement') {
      return 'Administration';
    }

    return 'System';
  };

  const openNotificationDetail = (notification: any) => {
    setSelectedNotification({
      ...notification,
      senderLabel: getSenderLabel(notification),
      subject: notification?.title || 'Notification',
      body: notification?.message || 'No additional details available.',
      dateLabel: notification?.created_at
        ? new Date(notification.created_at).toLocaleString()
        : '',
    });
    setShowDetailModal(true);
  };

  const handleNotificationPress = (notification, notificationID) => {
    markAsRead(notificationID);

    if (notification.actionUrl) {
      onClose();
      router.push(notification.actionUrl);
      return;
    }

    openNotificationDetail(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'achievement': return 'trophy';
      case 'milestone': return 'flag';
      case 'lesson_available': return 'book';
      case 'enrollment': return 'school';
      case 'quiz_result': return 'clipboard';
      default: return 'notifications';
    }
  };

  const colors = {
    bg: 'rgba(0,0,0,0.5)',
    card: '#fff',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    orange: '#FE6902',
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={[styles.unreadText, { color: colors.orange }]}>{unreadCount} unread</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text style={[styles.markAllText, { color: colors.orange }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.orange} style={{ marginVertical: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications</Text>
            </View>
          ) : (
            <ScrollView style={styles.notificationList}>
              {notifications.map((notification, idx) => {
                const resolvedNotificationId =
                  notification.notificationID ?? notification.id ?? notification.notification_id;

                return (
                  <TouchableOpacity
                    key={resolvedNotificationId || idx}
                    style={[styles.notificationItem, { borderColor: colors.border }, !notification.isRead && { borderLeftWidth: 4, borderLeftColor: colors.orange }]}
                    onPress={() => {
                      handleNotificationPress(notification, resolvedNotificationId);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${colors.orange}20` }]}>
                      <Ionicons name={getNotificationIcon(notification.type)} size={20} color={colors.orange} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: colors.text }, !notification.isRead && { fontWeight: '700' }]} numberOfLines={2}>
                        {notification.title || notification.message || 'Notification'}
                      </Text>
                      <Text style={[styles.notificationDate, { color: colors.textSecondary }]}>
                        {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.detailOverlay}>
          <View style={[styles.detailContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>Notification Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedNotification ? (
              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailTopRow}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.orange }]}>
                    <Text style={styles.typeBadgeText}>
                      {selectedNotification.type === 'system_announcement' ? 'Announcement' : 'Notification'}
                    </Text>
                  </View>
                  <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                    {selectedNotification.dateLabel}
                  </Text>
                </View>

                <View style={[styles.detailSection, { borderColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Sender</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>{selectedNotification.senderLabel}</Text>
                </View>

                <View style={[styles.detailSection, { borderColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Subject</Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>{selectedNotification.subject}</Text>
                </View>

                <View style={[styles.detailSection, { borderColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Message</Text>
                  <Text style={[styles.sectionMessage, { color: colors.text }]}>{selectedNotification.body}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  unreadText: { fontSize: 12, marginTop: 2 },
  markAllText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  notificationList: { maxHeight: 500 },
  notificationItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8, gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 14, lineHeight: 20 },
  notificationDate: { fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FE6902' },
  detailOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  detailContainer: { maxHeight: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  detailBody: { padding: 16 },
  detailTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  detailDate: { fontSize: 12 },
  detailSection: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  sectionValue: { fontSize: 15, fontWeight: '500' },
  sectionMessage: { fontSize: 14, lineHeight: 22 },
});
