/**
 * Notification Service
 * Handles notification management for the CAPS mobile app
 */

import { apiRequest } from './apiClient';
import {
    registerForPushNotificationsAsync,
    registerPushTokenWithBackend,
    setNotificationHandler,
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
} from './pushNotificationService';

export {
    registerForPushNotificationsAsync,
    registerPushTokenWithBackend,
    setNotificationHandler,
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
};

// Types
export interface Notification {
    notificationID: number;
    userID: number;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    actionUrl?: string;
    created_at: string;
}

export type NotificationType =
    | 'achievement'
    | 'milestone'
    | 'lesson_available'
    | 'enrollment'
    | 'quiz_result'
    | 'system_announcement'
    | 'reminder'
    | 'general';

export interface NotificationListResponse {
    notifications: Notification[];
    unreadCount: number;
    total: number;
}

/**
 * Map notification type to Expo Router action URL
 */
export function resolveNotificationActionUrl(type: string, data?: Record<string, unknown>): string | null {
    switch (type) {
        case 'achievement':
        case 'milestone':
            return '/(auth)/(student)/insights';
        case 'lesson_available':
        case 'enrollment':
            return '/(auth)/(student)/dashboard';
        case 'quiz_result':
            return '/(auth)/practice-exam/results';
        case 'system_announcement':
            return null; // No navigation needed
        case 'reminder':
            return '/(auth)/(student)/dashboard';
        default:
            return null;
    }
}

/**
 * Get icon name for notification type
 */
export function getNotificationIcon(type: string): string {
    switch (type) {
        case 'achievement':
            return 'trophy';
        case 'milestone':
            return 'flag';
        case 'lesson_available':
            return 'book';
        case 'enrollment':
            return 'school';
        case 'quiz_result':
            return 'clipboard';
        case 'system_announcement':
            return 'megaphone';
        case 'reminder':
            return 'alarm';
        default:
            return 'notifications';
    }
}

/**
 * Get color for notification type
 */
export function getNotificationColor(type: string): string {
    switch (type) {
        case 'achievement':
            return '#FFD45C'; // gold
        case 'milestone':
            return '#8B5CF6'; // purple
        case 'lesson_available':
            return '#10B981'; // green
        case 'enrollment':
            return '#3B82F6'; // blue
        case 'quiz_result':
            return '#FE6902'; // orange
        case 'system_announcement':
            return '#EF4444'; // red
        case 'reminder':
            return '#F59E0B'; // amber
        default:
            return '#6B7280'; // gray
    }
}

/**
 * Normalize notification data from API response
 */
interface NotificationApiItem {
    notificationID?: number;
    id?: number;
    notification_id?: number;
    userID?: number;
    user_id?: number;
    type?: string;
    title?: string;
    message?: string;
    isRead?: boolean;
    is_read?: boolean;
    read?: boolean;
    actionUrl?: string;
    action_url?: string;
    data?: Record<string, unknown>;
    created_at?: string;
    createdAt?: string;
}

function normalizeNotification(item: NotificationApiItem): Notification {
    return {
        notificationID: item.notificationID ?? item.id ?? item.notification_id ?? 0,
        userID: item.userID ?? item.user_id ?? 0,
        type: (item.type || 'general') as NotificationType,
        title: item.title || item.message?.slice(0, 50) || 'Notification',
        message: item.message || '',
        isRead: Boolean(item.isRead ?? item.is_read ?? item.read),
        actionUrl: (item.actionUrl || item.action_url || (item.type ? resolveNotificationActionUrl(item.type, item.data) : undefined)) ?? undefined,
        created_at: item.created_at || item.createdAt || '',
    };
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(): Promise<{ data: Notification[]; unreadCount: number }> {
    try {
        const response = await apiRequest('/api/notifications');
        const items = response?.data ?? response ?? [];

        const data = (Array.isArray(items) ? items : []).map(normalizeNotification);

        // Sort by created_at descending (newest first)
        data.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });

        const unreadCount = data.filter(n => !n.isRead).length;

        return { data, unreadCount };
    } catch (error) {
        console.error('Failed to get notifications:', error);
        return { data: [], unreadCount: 0 };
    }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationID: number): Promise<{ success: boolean }> {
    try {
        await apiRequest(`/api/notifications/${notificationID}/read`, {
            method: 'PATCH',
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return { success: false };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
    try {
        await apiRequest('/api/notifications/mark-all-read', {
            method: 'POST',
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        return { success: false };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationID: number): Promise<{ success: boolean }> {
    try {
        await apiRequest(`/api/notifications/${notificationID}`, {
            method: 'DELETE',
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to delete notification:', error);
        return { success: false };
    }
}

/**
 * Get unread notification count (lightweight endpoint)
 */
export async function getUnreadCount(): Promise<{ count: number }> {
    try {
        const response = await apiRequest('/api/notifications/unread-count');
        return { count: response?.count ?? response?.data?.count ?? 0 };
    } catch (error) {
        console.error('Failed to get unread count:', error);
        return { count: 0 };
    }
}

/**
 * Format relative time for notification display
 */
export function formatRelativeTime(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}
