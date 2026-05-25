import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MobileHeader from '../../../features/core/components/MobileHeader';
import { useScreenFloatingTools } from '../../../hooks/useScreenFloatingTools';
import { useTheme } from '../../../contexts/ThemeContext';
import { showToast } from '../../../hooks/useToast';
import { getFacultyClasses } from '../../../services/facultyClassService';
import { getRoleShadow, getRoleThemeColors } from '../../core/styles/roleTheme';

export default function ClassesScreen({
  title = "Classes",
  description = "Manage classes",
  emptyMessage = "No classes found.",
  rolePath = "/(dean)"
}: {
  title?: string;
  description?: string;
  emptyMessage?: string;
  rolePath?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);
  const cardShadow = getRoleShadow(isDark);
  const cardStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...cardShadow,
  };

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const loadClasses = useCallback(async () => {
    try {
      const list = await getFacultyClasses();
      setClasses(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading dean classes:', error);
      showToast('Unable to load classes', 'error');
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    const interval = setInterval(loadClasses, 30_000);
    return () => clearInterval(interval);
  }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((item) => {
      const text = [
        item.className,
        item.classCode,
        item.subject?.subjectCode,
        item.subject?.subjectName,
        item.schedule,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(term);
    });
  }, [classes, query]);

  const activeCount = classes.filter((item) => item.isActive !== false).length;
  const archivedCount = classes.length - activeCount;

  useScreenFloatingTools([
    {
      key: 'create-class',
      icon: 'add-outline',
      label: 'Create Class',
      onPress: () => router.push({
        pathname: `/(auth)${rolePath}/class-detail` as string,
        params: { t: Date.now() }
      }),
    },
    {
      key: 'archived',
      icon: 'archive-outline',
      label: 'Archived',
      onPress: () => router.push(`/(auth)${rolePath}/archived-classes` as string),
    },
  ]);

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.page, paddingBottom: insets.bottom + 12 }}>
        <MobileHeader title="All Classes" />
        <View className="flex-1 items-center justify-center">
          <CapsActivityIndicator size="large" color="#FE6902" />
          <Text className="mt-3" style={{ color: colors.muted }}>Loading classes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page, paddingBottom: insets.bottom + 12 }}>
      <MobileHeader title="All Classes" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 112, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadClasses();
            }}
            tintColor="#FE6902"
          />
        }
      >
        <View className="rounded-2xl p-5" style={cardStyle}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>Class Oversight</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                Review classes, manage students and assigned quizzes, and keep class settings aligned with the web flow.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(dean)/subjects')}
              className="px-3 py-2 rounded-xl bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Subjects</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mt-4">
            <SummaryChip label="Total" value={classes.length} colors={colors} color="#FE6902" />
            <SummaryChip label="Active" value={activeCount} colors={colors} color="#10B981" />
            <SummaryChip label="Archived" value={archivedCount} colors={colors} color={colors.muted} />
          </View>
        </View>

        <View
          className="flex-row items-center rounded-2xl px-4 py-3"
          style={{ ...cardStyle, gap: 10 }}
        >
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search classes, subject, or code"
            placeholderTextColor={colors.mutedIcon}
            className="flex-1"
            style={{ color: colors.text }}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredClasses.length === 0 ? (
          <View className="rounded-2xl p-8 items-center" style={cardStyle}>
            <Ionicons name="layers-outline" size={48} color={colors.mutedIcon} />
            <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>
              {classes.length === 0 ? 'No classes found' : 'No classes match your search'}
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
              {classes.length === 0
                ? 'Classes will appear here once they are available.'
                : 'Try a different class name, code, or subject keyword.'}
            </Text>
          </View>
        ) : (
          filteredClasses.map((item, index) => {
            const isActive = item.isActive !== false;
            const studentCount = item.studentCount ?? item.totalStudents ?? item.studentsCount ?? 0;

            return (
              <TouchableOpacity
                key={item.classID || item.id || `${item.classCode}-${index}`}
                className="rounded-2xl p-4"
                style={cardStyle}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: `/(auth)${rolePath}/class-detail` as string,
                    params: {
                      classID: String(item.classID || item.id),
                      className: item.className || 'Class',
                    },
                  })
                }
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
                      {item.className || 'Untitled Class'}
                    </Text>
                    <Text className="mt-1 text-sm" style={{ color: colors.muted }} numberOfLines={1}>
                      {[item.subject?.subjectCode, item.subject?.subjectName].filter(Boolean).join(' · ') || 'No subject info'}
                    </Text>
                  </View>

                  <View className={`px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Text className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                      {isActive ? 'Active' : 'Archived'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 mt-4">
                  <MetaPill icon="key-outline" text={item.classCode || 'No code'} colors={colors} />
                  <MetaPill icon="time-outline" text={item.schedule || 'No schedule'} colors={colors} />
                  <MetaPill icon="people-outline" text={`${studentCount} students`} colors={colors} />
                </View>

                <View className="flex-row items-center justify-between mt-4 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                  <Text className="text-sm font-medium" style={{ color: colors.muted }}>
                    Open class manager
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function SummaryChip({ label, value, colors, color }: { label: string; value: number; colors: ReturnType<typeof getRoleThemeColors>; color: string }) {
  return (
    <View className="flex-1 rounded-2xl px-3 py-3" style={{ backgroundColor: colors.surfaceSoft }}>
      <Text className="text-xs" style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ color, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function MetaPill({ icon, text, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; colors: ReturnType<typeof getRoleThemeColors> }) {
  return (
    <View
      className="flex-row items-center px-3 py-2 rounded-full"
      style={{ backgroundColor: colors.surfaceSoft, gap: 6 }}
    >
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text className="text-xs" style={{ color: colors.text }}>{text}</Text>
    </View>
  );
}
