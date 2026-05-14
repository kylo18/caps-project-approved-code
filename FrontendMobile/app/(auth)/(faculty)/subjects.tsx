// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Faculty "My Subjects" screen — fetches the logged-in faculty member's
//          assigned subjects, lets them pick one, and lists its questions with
//          status badges (Approved/Pending). Provides navigation to add/edit questions.
//          Now supports self-assigning to available subjects and deleting own questions.
// Key sections: Header with back button, horizontal subject tabs, questions list
//               (with empty state), loading skeleton, pull-to-refresh.
// Uses NativeWind for mobile-native styling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import {   View, Text, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions, Modal, Alert } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import type { AdminToolAction } from '../../../src/features/admin/shared/components/AdminFloatingTools';

export default function FacultySubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchSubjects(true);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions();
    }
  }, [selectedSubject]);

  const fetchSubjects = async (reset = false) => {
    const currentPage = reset ? 1 : page;

    if (reset) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await apiRequest(`/api/faculty/my-subjects?limit=20&page=${currentPage}`);
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data) ? data : [];
      const total: number | undefined = data?.total ?? data?.count ?? data?.totalCount;

      if (reset) {
        setSubjects(list);
        if (total !== undefined) {
          setHasMore(list.length < total);
        } else {
          setHasMore(list.length === 20);
        }
        if (selectedSubject) {
          const updatedSelection = list.find((subject: any) => subject.subjectID === selectedSubject.subjectID);
          setSelectedSubject(updatedSelection || null);
        }
      } else {
        setSubjects(prev => [...prev, ...list]);
        if (total !== undefined) {
          setHasMore((subjects.length + list.length) < total);
        } else {
          setHasMore(list.length === 20);
        }
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showToast('Unable to load subjects', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading || !!selectedSubject) return;
    fetchSubjects(false);
  };

  const fetchQuestions = async () => {
    if (!selectedSubject) return;
    try {
      const data = await apiRequest(`/api/faculty/my-questions/${selectedSubject.subjectID}`);
      setQuestions(Array.isArray(data?.data) ? data.data : Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const data = await apiRequest('/api/faculty/availableSubjects');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data) ? data : [];
      setAvailableSubjects(list);
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      showToast('Unable to load available subjects', 'error');
    }
  };

  const handleAssignSubject = async (subjectID: number) => {
    setIsAssigning(true);
    try {
      await apiRequest('/api/faculty/assign-subject', {
        method: 'POST',
        body: { subjectID: String(subjectID) },
      });
      showToast('Subject assigned successfully', 'success');
      setShowAssignModal(false);
      await fetchSubjects(true);
    } catch (error) {
      showToast('Failed to assign subject', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveSubject = (subject: any) => {
    Alert.alert(
      'Remove Subject',
      `Are you sure you want to remove "${subject.subjectName || subject.name}" from your assigned subjects?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/api/remove-assigned-subject/${subject.subjectID}`, { method: 'DELETE' });
              showToast('Subject removed', 'success');
              if (selectedSubject?.subjectID === subject.subjectID) {
                setSelectedSubject(null);
                setQuestions([]);
              }
              await fetchSubjects(true);
            } catch (error) {
              showToast('Failed to remove subject', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteQuestion = (questionID: number) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/api/questions/delete/${questionID}`, { method: 'DELETE' });
              setQuestions(prev => prev.filter(q => q.questionID !== questionID));
              showToast('Question deleted', 'success');
            } catch (error) {
              showToast('Failed to delete question', 'error');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubjects(true);
    setIsRefreshing(false);
  };

  const openAssignModal = async () => {
    await fetchAvailableSubjects();
    setShowAssignModal(true);
  };

  const fabActions = useMemo<AdminToolAction[]>(() => [
    {
      key: 'assign-subject',
      icon: 'bookmark-outline',
      label: 'Assign Subject',
      onPress: openAssignModal,
      disabled: !!selectedSubject,
      backgroundColor: '#3B82F6',
    },
    {
      key: 'add-question',
      icon: 'help-circle-outline',
      label: 'Add Question',
      onPress: () => {
        if (!selectedSubject) return;
        router.push({ pathname: '/(auth)/practice-exam/add-question', params: { subjectID: selectedSubject.subjectID } });
      },
      disabled: !selectedSubject,
      backgroundColor: '#10B981',
    },
  ], [selectedSubject, router, openAssignModal]);

  useScreenFloatingTools(fabActions);

  // Render loading state
  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <CapsActivityIndicator size="large" color="#FE6902" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Header */}
      <View className={`px-4 pb-3 pt-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                if (selectedSubject) {
                  setSelectedSubject(null);
                  return;
                }
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/(faculty)/dashboard');
              }}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedSubject ? (selectedSubject.subjectName || selectedSubject.name || 'Subject Questions') : 'My Subjects'}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(faculty)/classes')}
              className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={18} color="#FE6902" />
                <Text className="font-semibold ml-1 text-primary">Classes</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
      >
        {!selectedSubject ? (
          <View className="px-4 py-4">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Subject List ({subjects.length})
            </Text>
            {subjects.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="book-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Assigned Subjects</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Assign a subject to start managing questions.
                </Text>
              </View>
            ) : (
              subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.subjectID}
                  onPress={() => setSelectedSubject(subject)}
                  className={`rounded-2xl p-4 mb-3 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {subject.subjectName || subject.name}
                      </Text>
                      {!!subject.subjectCode && (
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {subject.subjectCode}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleRemoveSubject(subject)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-red-50'}`}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {isLoadingMore && (
              <View className="py-4 items-center">
                <CapsActivityIndicator size="small" color="#FE6902" />
                <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading more...</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({questions.length})
              </Text>
            </View>

            {questions.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Questions Yet</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Start adding questions for this subject.
                </Text>
              </View>
            ) : (
              questions.map((q, idx) => (
                <View
                  key={q.questionID || idx}
                  className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Q{idx + 1}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-1 rounded-lg ${q.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        <Text className="text-white text-xs font-semibold">{q.status === 'approved' ? 'Approved' : 'Pending'}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(auth)/practice-exam/edit-question', params: { questionID: q.questionID } })}
                        className="p-1"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteQuestion(q.questionID)}
                        className="p-1"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ marginBottom: 12, maxHeight: 56, overflow: 'hidden' }}>
                    <RenderHtml
                      contentWidth={windowWidth - 64}
                      source={{ html: q.questionText || '<p>No question text</p>' }}
                      tagsStyles={{
                        p: { color: isDark ? '#fff' : '#111827', fontSize: 15, lineHeight: 20, marginBottom: 4 },
                        li: { color: isDark ? '#fff' : '#111827', fontSize: 14, lineHeight: 18 },
                        strong: { color: isDark ? '#fff' : '#111827', fontWeight: '700' },
                        u: { textDecorationLine: 'underline' },
                        a: { color: '#FE6902' },
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{q.choices?.length || 4} choices</Text>
                    <Ionicons name="chevron-forward" size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>



      {/* Assign Subject Modal */}
      <Modal visible={showAssignModal} transparent animationType="fade" onRequestClose={() => setShowAssignModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className={`rounded-t-3xl p-5 max-h-[80%] ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Assign a Subject</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {availableSubjects.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="book-outline" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text className={`mt-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No available subjects to assign
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableSubjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.subjectID}
                    onPress={() => handleAssignSubject(subject.subjectID)}
                    disabled={isAssigning}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-xl items-center justify-center bg-orange-100">
                      <Ionicons name="book" size={20} color="#FE6902" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {subject.subjectName || subject.name}
                      </Text>
                      {subject.subjectCode && (
                        <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {subject.subjectCode}
                        </Text>
                      )}
                    </View>
                    {isAssigning ? (
                      <CapsActivityIndicator color="#FE6902" />
                    ) : (
                      <Ionicons name="add-circle" size={24} color="#FE6902" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
