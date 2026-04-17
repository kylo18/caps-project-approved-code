// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin Question Bank screen with full CRUD operations. Displays all
//          subjects with horizontal tabs, shows questions per subject, and provides
//          question management (add, edit, delete, approve).
//
// Features:
// - Horizontal subject tabs
// - Question list with search/filter
// - Question detail modal
// - Status toggle (approve/reject)
// - Add/edit/delete actions
// - Pull-to-refresh
// - Loading skeleton
//
// Uses NativeWind for mobile-native styling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, useWindowDimensions, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import ConfirmModal from '../../../src/components/ConfirmModal';
import CustomDropdown from '../../../src/components/CustomDropdown';

type SubjectItem = {
  subjectID: number;
  subjectName: string;
  [key: string]: any;
};

type QuestionItem = {
  questionID?: number;
  questionText: string;
  subjectName?: string;
  topic?: string;
  status: string;
  difficulty?: string;
  choices: any[];
  points?: number;
  maxPoints?: number;
  [key: string]: any;
};

function getDisplayText(value: any, fallback = '') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    if (typeof value.name === 'string') return value.name;
    if (typeof value.subjectName === 'string') return value.subjectName;
    if (typeof value.title === 'string') return value.title;
  }

  return fallback;
}

function normalizeQuestion(question: any): QuestionItem {
  return {
    ...question,
    questionText: typeof question?.questionText === 'string'
      ? question.questionText
      : getDisplayText(question?.questionText, '<p>No question text</p>'),
    subjectName: getDisplayText(question?.subjectName ?? question?.subject?.subjectName, 'Unknown subject'),
    topic: getDisplayText(question?.topic ?? question?.coverage_name ?? question?.coverage?.name, ''),
    status: getDisplayText(question?.status ?? question?.status_name, 'pending').toLowerCase(),
    difficulty: getDisplayText(question?.difficulty ?? question?.difficulty_name, ''),
    choices: Array.isArray(question?.choices) ? question.choices : [],
    points: question?.points ?? question?.score ?? question?.maxPoints ?? 1,
  };
}

function normalizeSubject(subject: any): SubjectItem {
  return {
    ...subject,
    subjectID: subject?.subjectID ?? subject?.id,
    subjectName: getDisplayText(subject?.subjectName ?? subject?.name, 'Unknown subject'),
  };
}

export default function AdminSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();

  // State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionItem | null>(null);

  // Subject settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isExamEnabled, setIsExamEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [practiceSettings, setPracticeSettings] = useState({
    isEnabled: false,
    enableTimer: false,
    duration_minutes: 30,
    coverage: 'midterm',
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
    total_items: 100,
  });
  const [difficultyMode, setDifficultyMode] = useState<'default' | 'custom'>('default');

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch questions when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions();
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const data = await apiRequest('/api/subjects');
      const list = Array.isArray(data?.subjects) ? data.subjects :
        Array.isArray(data?.data) ? data.data :
          Array.isArray(data) ? data : [];
      const normalizedSubjects = list.map(normalizeSubject);
      setSubjects(normalizedSubjects);
      if (normalizedSubjects.length === 0) {
        return;
      }

      if (selectedSubject) {
        const updatedSelection = normalizedSubjects.find((subject: SubjectItem) => subject.subjectID === selectedSubject.subjectID);
        setSelectedSubject(updatedSelection || normalizedSubjects[0]);
        return;
      }

      setSelectedSubject(normalizedSubjects[0]);
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
      const items = Array.isArray(data?.questions) ? data.questions :
        Array.isArray(data?.data) ? data.data :
          Array.isArray(data) ? data : [];
      setQuestions(items.map(normalizeQuestion));
    } catch (error) {
      showToast('Unable to load questions', 'error');
    }
  };

  const fetchSubjectSettings = async () => {
    if (!selectedSubject) return;
    setSettingsLoading(true);
    try {
      const [qeRes, practiceRes] = await Promise.all([
        apiRequest(`/api/subjects/${selectedSubject.subjectID}/exam-questions-status`),
        apiRequest(`/api/practice-settings/${selectedSubject.subjectID}`),
      ]);
      const qeData = qeRes?.data || {};
      setIsExamEnabled(!!qeData.is_enabled_for_exam_questions);

      const ps = practiceRes?.data || practiceRes || {};
      const nextSettings = {
        isEnabled: Boolean(ps.isEnabled ?? false),
        enableTimer: (ps.duration_minutes ?? 0) > 0,
        duration_minutes: ps.duration_minutes || 30,
        coverage: ps.coverage || 'midterm',
        easy_percentage: ps.easy_percentage ?? 30,
        moderate_percentage: ps.moderate_percentage ?? 50,
        hard_percentage: ps.hard_percentage ?? 20,
        total_items: ps.total_items || 100,
      };
      setPracticeSettings(nextSettings);
      const isDefault = nextSettings.easy_percentage === 30 && nextSettings.moderate_percentage === 50 && nextSettings.hard_percentage === 20;
      setDifficultyMode(isDefault ? 'default' : 'custom');
    } catch (error) {
      console.error('Error fetching subject settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSubjectSettings = async () => {
    if (!selectedSubject) return;
    setSettingsSaving(true);
    try {
      // Update exam questions enable/disable if changed
      const endpoint = isExamEnabled
        ? `/api/subjects/${selectedSubject.subjectID}/enable-exam-questions`
        : `/api/subjects/${selectedSubject.subjectID}/disable-exam-questions`;
      await apiRequest(endpoint, { method: 'PATCH' });

      const total = practiceSettings.easy_percentage + practiceSettings.moderate_percentage + practiceSettings.hard_percentage;
      if (practiceSettings.isEnabled && total !== 100) {
        showToast('Difficulty percentages must total 100%', 'error');
        setSettingsSaving(false);
        return;
      }

      await apiRequest('/api/practice-settings', {
        method: 'POST',
        body: {
          subjectID: selectedSubject.subjectID,
          ...practiceSettings,
          duration_minutes: practiceSettings.enableTimer ? practiceSettings.duration_minutes : 0,
        },
      });

      // Update local subject state to reflect exam enabled status
      setSubjects(prev => prev.map(s => s.subjectID === selectedSubject.subjectID ? { ...s, is_enabled_for_exam_questions: isExamEnabled } : s));

      showToast('Subject settings saved', 'success');
      setShowSettingsModal(false);
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubjects();
    if (selectedSubject) await fetchQuestions();
    setIsRefreshing(false);
  };

  // Filter questions by search
  const filteredQuestions = questions.filter((q: QuestionItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.questionText?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query) ||
      q.subjectName?.toLowerCase().includes(query)
    );
  });

  // Status toggle
  const handleToggleStatus = async (question: QuestionItem, newStatus: string) => {
    if (newStatus !== 'approved') {
      showToast('Returning approved questions to pending is not supported by this server.', 'info');
      return;
    }

    try {
      await apiRequest(`/api/questions/${question.questionID}/status`, {
        method: 'PATCH',
      });
      setQuestions(prev => prev.map(q =>
        q.questionID === question.questionID ? { ...q, status: newStatus } : q
      ));
      showToast(`Question ${newStatus === 'approved' ? 'approved' : 'pending'}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  // Delete question
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await apiRequest(`/api/questions/delete/${questionToDelete.questionID}`, {
        method: 'DELETE'
      });
      setQuestions(prev => prev.filter(q => q.questionID !== questionToDelete.questionID));
      showToast('Question deleted', 'success');
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    } catch (error) {
      showToast('Failed to delete question', 'error');
    }
  };

  // Open delete confirmation
  const confirmDelete = (question: QuestionItem) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  // Open question detail
  const openDetail = (question: QuestionItem) => {
    setSelectedQuestion(normalizeQuestion(question));
    setShowDetailModal(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <View className={`px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="h-8 w-40 bg-gray-300 rounded-lg" />
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FE6902" />
          <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading questions...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Header */}
      <View
        className={`px-4 pb-3 pt-3 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(dean)/dashboard' as any); }}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} className={isDark ? 'text-white' : 'text-gray-900'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Question Bank
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                fetchSubjectSettings();
                setShowSettingsModal(true);
              }}
              className="flex-row items-center bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-xl"
            >
              <Ionicons name="settings-outline" size={18} color={isDark ? '#fff' : '#374151'} />
              <Text className={`font-semibold ml-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/(auth)/practice-exam/add-question',
                params: { subjectID: selectedSubject?.subjectID }
              })}
              className="flex-row items-center bg-primary px-3 py-2 rounded-xl"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold ml-1">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FE6900"
          />
        }
      >
        {/* Subject Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 max-h-14"
        >
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.subjectID}
              onPress={() => setSelectedSubject(subject)}
              className={`
                px-4 py-2 rounded-full mr-2 border flex-row items-center
                ${selectedSubject?.subjectID === subject.subjectID
                  ? 'bg-primary border-primary'
                  : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
                }
              `}
            >
              <Text
                className={`text-sm font-semibold max-w-36 ${selectedSubject?.subjectID === subject.subjectID
                  ? 'text-white'
                  : isDark ? 'text-white' : 'text-gray-900'
                  }`}
                numberOfLines={1}
              >
                {subject.subjectName}
              </Text>
              {!!subject.is_enabled_for_exam_questions && (
                <View className="ml-2 w-2 h-2 rounded-full bg-green-400" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View className="px-4 mb-3">
          <View className={`
            flex-row items-center px-3 py-2 rounded-xl
            ${isDark ? 'bg-gray-800' : 'bg-white'}
          `}>
            <Ionicons name="search" size={20} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search questions..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              className={`flex-1 ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Questions List */}
        {selectedSubject && (
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({filteredQuestions.length})
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/(auth)/practice-exam/duplicate-question',
                    params: { subjectID: selectedSubject?.subjectID }
                  })}
                  className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <Text className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Duplicate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {filteredQuestions.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {searchQuery ? 'No Results Found' : 'No Questions Yet'}
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : `Add questions for ${selectedSubject?.subjectName}.`
                  }
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/(auth)/practice-exam/add-question',
                      params: { subjectID: selectedSubject?.subjectID }
                    })}
                    className="mt-4 bg-primary px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Add First Question</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={q.questionID || idx}
                  onPress={() => openDetail(q)}
                  className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Q{idx + 1}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-lg ${getStatusColor(q.status)}`}>
                        <Text className="text-white text-xs font-semibold uppercase">
                          {q.status || 'pending'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {q.choices?.length || 4} choices
                      </Text>
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

                  {q.topic && (
                    <View className="flex-row items-center gap-2 mb-3">
                      <Ionicons name="pricetag" size={14} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getDisplayText(q.topic)}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(q, q.status === 'approved' ? 'pending' : 'approved')}
                        className="flex-row items-center gap-1"
                      >
                        <Ionicons
                          name={q.status === 'approved' ? 'checkmark-circle' : 'time'}
                          size={18}
                          color={q.status === 'approved' ? '#10B981' : '#F59E0B'}
                        />
                        <Text className={`text-xs font-medium ${q.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                          {q.status === 'approved' ? 'Approved' : 'Pending'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => router.push({
                          pathname: '/(auth)/practice-exam/edit-question',
                          params: { questionID: q.questionID }
                        })}
                        className="p-2"
                      >
                        <Ionicons name="create-outline" size={20} color="#FE6902" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(q)}
                        className="p-2"
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Question Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className={`
            flex-row justify-between items-center px-4 py-3 border-b
            ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
          `}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text className="text-primary font-semibold">Close</Text>
            </TouchableOpacity>
            <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Question Details
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowDetailModal(false);
                router.push({
                  pathname: '/(auth)/practice-exam/edit-question',
                  params: { questionID: selectedQuestion?.questionID }
                });
              }}
            >
              <Text className="text-primary font-semibold">Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {selectedQuestion && (
              <>
                {/* Status Badge */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className={`px-3 py-1.5 rounded-lg ${getStatusColor(selectedQuestion.status)}`}>
                    <Text className="text-white text-sm font-semibold uppercase">
                      {selectedQuestion.status || 'pending'}
                    </Text>
                  </View>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {selectedQuestion.questionID}
                  </Text>
                </View>

                {/* Question Text */}
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <Text className={`text-xs font-semibold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Question
                  </Text>
                  <RenderHtml
                    contentWidth={windowWidth - 64}
                    source={{ html: selectedQuestion.questionText || '<p>No question text</p>' }}
                    tagsStyles={{
                      p: { color: isDark ? '#fff' : '#111827', fontSize: 15, lineHeight: 22, marginBottom: 8 },
                      li: { color: isDark ? '#fff' : '#111827', fontSize: 14, lineHeight: 20 },
                      strong: { color: isDark ? '#fff' : '#111827', fontWeight: '700' },
                      u: { textDecorationLine: 'underline' },
                      a: { color: '#FE6902' },
                    }}
                  />
                </View>

                {/* Choices */}
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <Text className={`text-xs font-semibold uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Choices
                  </Text>
                  {selectedQuestion.choices?.map((choice, idx) => (
                    <View
                      key={idx}
                      className={`
                        flex-row items-center p-3 rounded-xl mb-2
                        ${choice.isCorrect || choice.is_correct
                          ? 'bg-green-100 border border-green-500'
                          : isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }
                      `}
                    >
                      <View className={`
                        w-6 h-6 rounded-full items-center justify-center mr-3
                        ${choice.isCorrect || choice.is_correct
                          ? 'bg-green-500'
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }
                      `}>
                        <Text className="text-white text-xs font-bold">
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text className={`flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getDisplayText(choice.choiceText ?? choice.text ?? choice?.name, JSON.stringify(choice))}
                      </Text>
                      {(choice.isCorrect || choice.is_correct) && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      )}
                    </View>
                  ))}
                </View>

                {/* Meta Info */}
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <Text className={`text-xs font-semibold uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Details
                  </Text>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Topic</Text>
                    <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                      {getDisplayText(selectedQuestion.topic, 'N/A')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Subject</Text>
                    <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                      {getDisplayText(selectedSubject?.subjectName, 'N/A')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Difficulty</Text>
                    <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                      {getDisplayText(selectedQuestion.difficulty, 'N/A')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Points</Text>
                    <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedQuestion.points || selectedQuestion.maxPoints || 1}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowDetailModal(false);
                      handleToggleStatus(selectedQuestion, selectedQuestion.status === 'approved' ? 'pending' : 'approved');
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${selectedQuestion.status === 'approved' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                  >
                    <Text className="text-white font-semibold">
                      {selectedQuestion.status === 'approved' ? 'Reject' : 'Approve'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(selectedQuestion)}
                    className="flex-1 py-3 rounded-xl items-center bg-red-500"
                  >
                    <Text className="text-white font-semibold">Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteQuestion}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setQuestionToDelete(null);
        }}
      />

      {/* Subject Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className={`
            flex-row justify-between items-center px-4 py-3 border-b
            ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
          `}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text className="text-primary font-semibold">Cancel</Text>
            </TouchableOpacity>
            <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
              {selectedSubject?.subjectName || 'Subject Settings'}
            </Text>
            <TouchableOpacity onPress={saveSubjectSettings} disabled={settingsSaving}>
              <Text className={`font-semibold ${settingsSaving ? 'text-gray-400' : 'text-primary'}`}>
                {settingsSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {settingsLoading ? (
              <View className="flex-1 justify-center items-center py-12">
                <ActivityIndicator size="large" color="#FE6902" />
                <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading settings...</Text>
              </View>
            ) : (
              <>
                {/* Qualifying Exam Toggle */}
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Enable Exam Question Entry</Text>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Allow adding qualifying exam questions for this subject.
                      </Text>
                    </View>
                    <Switch
                      value={isExamEnabled}
                      onValueChange={setIsExamEnabled}
                      trackColor={{ false: '#d1d5db', true: '#FE6902' }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>

                {/* Practice Exam Settings */}
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-1 mr-4">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Enable Practice Exam</Text>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Allow students to take practice exams.
                      </Text>
                    </View>
                    <Switch
                      value={practiceSettings.isEnabled}
                      onValueChange={(v) => setPracticeSettings(prev => ({ ...prev, isEnabled: v }))}
                      trackColor={{ false: '#d1d5db', true: '#FE6902' }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View className={`${!practiceSettings.isEnabled ? 'opacity-50' : ''}`}>
                    <View className="flex-row gap-3 mb-4">
                      <View className="flex-1">
                        <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total Items</Text>
                        <TextInput
                          value={String(practiceSettings.total_items)}
                          onChangeText={(v) => setPracticeSettings(prev => ({ ...prev, total_items: parseInt(v) || 0 }))}
                          keyboardType="numeric"
                          editable={practiceSettings.isEnabled}
                          className={`border rounded-xl px-3 py-2 ${isDark ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Coverage</Text>
                        <CustomDropdown
                          items={[
                            { id: 'full', label: 'Full Coverage', value: 'full' },
                            { id: 'final', label: 'Finals', value: 'final' },
                            { id: 'midterm', label: 'Midterm', value: 'midterm' },
                          ]}
                          selectedValue={practiceSettings.coverage}
                          onSelect={(v) => setPracticeSettings(prev => ({ ...prev, coverage: v }))}
                          placeholder="Select coverage"
                        />
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                      <View>
                        <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Enable Timer</Text>
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Set a time limit for the exam.</Text>
                      </View>
                      <Switch
                        value={practiceSettings.enableTimer}
                        onValueChange={(v) => setPracticeSettings(prev => ({ ...prev, enableTimer: v }))}
                        trackColor={{ false: '#d1d5db', true: '#FE6902' }}
                        thumbColor="#fff"
                        disabled={!practiceSettings.isEnabled}
                      />
                    </View>

                    {practiceSettings.enableTimer && (
                      <View className="mb-4">
                        <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Duration (minutes)</Text>
                        <TextInput
                          value={String(practiceSettings.duration_minutes)}
                          onChangeText={(v) => setPracticeSettings(prev => ({ ...prev, duration_minutes: parseInt(v) || 0 }))}
                          keyboardType="numeric"
                          editable={practiceSettings.isEnabled}
                          className={`border rounded-xl px-3 py-2 ${isDark ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                        />
                      </View>
                    )}

                    <View className="mb-2">
                      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Difficulty Distribution</Text>
                      <CustomDropdown
                        items={[
                          { id: 'default', label: 'Default: Easy 30%, Moderate 50%, Hard 20%', value: 'default' },
                          { id: 'custom', label: 'Custom: Must equal 100%', value: 'custom' },
                        ]}
                        selectedValue={difficultyMode}
                        onSelect={(v) => {
                          setDifficultyMode(v);
                          if (v === 'default') {
                            setPracticeSettings(prev => ({
                              ...prev,
                              easy_percentage: 30,
                              moderate_percentage: 50,
                              hard_percentage: 20,
                            }));
                          }
                        }}
                        placeholder="Select mode"
                      />
                    </View>

                    {difficultyMode === 'custom' && (
                      <View className="flex-row gap-3 mt-3">
                        {['easy', 'moderate', 'hard'].map((level) => (
                          <View key={level} className="flex-1">
                            <Text className={`text-xs font-semibold mb-1 capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{level} (%)</Text>
                            <TextInput
                              value={String(practiceSettings[`${level}_percentage` as keyof typeof practiceSettings])}
                              onChangeText={(v) => setPracticeSettings(prev => ({ ...prev, [`${level}_percentage`]: parseInt(v) || 0 }))}
                              keyboardType="numeric"
                              editable={practiceSettings.isEnabled}
                              className={`border rounded-xl px-3 py-2 text-center ${isDark ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
