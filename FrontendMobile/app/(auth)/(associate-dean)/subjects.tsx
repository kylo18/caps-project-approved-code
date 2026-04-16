// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Associate Dean "Subject Questions" screen — fetches all subjects and
//          their questions for college-wide oversight. Allows toggling question
//          approval status and deleting questions. Read-only review with
//          moderation capabilities (no add/edit navigation).
// Key sections: Header with back button, horizontal subject tabs, questions list
//               (with status toggle and delete actions), empty state,
//               loading skeleton, pull-to-refresh.
// Uses NativeWind for mobile-native styling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert, StyleProp, ViewStyle, useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { Skeleton, SkeletonList } from '../../../src/components/Skeleton';

// Types
interface Subject {
  subjectID: number;
  subjectName: string;
}

interface Question {
  questionID: number;
  questionText?: string;
  status?: string;
  choices?: unknown[];
}

export default function AssoDeanSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchQuestions();
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/subjects');
      const list: Subject[] = Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setSubjects(list);
      if (list.length > 0 && !selectedSubject) setSelectedSubject(list[0]);
    } catch (error) {
      showToast('Unable to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedSubject) return;
    try {
      const data = await apiRequest(`/api/subjects/${selectedSubject.subjectID}/questions`);
      const qList: Question[] = Array.isArray(data?.questions) ? data.questions : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setQuestions(qList);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleDeleteQuestion = (questionID: number) => {
    Alert.alert('Delete Question', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiRequest(`/api/questions/delete/${questionID}`, { method: 'DELETE' });
            setQuestions(prev => prev.filter(q => q.questionID !== questionID));
            showToast('Question deleted', 'success');
          } catch (error) {
            showToast('Failed to delete', 'error');
          }
        }
      },
    ]);
  };

  const handleToggleStatus = async (questionID: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      await apiRequest(`/api/questions/${questionID}/status`, { method: 'PATCH', body: { status: newStatus } });
      setQuestions(prev => prev.map(q => q.questionID === questionID ? { ...q, status: newStatus } : q));
      showToast(`Question ${newStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubjects();
    setIsRefreshing(false);
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <View className={`px-4 py-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center">
            <Skeleton variant="text" className="w-36 h-6" />
          </View>
        </View>
        <View className="px-4 py-4">
          <View className="flex-row mb-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="button" className="mr-2" />
            ))}
          </View>
          <SkeletonList count={4} />
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Header */}
      <View className={`px-4 pb-3 pt-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(associate-dean)/dashboard' as any); }} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={24} className={isDark ? 'text-white' : 'text-gray-900'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subject Questions</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
      >
        {/* Subject Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 max-h-14">
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.subjectID}
              onPress={() => setSelectedSubject(subject)}
              className={`
                px-4 py-2 rounded-full mr-2 border
                ${selectedSubject?.subjectID === subject.subjectID
                  ? 'bg-primary border-primary'
                  : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
                }
              `}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold max-w-36 ${selectedSubject?.subjectID === subject.subjectID ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                {subject.subjectName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Questions List */}
        {selectedSubject && (
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({questions.length})
              </Text>
            </View>

            {questions.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Questions</Text>
              </View>
            ) : (
              questions.map((q, idx) => (
                <View key={q.questionID || idx} className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Q{idx + 1}</Text>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(q.questionID, q.status || 'pending')}
                        className={`px-2 py-1 rounded-lg ${q.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}
                        activeOpacity={0.7}
                      >
                        <Text className="text-white text-xs font-semibold">{q.status === 'approved' ? 'Approved' : 'Pending'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteQuestion(q.questionID)} className="p-1" activeOpacity={0.7}>
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
                  <View className="flex-row items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{q.choices?.length || 4} choices</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
