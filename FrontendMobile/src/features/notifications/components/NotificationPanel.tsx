import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../../../src/services/apiClient';
import { useTheme } from '../../../../src/contexts/ThemeContext';

export default function NotificationPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<any[]>([]);
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
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationID: any) => {
    if (!notificationID) return;
    try {
      await apiRequest(`/api/notifications/${notificationID}/read`, { method: 'PATCH' });
      setNotifications((prev: any[]) =>
        prev.map((n: any) => {
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
      setNotifications((prev: any[]) => prev.map((n: any) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getSenderLabel = (notification: any): string => {
    const raw = notification?.data;
    const data = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    const roleLabel = (() => {
      const v = notification?.senderRole || data?.senderRole || '';
      if (!v) return null;
      const s = String(v).toLowerCase();
      if (s === '4' || s.includes('dean')) return 'Dean';
      if (s === '5' || s.includes('associate dean')) return 'Associate Dean';
      if (s === '3' || s.includes('program chair') || s.includes('chair')) return 'Program Chair';
      if (s === '2' || s.includes('faculty') || s.includes('teacher')) return 'Faculty';
      if (s === '1' || s.includes('student')) return 'Student';
      return null;
    })();
    const senderName = notification?.senderName || data?.senderName || '';
    if (senderName && roleLabel) return `${senderName} (${roleLabel})`;
    if (senderName) return senderName;
    if (roleLabel) return roleLabel;
    if (notification?.type === 'system_announcement') return 'Administration';
    return 'System';
  };

  const openNotificationDetail = (notification: any) => {
    setSelectedNotification({
      ...notification,
      senderLabel: getSenderLabel(notification),
      subject: notification?.title || 'Notification',
      body: notification?.message || 'No additional details available.',
      dateLabel: notification?.created_at ? new Date(notification.created_at).toLocaleString() : '',
    });
    setShowDetailModal(true);
  };

  const handleNotificationPress = (notification: any) => {
    const resolvedNotificationId = notification.notificationID ?? notification.id ?? notification.notification_id;
    markAsRead(resolvedNotificationId);
    if (notification.actionUrl) {
      onClose();
      router.push(notification.actionUrl);
    } else {
      openNotificationDetail(notification);
    }
  };

  const getNotificationIcon = (type: any) => {
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
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.bg }}>
        <View className="rounded-t-3xl p-5 max-h-[85%]" style={{ backgroundColor: colors.card }}>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>Notifications</Text>
              {unreadCount > 0 && <Text className="text-sm mt-0.5" style={{ color: colors.orange }}>{unreadCount} unread</Text>}
            </View>
            <View className="flex-row items-center gap-3">
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
                  <Text className="text-sm font-semibold" style={{ color: colors.orange }}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-10">
              <CapsActivityIndicator size="large" color={colors.orange} />
            </View>
          ) : notifications.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Ionicons name="notifications-off" size={48} color={colors.textSecondary} />
              <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>You have no new notifications.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 400 }}>
              {notifications.map((notification, idx) => {
                const resolvedId = notification.notificationID ?? notification.id ?? notification.notification_id;
                return (
                  <TouchableOpacity
                    key={resolvedId || idx}
                    className="flex-row items-start gap-3 py-3 border-b"
                    style={{ borderBottomColor: colors.border, backgroundColor: !notification.isRead ? `${colors.orange}10` : 'transparent', borderLeftWidth: !notification.isRead ? 3 : 0, borderLeftColor: colors.orange }}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.orange}20` }}>
                      <Ionicons name={getNotificationIcon(notification.type)} size={20} color={colors.orange} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" numberOfLines={2} style={{ color: colors.text }}>{notification.title || notification.message || 'Notification'}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{notification.created_at ? new Date(notification.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    {!notification.isRead && <View className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.orange }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card }}>
            <View className="flex-row justify-between items-center pb-4 border-b mb-4" style={{ borderBottomColor: colors.border }}>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>Notification Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedNotification && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.orange }}>
                    <Text className="text-xs font-bold text-white">{selectedNotification.type === 'system_announcement' ? 'Announcement' : 'Notification'}</Text>
                  </View>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>{selectedNotification.dateLabel}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Sender</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedNotification.senderLabel}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Subject</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedNotification.subject}</Text>
                </View>

                <View>
                  <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Message</Text>
                  <Text className="text-sm leading-5" style={{ color: colors.text }}>{selectedNotification.body}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
