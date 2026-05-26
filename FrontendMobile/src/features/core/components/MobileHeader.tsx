// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Mobile-native header component using NativeWind/Tailwind CSS.
//          Unlike the web-style Header.tsx, this embeds directly into the screen
//          without visible borders or boxes - matching the student dashboard pattern.
//
// Features:
//   - Title display (optional)
//   - Help button → Opens HelpCenterModal
//   - Notifications button → Opens NotificationPanel (with unread badge)
//   - Theme toggle → Dark/light mode switch
//   - Profile avatar → Opens profile menu (edit profile, logout)
//
// Props:
//   - title: Optional screen title
//   - showTitle: Whether to show the title (default: true)
//   - showBack: Optional back arrow visibility
//   - onBack: Optional custom back press handler
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../store/slices/authSlice';
import { logoutUser } from '../../../utils/logoutUser';
import { useTheme } from '../../../contexts/ThemeContext';
import { unregisterStoredPushToken } from '../../../services/pushNotificationService';
import NotificationPanel from '../../../features/notifications/components/NotificationPanel';
import { getUnreadCount } from '../../../services/notificationService';
import EditProfileModal from '../../../features/profile/components/EditProfileModal';
import ConfirmModal from '../../../features/core/components/ConfirmModal';
import HelpCenterModal from '../../../features/support/components/HelpCenterModal';

interface MobileHeaderProps {
    title?: string;
    showTitle?: boolean;
    showBack?: boolean;
    onBack?: () => void;
}

const AVATAR_COLORS = [
    '#FE6902', '#10B981', '#3B82F6', '#8B5CF6',
    '#EF4444', '#F59E0B', '#14B8A6', '#6366F1'
];

export default function MobileHeader({ title, showTitle = true, showBack = false, onBack }: MobileHeaderProps) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const auth = useSelector((state: any) => state.auth);
    const user = auth?.user;
    const insets = useSafeAreaInsets();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const firstName = user?.firstName || 'User';
    const email = user?.email || '';
    const initials = `${firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
    const avatarColor = AVATAR_COLORS[(user?.userID || 0) % AVATAR_COLORS.length];
    const colors = {
        bg: isDark ? '#0F0F0F' : '#F7F8FA',
        surface: isDark ? '#1A1A1A' : '#FFFFFF',
        surfaceSoft: isDark ? '#242424' : '#F2F4F7',
        text: isDark ? '#F5F5F5' : '#111827',
        muted: isDark ? '#A3A3A3' : '#6B7280',
        border: isDark ? '#2A2A2A' : '#E5E7EB',
        accent: isDark ? '#FF8C00' : '#FE6902',
    };

    const handleLogout = async () => {
        await logoutUser();
        dispatch(logout());
        router.replace('/');
    };

    const refreshUnreadCount = useCallback(async () => {
        const result = await getUnreadCount();
        setUnreadCount(result.count);
    }, []);

    useEffect(() => {
        void refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 30_000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    return (
        <>
            {/* Main Header Row - No border, embedded in screen */}
            <View
                className="flex-row items-center justify-between px-4 pb-3"
                style={{ paddingTop: insets.top + 12, backgroundColor: colors.bg }}
            >
                {/* Left: Title & Back Button */}
                <View className="flex-row items-center flex-1 mr-2" style={{ gap: 4 }}>
                    {showBack && (
                        <Pressable
                            onPress={onBack || (() => router.back())}
                            className="p-2 -ml-2 rounded-full"
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={colors.text}
                            />
                        </Pressable>
                    )}
                    {showTitle && (
                        <Text
                            className="text-xl font-bold"
                            style={{ color: colors.text }}
                        >
                            {title}
                        </Text>
                    )}
                </View>

                {/* Right: Action Icons */}
                <View className="flex-row items-center gap-2">
                    {/* Help Button */}
                    <Pressable
                        className="w-9 h-9 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.surface }}
                        onPress={() => setShowHelp(true)}
                    >
                        <Ionicons
                            name="help-circle-outline"
                            size={20}
                            color={colors.text}
                        />
                    </Pressable>

                    {/* Notifications Button */}
                    <Pressable
                        className="w-9 h-9 rounded-full items-center justify-center relative"
                        style={{ backgroundColor: colors.surface }}
                        onPress={() => setShowNotifications(true)}
                    >
                        <Ionicons
                            name="notifications-outline"
                            size={20}
                            color={colors.text}
                        />
                        {unreadCount > 0 && (
                            <View className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error rounded-full items-center justify-center">
                                <Text className="text-white text-[10px] font-bold">
                                    {Math.min(unreadCount, 99)}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Theme Toggle */}
                    <Pressable
                        className="w-9 h-9 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.surface }}
                        onPress={toggleTheme}
                    >
                        <Ionicons
                            name={isDark ? 'sunny' : 'moon'}
                            size={20}
                            color={isDark ? '#FF8C00' : colors.text}
                        />
                    </Pressable>

                    {/* Profile Avatar */}
                    <Pressable
                        className="flex-row items-center gap-2 ml-1"
                        onPress={() => setShowProfileMenu(true)}
                    >
                        <View
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: avatarColor }}
                        >
                            <Text className="text-white text-xs font-extrabold">
                                {initials}
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Profile Menu Modal */}
            <Modal
                visible={showProfileMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50"
                    onPress={() => setShowProfileMenu(false)}
                >
                    <Pressable
                        className="mt-16 mx-4 rounded-2xl p-4 border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Profile Header */}
                        <View className="flex-row items-center gap-3 pb-4 mb-3 border-b" style={{ borderBottomColor: colors.border }}>
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center"
                                style={{ backgroundColor: avatarColor }}
                            >
                                <Text className="text-white text-lg font-extrabold">
                                    {initials}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold" style={{ color: colors.text }}>
                                    {firstName} {user?.lastName || ''}
                                </Text>
                                <Text
                                    className="text-sm"
                                    style={{ color: colors.muted }}
                                    numberOfLines={1}
                                >
                                    {email}
                                </Text>
                            </View>
                        </View>

                        {/* Menu Items */}
                        <Pressable
                            className="flex-row items-center gap-3 py-3"
                            onPress={() => {
                                setShowProfileMenu(false);
                                setShowEditProfile(true);
                            }}
                        >
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={colors.text}
                            />
                            <Text style={{ color: colors.text }}>
                                Edit Profile
                            </Text>
                        </Pressable>

                        <Pressable
                            className="flex-row items-center gap-3 py-3"
                            onPress={() => {
                                setShowProfileMenu(false);
                                toggleTheme();
                            }}
                        >
                            <Ionicons
                                name={isDark ? 'sunny' : 'moon'}
                                size={20}
                                color={colors.text}
                            />
                            <Text style={{ color: colors.text }}>
                                {isDark ? 'Light Mode' : 'Dark Mode'}
                            </Text>
                        </Pressable>

                        <Pressable
                            className="flex-row items-center gap-3 py-3 mt-2 border-t"
                            style={{ borderTopColor: colors.border }}
                            onPress={() => {
                                setShowProfileMenu(false);
                                setShowLogoutConfirm(true);
                            }}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            <Text className="text-error font-medium">Log Out</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Modals */}
            <NotificationPanel
                visible={showNotifications}
                onClose={() => {
                    setShowNotifications(false);
                    void refreshUnreadCount();
                }}
            />
            <EditProfileModal
                visible={showEditProfile}
                onClose={() => setShowEditProfile(false)}
                user={user}
            />
            <HelpCenterModal
                visible={showHelp}
                onClose={() => setShowHelp(false)}
                userRole={user?.roleID}
            />
            <ConfirmModal
                visible={showLogoutConfirm}
                title="Log Out"
                message="Are you sure you want to log out?"
                confirmText="Log Out"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </>
    );
}
