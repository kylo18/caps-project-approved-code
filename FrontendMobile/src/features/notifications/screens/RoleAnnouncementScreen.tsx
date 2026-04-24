import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../contexts/ThemeContext';
import { apiRequest } from '../../../services/apiClient';
import { showToast } from '../../../hooks/useToast';

type RoleAnnouncementScreenProps = {
  roleLabel: string;
};

const AUDIENCE_OPTIONS = [
  { key: 'all', label: 'All Users', targetType: 'all' as const },
  { key: 'students', label: 'Students', targetType: 'role' as const, targetId: 1 },
  { key: 'faculty', label: 'Faculty', targetType: 'role' as const, targetId: 2 },
  { key: 'program-chair', label: 'Program Chairs', targetType: 'role' as const, targetId: 3 },
  { key: 'dean', label: 'Deans', targetType: 'role' as const, targetId: 4 },
  { key: 'associate-dean', label: 'Associate Deans', targetType: 'role' as const, targetId: 5 },
];

export default function RoleAnnouncementScreen({ roleLabel }: RoleAnnouncementScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = useSelector((state: any) => state.auth?.user);
  const roleId = user?.roleID ?? user?.roleId;
  const canCreateAnnouncement = roleId === 4 || roleId === 5;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const colors = useMemo(
    () => ({
      page: isDark ? '#000000' : '#F3F4F6',
      card: isDark ? '#111827' : '#FFFFFF',
      text: isDark ? '#F9FAFB' : '#111827',
      muted: isDark ? '#9CA3AF' : '#6B7280',
      border: isDark ? '#1F2937' : '#E5E7EB',
      input: isDark ? '#0F172A' : '#FFFFFF',
      primary: '#FE6902',
    }),
    [isDark]
  );

  const audience = AUDIENCE_OPTIONS.find((option) => option.key === selectedAudience) ?? AUDIENCE_OPTIONS[0];

  const handleSubmit = async () => {
    if (!canCreateAnnouncement) {
      showToast('Your role cannot create announcements.', 'error');
      return;
    }
    if (!title.trim() || !message.trim()) {
      showToast('Please complete the title and message.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/admin/notifications', {
        method: 'POST',
        body: {
          type: 'system_announcement',
          title: title.trim(),
          message: message.trim(),
          target_type: audience.targetType,
          target_id: audience.targetId,
          data: {
            source: 'mobile_admin',
            createdByRole: roleLabel,
          },
        },
      });

      showToast('Announcement created successfully.', 'success');
      router.back();
    } catch (error: any) {
      showToast(error?.message || 'Failed to create announcement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Create Announcement</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, gap: 16 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Post a New Announcement</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
              Send a system announcement from the {roleLabel} mobile app.
            </Text>
          </View>

          {!canCreateAnnouncement ? (
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: '#FCA5A5',
                backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
                padding: 14,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700' }}>Access Restricted</Text>
              <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 4 }}>
                Only Dean and Associate Dean accounts can submit announcements.
              </Text>
            </View>
          ) : null}

          <View>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Audience</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {AUDIENCE_OPTIONS.map((option) => {
                const selected = selectedAudience === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedAudience(option.key)}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}15` : colors.input,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: selected ? colors.primary : colors.text, fontSize: 13, fontWeight: '700' }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter announcement title"
              placeholderTextColor={colors.muted}
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.input,
                color: colors.text,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
              }}
            />
          </View>

          <View>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write the announcement details"
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 160,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.input,
                color: colors.text,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
              }}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.page,
        }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !canCreateAnnouncement}
          style={{
            borderRadius: 18,
            backgroundColor: colors.primary,
            minHeight: 54,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting || !canCreateAnnouncement ? 0.65 : 1,
          }}
        >
          {submitting ? (
            <CapsActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Post Announcement</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
