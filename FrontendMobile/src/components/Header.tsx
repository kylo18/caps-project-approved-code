import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../src/store/slices/authSlice';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import NotificationPanel from './NotificationPanel';
import EditProfileModal from './EditProfileModal';
import ConfirmModal from './ConfirmModal';
import HelpCenterModal from './HelpCenterModal';
import collegeLogo from '../../assets/college-logo.png';

export default function Header({ title, isStudentPage = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state) => state.auth);
  const user = auth.user;
  const isStudent = user?.roleID === 1;

  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'android' ? Math.max(insets.top, 20) : insets.top;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const firstName = user?.firstName || 'User';
  const email = user?.email || '';
  const initials = `${firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';

  const avatarPalette = ['#FE6902', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#14B8A6', '#6366F1'];
  const avatarColor = avatarPalette[(user?.userID || 0) % avatarPalette.length];

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

  const colors = {
    bg: isStudentPage ? '#FF7A00' : isDark ? '#1f2937' : '#fff',
    text: isStudentPage ? '#fff' : isDark ? '#f9fafb' : '#111827',
    textSecondary: isStudentPage ? 'rgba(255,255,255,0.8)' : isDark ? '#9ca3af' : '#6b7280',
    border: isStudentPage ? 'rgba(255,255,255,0.2)' : isDark ? '#374151' : '#e5e7eb',
    iconBtn: isStudentPage ? 'rgba(255,255,255,0.15)' : isDark ? '#374151' : '#f3f4f6',
    orange: '#FE6902',
  };

  return (
    <>
      <View
        className="flex-row justify-between items-center px-4"
        style={{
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
          paddingTop: safeTop + 8,
          paddingBottom: 12,
        }}
      >
        <View className="flex-1">
          {isStudentPage ? (
            <View className="flex-row items-center gap-2">
              <Image source={collegeLogo} className="w-8 h-8" style={{ resizeMode: 'contain' }} />
              <Text className="text-xl font-bold" style={{ color: colors.text }}>{title}</Text>
            </View>
          ) : (
            <Text className="text-xl font-bold" style={{ color: colors.text }}>{title}</Text>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.iconBtn }}
            onPress={() => setShowHelp(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.iconBtn }}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.iconBtn }}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.7}
          >
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: avatarColor }}>
              <Text className="text-xs font-extrabold text-white">{initials}</Text>
            </View>
            {!isStudentPage && (
              <>
                <Text className="text-sm font-semibold max-w-24" style={{ color: colors.text }} numberOfLines={1}>{firstName}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showProfileMenu} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-start"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 60 }}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="mx-4 rounded-2xl p-4" style={{ backgroundColor: isDark ? '#1f2937' : '#fff', elevation: 8 }}>
              <View className="flex-row items-center gap-3 pb-4 mb-4 border-b" style={{ borderBottomColor: '#e5e7eb' }}>
                <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: avatarColor }}>
                  <Text className="text-lg font-extrabold text-white">{initials}</Text>
                </View>
                <View>
                  <Text className="text-base font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{firstName} {user?.lastName || ''}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} numberOfLines={1}>{email}</Text>
                </View>
              </View>

              <TouchableOpacity
                className="flex-row items-center gap-3 py-3"
                onPress={() => { setShowProfileMenu(false); setShowEditProfile(true); }}
                activeOpacity={0.7}
              >
                <Ionicons name="person" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                <Text className="text-sm font-medium" style={{ color: isDark ? '#f9fafb' : '#111827' }}>Edit Profile</Text>
              </TouchableOpacity>

              {!isStudentPage && (
                <TouchableOpacity
                  className="flex-row items-center gap-3 py-3"
                  onPress={() => { setShowProfileMenu(false); toggleTheme(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#f9fafb' : '#111827'} />
                  <Text className="text-sm font-medium" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-row items-center gap-3 py-3 border-t mt-2"
                style={{ borderTopColor: '#e5e7eb', paddingTop: 16, marginTop: 8 }}
                onPress={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <Text className="text-sm font-medium" style={{ color: '#EF4444' }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <NotificationPanel visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} user={user} />
      <HelpCenterModal visible={showHelp} onClose={() => setShowHelp(false)} />
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
