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
    try {
      await apiRequest(`/api/notifications/${notificationID}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.notificationID === notificationID ? { ...n, isRead: true } : n));
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
              {notifications.map((notification, idx) => (
                <TouchableOpacity
                  key={notification.notificationID || idx}
                  style={[styles.notificationItem, { borderColor: colors.border }, !notification.isRead && { borderLeftWidth: 4, borderLeftColor: colors.orange }]}
                  onPress={() => {
                    markAsRead(notification.notificationID);
                    if (notification.actionUrl) {
                      onClose();
                      router.push(notification.actionUrl);
                    }
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
              ))}
            </ScrollView>
          )}
        </View>
      </View>
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
});
