import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform, Image } from 'react-native';
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

const ADMIN_ROLES = [2, 3, 4, 5];

export default function Header({ title, isStudentPage = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state) => state.auth);
  const user = auth.user;
  const isStudent = user?.roleID === 1;

  // Get safe area insets for notched devices
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
      <View style={[styles.header, {
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
        paddingTop: safeTop + 8,
      }]}>
        {/* Left: Title or Logo */}
        <View style={styles.headerLeft}>
          {isStudentPage ? (
            <View style={styles.logoRow}>
              <Image source={collegeLogo} style={styles.logoImg} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
            </View>
          ) : (
            <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          )}
        </View>

        {/* Right: Icons + Profile */}
        <View style={styles.headerRight}>
          {/* Help */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]} onPress={() => setShowHelp(true)} activeOpacity={0.7}>
            <Ionicons name="help-circle" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]} onPress={() => setShowNotifications(true)} activeOpacity={0.7}>
            <Ionicons name="notifications" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Theme Toggle */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]} onPress={toggleTheme} activeOpacity={0.7}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity style={styles.profileBtn} onPress={() => setShowProfileMenu(true)} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {!isStudentPage && (
              <>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{firstName}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Menu Modal */}
      <Modal visible={showProfileMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowProfileMenu(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.menuCard, { backgroundColor: isDark ? '#1f2937' : '#fff' }]}>
              <View style={styles.menuHeader}>
                <View style={[styles.menuAvatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.menuAvatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={[styles.menuName, { color: isDark ? '#f9fafb' : '#111827' }]}>{firstName} {user?.lastName || ''}</Text>
                  <Text style={[styles.menuEmail, { color: isDark ? '#9ca3af' : '#6b7280' }]} numberOfLines={1}>{email}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); setShowEditProfile(true); }} activeOpacity={0.7}>
                <Ionicons name="person" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                <Text style={[styles.menuItemText, { color: isDark ? '#f9fafb' : '#111827' }]}>Edit Profile</Text>
              </TouchableOpacity>

              {!isStudentPage && (
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); toggleTheme(); }} activeOpacity={0.7}>
                  <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#f9fafb' : '#111827'} />
                  <Text style={[styles.menuItemText, { color: isDark ? '#f9fafb' : '#111827' }]}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }} activeOpacity={0.7}>
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Log Out</Text>
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

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 32, height: 32, resizeMode: 'contain' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 14, fontWeight: '600', maxWidth: 100 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', paddingTop: 60 },
  menuCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, elevation: 8 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  menuAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  menuAvatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  menuName: { fontSize: 16, fontWeight: '700' },
  menuEmail: { fontSize: 13, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 16 },
  logoutText: { fontSize: 15, fontWeight: '500', color: '#EF4444' },
});
