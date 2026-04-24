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
import { getArchivedClasses, unarchiveFacultyClass } from '../../../services/facultyClassService';
import MobileHeader from '../../../features/core/components/MobileHeader';

export default function ArchivedClassesScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
            const { apiRequest } = await import('../../../services/apiClient');
            await apiRequest(`/api/classes/${classID}`, { method: 'DELETE' });
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
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <ActivityIndicator size="large" color="#f57c20" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <MobileHeader title="Archived Classes" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f57c20" />}
      >
        {classes.length === 0 ? (
          <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <Ionicons name={loadError ? 'alert-circle-outline' : 'archive-outline'} size={40} color={loadError ? '#EF4444' : isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-3 font-semibold ${loadError ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {loadError ? 'Unable to load archived classes' : 'No archived classes'}
            </Text>
            <Text className={`text-sm mt-1 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {loadError || emptyMessage}
            </Text>
            {loadError ? (
              <Pressable
                onPress={fetchArchived}
                className="mt-4 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: '#f57c20' }}
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
              const studentCount = item.students?.length ?? item.studentCount ?? 0;
              const isActive = item.isActive ?? false;

              return (
                <View
                  key={classID}
                  className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className={`font-bold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.className || 'Unnamed Class'}
                      </Text>
                      <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.subject?.subjectCode || item.subjectCode || 'No subject code'}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                      <Text className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Archived
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mt-3">
                    <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ gap: 6 }}>
                      <Ionicons name="key-outline" size={12} color="#f57c20" />
                      <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.classCode || 'No code'}</Text>
                    </View>
                    <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ gap: 6 }}>
                      <Ionicons name="people-outline" size={12} color="#f57c20" />
                      <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{studentCount} students</Text>
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
