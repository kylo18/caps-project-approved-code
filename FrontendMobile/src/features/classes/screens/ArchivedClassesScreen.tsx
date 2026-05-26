import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { showToast } from '../../../hooks/useToast';
import { getArchivedClasses, unarchiveFacultyClass, deleteFacultyClass } from '../../../services/facultyClassService';
import MobileHeader from '../../../features/core/components/MobileHeader';
import { getRoleShadow, getRoleThemeColors } from '../../core/styles/roleTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ArchivedClassesScreen() {
  const router = useRouter();
  const { origin, rolePath } = useLocalSearchParams();

  const handleBack = () => {
    if (origin === 'classes' && rolePath) {
      router.replace(`/(auth)${rolePath}/classes` as string);
    } else {
      router.back();
    }
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);
  const cardStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...getRoleShadow(isDark),
  };

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState<number | string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState('Archived classes will appear here.');
  const [loadError, setLoadError] = useState('');

  const fetchArchived = useCallback(async () => {
    try {
      const res = await getArchivedClasses();
      const list = Array.isArray(res?.classes) ? res.classes : Array.isArray(res) ? res : [];
      const isError = res?.emptyReason === 'error';

      setClasses(list);
      setLoadError(isError ? res?.message || 'Unable to load archived classes.' : '');
      setEmptyMessage(
        res?.message && (res?.emptyReason === 'empty' || res?.emptyReason === 'class_not_found')
          ? res.message
          : 'Archived classes will appear here.'
      );
      if (isError) {
        showToast(res?.message || 'Unable to load archived classes', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArchived();
  };

  const handleRestore = (classItem: any) => {
    const classID = classItem.classID || classItem.id;
    const name = classItem.className || 'this class';
    Alert.alert('Restore Class', `Are you sure you want to restore "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          setRestoringId(classID);
          try {
            await unarchiveFacultyClass(classID);
            showToast('Class restored successfully', 'success');
            setClasses((prev) => prev.filter((c) => (c.classID || c.id) !== classID));
          } catch (error) {
            console.error('Error restoring class:', error);
            showToast('Failed to restore class', 'error');
          } finally {
            setRestoringId(null);
          }
        },
      },
    ]);
  };

  const handleDelete = (classItem: any) => {
    const classID = classItem.classID || classItem.id;
    const name = classItem.className || 'this class';
    Alert.alert('Delete Permanently', `Are you sure you want to permanently delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFacultyClass(classID);
            showToast('Class deleted permanently', 'success');
            setClasses((prev) => prev.filter((c) => (c.classID || c.id) !== classID));
          } catch (error) {
            console.error('Error deleting class:', error);
            showToast('Failed to delete class', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <MobileHeader title="Archived Classes" showBack onBack={handleBack} />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {classes.length === 0 ? (
          <View className="rounded-2xl p-8 items-center" style={cardStyle}>
            <Ionicons name={loadError ? 'alert-circle-outline' : 'archive-outline'} size={40} color={loadError ? '#EF4444' : colors.mutedIcon} />
            <Text className="mt-3 font-semibold" style={{ color: loadError ? '#EF4444' : colors.muted }}>
              {loadError ? 'Unable to load archived classes' : 'No archived classes'}
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.muted }}>
              {loadError || emptyMessage}
            </Text>
            {loadError ? (
              <Pressable
                onPress={fetchArchived}
                className="mt-4 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View className="gap-3">
            {classes.map((item) => {
              const classID = item.classID || item.id;
              const isRestoring = restoringId === classID;
              const studentCount = item.students?.length ?? item.enrollments?.length ?? item.studentCount ?? 0;
              const isActive = item.isActive ?? false;

              return (
                <View
                  key={classID}
                  className="rounded-2xl p-4"
                  style={cardStyle}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-bold text-[15px]" style={{ color: colors.text }}>
                        {item.className || 'Unnamed Class'}
                      </Text>
                      <Text className="text-sm mt-0.5" style={{ color: colors.muted }}>
                        {item.subject?.subjectCode || item.subjectCode || 'No subject code'}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.surfaceSoft }}>
                      <Text className="text-[11px] font-medium" style={{ color: colors.muted }}>
                        Archived
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mt-3">
                    <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.surfaceSoft, gap: 6 }}>
                      <Ionicons name="key-outline" size={12} color={colors.accent} />
                      <Text className="text-xs" style={{ color: colors.text }}>{item.classCode || 'No code'}</Text>
                    </View>
                    <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.surfaceSoft, gap: 6 }}>
                      <Ionicons name="people-outline" size={12} color={colors.accent} />
                      <Text className="text-xs" style={{ color: colors.text }}>{studentCount} students</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-4">
                    <Pressable
                      onPress={() => handleRestore(item)}
                      disabled={isRestoring}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#0f6e56' }}
                    >
                      {isRestoring ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={16} color="#fff" />
                          <Text className="text-white text-sm font-semibold">Restore</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(item)}
                      disabled={isRestoring}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#a32d2d' }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text className="text-white text-sm font-semibold">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
