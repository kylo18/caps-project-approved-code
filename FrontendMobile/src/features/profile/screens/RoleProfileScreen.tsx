import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, Clipboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../../store/slices/authSlice';
import { logoutUser } from '../../../utils/logoutUser';
import { useTheme } from '../../../contexts/ThemeContext';
import { unregisterStoredPushToken } from '../../../services/pushNotificationService';
import MobileHeader from '../../../features/core/components/MobileHeader';
import EditProfileModal from '../../../features/profile/components/EditProfileModal';
import HelpCenterModal from '../../../features/support/components/HelpCenterModal';
import ConfirmModal from '../../../features/core/components/ConfirmModal';
import AppVersion from '../../../features/core/components/AppVersion';
import { showToast } from '../../../hooks/useToast';

type RoleProfileScreenProps = {
  roleLabel: string;
};

const AVATAR_COLORS = ['#FE6902', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

export default function RoleProfileScreen({ roleLabel }: RoleProfileScreenProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;
  const roleId = user?.roleID ?? user?.roleId;
  const isAdminRole = roleId === 4 || roleId === 5;

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || roleLabel;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const avatarColor = AVATAR_COLORS[(user?.userID || user?.id || 0) % AVATAR_COLORS.length];

  const infoRows = useMemo(
    () => [
      { label: 'Role', value: roleLabel },
      { label: 'ID Code', value: user?.userCode || 'Not available', copyable: true },
      { label: 'Email', value: user?.email || 'Not available', copyable: true },
      { label: 'Theme', value: isDark ? 'Dark' : 'Light' },
    ],
    [isDark, roleLabel, user?.email, user?.userCode]
  );

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    router.replace('/');
  };

  const handleCopy = (text: string, label: string) => {
    if (!text || text === 'Not available') return;
    Clipboard.setString(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const pageBg = isDark ? '#000000' : '#F3F4F6';
  const text = isDark ? '#F9FAFB' : '#111827';
  const muted = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#1F2937' : '#E5E7EB';

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <MobileHeader title="Profile" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            padding: 20,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => setShowEditProfile(true)} style={{ position: 'relative' }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: avatarColor,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>{initials}</Text>
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FE6902',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: cardBg,
                }}
              >
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
              </View>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={{ color: text, fontSize: 22, fontWeight: '800' }}>{fullName}</Text>
              <Text style={{ color: '#FE6902', fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                {roleLabel}
              </Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
                {user?.email || 'No email available'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 0 }}>
            {infoRows.map((row, index) => (
              <View
                key={row.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: index < infoRows.length - 1 ? 1 : 0,
                  borderBottomColor: border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
                    {row.label}
                  </Text>
                  <Text style={{ color: text, fontSize: 15, fontWeight: '600', marginTop: 4 }}>
                    {row.value}
                  </Text>
                </View>
                {'copyable' in row && row.copyable ? (
                  <Pressable
                    onPress={() => handleCopy(row.value, row.label)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color={muted} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Preferences Section */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            padding: 20,
            gap: 4,
          }}
        >
          <Text style={{ color: text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Preferences</Text>
          <ActionRow
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            description="Change the app appearance for this device"
            color="#F59E0B"
            text={text}
            muted={muted}
            onPress={toggleTheme}
          />
        </View>

        {/* Account Section */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            padding: 20,
            gap: 4,
          }}
        >
          <Text style={{ color: text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Account</Text>
          <ActionRow
            icon="person-outline"
            label="Edit Profile"
            description="Update your name, email, and password"
            color="#3B82F6"
            text={text}
            muted={muted}
            onPress={() => setShowEditProfile(true)}
          />
          <ActionRow
            icon={isAdminRole ? 'megaphone-outline' : 'help-circle-outline'}
            label={isAdminRole ? 'Create Announcement' : 'Help Center'}
            description={isAdminRole ? 'Post a new system announcement' : 'Open guides and support resources'}
            color="#10B981"
            text={text}
            muted={muted}
            onPress={() => {
              if (isAdminRole) {
                const route = roleId === 4
                  ? '/(auth)/(dean)/create-announcement'
                  : '/(auth)/(associate-dean)/create-announcement';
                router.push(route);
                return;
              }
              setShowHelp(true);
            }}
          />
          <ActionRow
            icon="log-out-outline"
            label="Log Out"
            description="Sign out from this device"
            color="#EF4444"
            text={text}
            muted={muted}
            onPress={() => setShowLogoutConfirm(true)}
          />
        </View>

        {/* Version Footer */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <AppVersion />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
      />
      <HelpCenterModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        userRole={roleId}
      />
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
  text: string;
  muted: string;
  onPress: () => void;
};

function ActionRow({ icon, label, description, color, text, muted, onPress }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 18,
        paddingVertical: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}18`,
        }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={muted} />
    </Pressable>
  );
}
