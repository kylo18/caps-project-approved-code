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
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import NotificationPanel from './NotificationPanel';
import EditProfileModal from './EditProfileModal';
import ConfirmModal from './ConfirmModal';
import HelpCenterModal from './HelpCenterModal';

interface MobileHeaderProps {
    title?: string;
    showTitle?: boolean;
}

const AVATAR_COLORS = [
    '#FE6902', '#10B981', '#3B82F6', '#8B5CF6',
    '#EF4444', '#F59E0B', '#14B8A6', '#6366F1'
];

export default function MobileHeader({ title, showTitle = true }: MobileHeaderProps) {
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

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            dispatch(logout());
            router.replace('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            {/* Main Header Row - No border, embedded in screen */}
            <View
                className={`
          flex-row items-center justify-between px-4 pb-3
          ${isDark ? 'bg-background-dark' : 'bg-background-light'}
        `}
                style={{ paddingTop: insets.top + 12 }}
            >
                {/* Left: Title */}
                {showTitle && (
                    <Text
                        className={`
              text-xl font-bold
              ${isDark ? 'text-foreground-dark' : 'text-foreground-light'}
            `}
                    >
                        {title}
                    </Text>
                )}

                {/* Right: Action Icons */}
                <View className="flex-row items-center gap-2">
                    {/* Help Button */}
                    <Pressable
                        className={`
              w-9 h-9 rounded-full items-center justify-center
              ${isDark ? 'bg-border-dark' : 'bg-background-secondary-light'}
            `}
                        onPress={() => setShowHelp(true)}
                    >
                        <Ionicons
                            name="help-circle-outline"
                            size={20}
                            color={isDark ? '#F9FAFB' : '#111827'}
                        />
                    </Pressable>

                    {/* Notifications Button */}
                    <Pressable
                        className={`
              w-9 h-9 rounded-full items-center justify-center relative
              ${isDark ? 'bg-border-dark' : 'bg-background-secondary-light'}
            `}
                        onPress={() => setShowNotifications(true)}
                    >
                        <Ionicons
                            name="notifications-outline"
                            size={20}
                            color={isDark ? '#F9FAFB' : '#111827'}
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
                        className={`
              w-9 h-9 rounded-full items-center justify-center
              ${isDark ? 'bg-border-dark' : 'bg-background-secondary-light'}
            `}
                        onPress={toggleTheme}
                    >
                        <Ionicons
                            name={isDark ? 'sunny' : 'moon'}
                            size={20}
                            color={isDark ? '#F9FAFB' : '#111827'}
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
                        className={`
              mt-16 mx-4 rounded-2xl p-4
              ${isDark ? 'bg-background-dark' : 'bg-background-light'}
            `}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Profile Header */}
                        <View className="flex-row items-center gap-3 pb-4 mb-3 border-b border-border-light dark:border-border-dark">
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center"
                                style={{ backgroundColor: avatarColor }}
                            >
                                <Text className="text-white text-lg font-extrabold">
                                    {initials}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className={`font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground-light'}`}>
                                    {firstName} {user?.lastName || ''}
                                </Text>
                                <Text
                                    className={`text-sm ${isDark ? 'text-foreground-muted-dark' : 'text-foreground-muted-light'}`}
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
                                color={isDark ? '#F9FAFB' : '#111827'}
                            />
                            <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground-light'}`}>
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
                                color={isDark ? '#F9FAFB' : '#111827'}
                            />
                            <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground-light'}`}>
                                {isDark ? 'Light Mode' : 'Dark Mode'}
                            </Text>
                        </Pressable>

                        <Pressable
                            className="flex-row items-center gap-3 py-3 mt-2 border-t border-border-light dark:border-border-dark"
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
                onClose={() => setShowNotifications(false)}
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
