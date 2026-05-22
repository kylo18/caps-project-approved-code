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

import { useState, useEffect, useCallback, useMemo } from 'react';
import {   View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, useWindowDimensions, Switch, Alert, FlatList } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import ConfirmModal from '../../../src/features/core/components/ConfirmModal';
import CustomDropdown from '../../../src/features/core/components/CustomDropdown';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import type { AdminToolAction } from '../../../src/features/admin/shared/components/AdminFloatingTools';
import PrintExamModal from '../../../src/features/practice/components/PrintExamModal';
import SubjectCard from '../../../src/features/subjects/components/SubjectCard';
import BottomModal from '../../../src/features/core/components/BottomModal';

type SubjectItem = {
  subjectID: number;
  subjectName: string;
  subjectCode?: string;
  programID?: number | string;
  yearLevelID?: number | string;
  [key: string]: unknown;
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
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsHasMore, setQuestionsHasMore] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionItem | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [programID, setProgramID] = useState('');
  const [yearLevelID, setYearLevelID] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [yearLevels, setYearLevels] = useState<any[]>([]);
  const [filterProgramID, setFilterProgramID] = useState<string>('All');
  const [filterYearLevelID, setFilterYearLevelID] = useState<string>('All');

  // Subject settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTargetSubjectIDs, setSettingsTargetSubjectIDs] = useState<number[]>([]);
  const [isExamEnabled, setIsExamEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
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
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeSubjectForMenu, setActiveSubjectForMenu] = useState<any>(null);

  const resetSettingsForm = () => {
    setIsExamEnabled(false);
    setSettingsMessage('');
    setPracticeSettings({
      isEnabled: false,
      enableTimer: false,
      duration_minutes: 30,
      coverage: 'midterm',
      easy_percentage: 30,
      moderate_percentage: 50,
      hard_percentage: 20,
      total_items: 100,
    });
    setDifficultyMode('default');
  };

  // Fetch subjects, programs, and year levels on mount
  useEffect(() => {
    fetchPrograms();
    fetchYearLevels();
  }, []);

  // Re-fetch subjects when filters change
  useEffect(() => {
    fetchSubjects(true);
  }, [filterProgramID, filterYearLevelID]);

  // Fetch questions when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions(true);
    }
  }, [selectedSubject]);

  const fetchSubjects = async (reset = false) => {
    const currentCursor = reset ? null : cursor;

    if (reset) {
      setIsLoading(true);
      setSubjects([]);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let url = '/api/subjects?limit=20';
      if (currentCursor !== null) {
        url += `&cursor=${currentCursor}`;
      }
      if (filterProgramID !== 'All') {
        url += `&programID=${filterProgramID}`;
      }
      if (filterYearLevelID !== 'All') {
        url += `&yearLevelID=${filterYearLevelID}`;
      }

      const data = await apiRequest(url);
      const list = Array.isArray(data?.subjects) ? data.subjects :
        Array.isArray(data?.data) ? data.data :
          Array.isArray(data) ? data : [];
      const normalizedSubjects = list.map(normalizeSubject);

      if (reset) {
        setSubjects(normalizedSubjects);
        setHasMore(data.hasMore === true);
        if (normalizedSubjects.length === 0) {
          return;
        }
        if (selectedSubject) {
          const updatedSelection = normalizedSubjects.find((subject: SubjectItem) => subject.subjectID === selectedSubject.subjectID);
          setSelectedSubject(updatedSelection || null);
        }
      } else {
        setSubjects(prev => {
          const existing = new Set(prev.map((s: SubjectItem) => s.subjectID));
          const newUnique = normalizedSubjects.filter((s: SubjectItem) => !existing.has(s.subjectID));
          return [...prev, ...newUnique];
        });
        setHasMore(data.hasMore === true);
        setCursor(data.cursor);
      }
    } catch (error) {
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

  const fetchQuestions = async (reset = false) => {
    if (!selectedSubject) return;
    const currentPage = reset ? 1 : questionsPage;
    setIsLoadingQuestions(true);
    try {
      const data = await apiRequest(
        `/api/subjects/${selectedSubject.subjectID}/questions?page=${currentPage}&limit=20`
      );
      const items = Array.isArray(data?.questions) ? data.questions :
        Array.isArray(data?.data) ? data.data :
          Array.isArray(data) ? data : [];
      const total = data?.total;
      const totalPages = data?.total_pages;

      if (reset) {
        setQuestions(items.map(normalizeQuestion));
        setQuestionsPage(1);
        setQuestionsHasMore(totalPages ? currentPage < totalPages : items.length === 20);
      } else {
        setQuestions(prev => [...prev, ...items.map(normalizeQuestion)]);
        setQuestionsPage(prev => prev + 1);
        setQuestionsHasMore(totalPages ? currentPage < totalPages : items.length === 20);
      }
    } catch (error) {
      showToast('Unable to load questions', 'error');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleLoadMoreQuestions = () => {
    if (!questionsHasMore || isLoadingQuestions || !selectedSubject) return;
    fetchQuestions(false);
  };

  const fetchPrograms = async () => {
    try {
      const res = await apiRequest('/api/programs');
      const list = Array.isArray(res?.programs) ? res.programs :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res : [];
      setPrograms(list);
    } catch {
      setPrograms([]);
    }
  };

  const fetchYearLevels = async () => {
    try {
      const res = await apiRequest('/api/year-levels');
      const list = Array.isArray(res?.year_levels) ? res.year_levels :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res : [];
      setYearLevels(list);
    } catch {
      setYearLevels([]);
    }
  };

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectCode('');
    setSubjectName('');
    setProgramID('');
    setYearLevelID('');
    fetchPrograms();
    fetchYearLevels();
    setShowSubjectModal(true);
  };

  const openEditSubject = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setSubjectCode(subject.subjectCode || '');
    setSubjectName(subject.subjectName || '');
    setProgramID(String(subject.programID || ''));
    setYearLevelID(String(subject.yearLevelID || ''));
    fetchPrograms();
    fetchYearLevels();
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectCode.trim() || !subjectName.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (!programID) {
      showToast('Please select a program', 'error');
      return;
    }
    if (!yearLevelID) {
      showToast('Please select a year level', 'error');
      return;
    }
    setIsSavingSubject(true);
    try {
      if (editingSubject) {
        await apiRequest(`/api/subjects/${editingSubject.subjectID}/update`, {
          method: 'POST',
          body: {
            subjectCode: subjectCode.trim(),
            subjectName: subjectName.trim(),
            programID: Number(programID),
            yearLevelID: Number(yearLevelID),
          },
        });
        showToast('Subject updated', 'success');
      } else {
        await apiRequest('/api/add-subjects', {
          method: 'POST',
          body: {
            subjectCode: subjectCode.trim(),
            subjectName: subjectName.trim(),
            programID: Number(programID),
            yearLevelID: Number(yearLevelID),
          },
        });
        showToast('Subject added', 'success');
      }
      setShowSubjectModal(false);
      await fetchSubjects();
    } catch (error: unknown) {
      const message = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || 'Failed to save subject'
        : 'Failed to save subject';
      showToast(message, 'error');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = (subject: SubjectItem) => {
    const subjectLabel = subject.subjectName || 'this subject';
    Alert.alert('Delete Subject', `Are you sure you want to delete "${subjectLabel}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/api/subjects/${subject.subjectID}/delete`, { method: 'DELETE' });
            if (selectedSubject?.subjectID === subject.subjectID) {
              setSelectedSubject(null);
              setQuestions([]);
            }
            await fetchSubjects();
            showToast('Subject deleted', 'success');
          } catch (error) {
            showToast('Failed to delete subject', 'error');
          }
        },
      },
    ]);
  };

  const fetchSubjectSettings = async (subjectId: number) => {
    setSettingsLoading(true);
    setSettingsMessage('');
    try {
      const [qeRes, practiceRes] = await Promise.allSettled([
        apiRequest(`/api/subjects/${subjectId}/exam-questions-status`),
        apiRequest(`/api/practice-settings/${subjectId}`),
      ]);
      if (qeRes.status === 'fulfilled') {
        const qeData = qeRes.value?.data || qeRes.value || {};
        setIsExamEnabled(!!qeData.is_enabled_for_exam_questions);
      } else {
        setIsExamEnabled(false);
        console.error('Error fetching exam question status:', qeRes.reason);
      }

      const ps =
        practiceRes.status === 'fulfilled'
          ? practiceRes.value?.data || practiceRes.value || {}
          : {};
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
      if (practiceRes.status === 'rejected') {
        const message = String(practiceRes.reason?.message || '').toLowerCase();
        if (message.includes('practice exam setting not found')) {
          setSettingsMessage('No settings available yet. Default values are shown below.');
        } else {
          setSettingsMessage('Unable to load saved settings. Default values are shown below.');
          console.error('Error fetching practice settings:', practiceRes.reason);
        }
      }
    } catch (error) {
      console.error('Error fetching subject settings:', error);
      resetSettingsForm();
      setSettingsMessage('Unable to load saved settings. Default values are shown below.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const openSettingsModal = async (subjectIds: number[] = selectedSubject ? [selectedSubject.subjectID] : []) => {
    setSettingsTargetSubjectIDs(subjectIds);
    setShowSettingsModal(true);

    if (subjectIds.length === 1) {
      await fetchSubjectSettings(subjectIds[0]);
      return;
    }

    resetSettingsForm();
  };

  const toggleSettingsTargetSubject = async (subjectId: number) => {
    let nextSelection: number[] = [];

    setSettingsTargetSubjectIDs((prev) => {
      nextSelection = prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId];
      return nextSelection;
    });

    if (nextSelection.length === 1) {
      await fetchSubjectSettings(nextSelection[0]);
    } else if (nextSelection.length === 0) {
      resetSettingsForm();
    }
  };

  const saveSubjectSettings = async () => {
    if (settingsTargetSubjectIDs.length === 0) {
      showToast('Select at least one subject for the settings.', 'error');
      return;
    }
    setSettingsSaving(true);
    try {
      const total = practiceSettings.easy_percentage + practiceSettings.moderate_percentage + practiceSettings.hard_percentage;
      if (practiceSettings.isEnabled && total !== 100) {
        showToast('Difficulty percentages must total 100%', 'error');
        setSettingsSaving(false);
        return;
      }

      await Promise.all(
        settingsTargetSubjectIDs.map(async (subjectId) => {
          const endpoint = isExamEnabled
            ? `/api/subjects/${subjectId}/enable-exam-questions`
            : `/api/subjects/${subjectId}/disable-exam-questions`;
          await apiRequest(endpoint, { method: 'PATCH' });

          await apiRequest('/api/practice-settings', {
            method: 'POST',
            body: {
              subjectID: subjectId,
              ...practiceSettings,
              duration_minutes: practiceSettings.enableTimer ? practiceSettings.duration_minutes : 0,
            },
          });
        })
      );

      // Update local subject state to reflect exam enabled status
      setSubjects((prev) =>
        prev.map((s) =>
          settingsTargetSubjectIDs.includes(s.subjectID)
            ? { ...s, is_enabled_for_exam_questions: isExamEnabled }
            : s
        )
      );

      showToast(
        settingsTargetSubjectIDs.length === 1
          ? 'Subject settings saved'
          : `Settings saved to ${settingsTargetSubjectIDs.length} subjects`,
        'success'
      );
      setShowSettingsModal(false);
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubjects(true);
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

  const fabActions = useMemo<AdminToolAction[]>(() => [
    {
      key: 'add-subject',
      icon: 'book-outline',
      label: 'Add Subject',
      onPress: openAddSubject,
      disabled: !!selectedSubject,
      backgroundColor: '#FE6902',
    },
    {
      key: 'add-question',
      icon: 'help-circle-outline',
      label: 'Add Question',
      onPress: () => {
        if (!selectedSubject) return;
        router.push({
          pathname: '/(auth)/practice-exam/add-question',
          params: { subjectID: selectedSubject.subjectID }
        });
      },
      disabled: !selectedSubject,
      backgroundColor: '#10B981',
    },
    {
      key: 'print-export',
      icon: 'print-outline',
      label: 'Print / Export',
      onPress: () => setShowPrintModal(true),
      backgroundColor: '#8B5CF6',
    },
    {
      key: 'configure-subject',
      icon: 'settings-outline',
      label: 'Configure Subject',
      onPress: () => openSettingsModal(),
      disabled: false,
      backgroundColor: '#6366F1',
    },
  ], [selectedSubject, router, openAddSubject, setShowPrintModal, openSettingsModal]);

  useScreenFloatingTools(fabActions);

  // Render loading skeleton
  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <View className={`px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="h-8 w-40 bg-gray-300 rounded-lg" />
        </View>
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color="#FE6902" />
          <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading subjects...
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
              onPress={() => {
                if (selectedSubject) {
                  setSelectedSubject(null);
                  setQuestions([]);
                  setSearchQuery('');
                  return;
                }
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/(dean)/dashboard');
              }}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} className={isDark ? 'text-white' : 'text-gray-900'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedSubject?.subjectName || 'Subjects'}
            </Text>
          </View>
        </View>
      </View>

      {!selectedSubject ? (
        <View className="flex-1 px-4 py-4">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Subject List ({subjects.length})
          </Text>

          {/* Filters */}
          <View className="mb-4 gap-2">
            {/* Program Filter */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setFilterProgramID('All')}
                  className={`px-3 py-1.5 rounded-full ${filterProgramID === 'All' ? 'bg-primary' : isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-xs ${filterProgramID === 'All' ? 'text-white font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    All Programs
                  </Text>
                </TouchableOpacity>
                {programs.map((p: any) => {
                  const id = String(p.programID || p.id);
                  const name = p.programName || p.name || '';
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => setFilterProgramID(id)}
                      className={`px-3 py-1.5 rounded-full ${filterProgramID === id ? 'bg-primary' : isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
                      activeOpacity={0.7}
                    >
                      <Text className={`text-xs ${filterProgramID === id ? 'text-white font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Year Level Filter */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setFilterYearLevelID('All')}
                  className={`px-3 py-1.5 rounded-full ${filterYearLevelID === 'All' ? 'bg-primary' : isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-xs ${filterYearLevelID === 'All' ? 'text-white font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    All Years
                  </Text>
                </TouchableOpacity>
                {yearLevels.map((yl: any) => {
                  const id = String(yl.yearLevelID || yl.id);
                  const name = yl.name || yl.yearLevel || '';
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => setFilterYearLevelID(id)}
                      className={`px-3 py-1.5 rounded-full ${filterYearLevelID === id ? 'bg-primary' : isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
                      activeOpacity={0.7}
                    >
                      <Text className={`text-xs ${filterYearLevelID === id ? 'text-white font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <FlatList
            data={subjects}
            keyExtractor={(subject) => subject.subjectID?.toString() || Math.random().toString()}
            renderItem={({ item: subject }) => (
              <SubjectCard
                subject={subject}
                role="dean"
                onPress={() => setSelectedSubject(subject)}
                onMenuPress={() => {
                  setActiveSubjectForMenu(subject);
                  setShowActionModal(true);
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.9}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#FE6900"
              />
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View className="py-4 items-center">
                  <CapsActivityIndicator size="small" color="#FE6902" />
                  <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="book-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Subjects Yet</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Add a subject to start reviewing its questions.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <View className="flex-1">
          {/* Search bar */}
          <View className="px-4 py-3">
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

          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({filteredQuestions.length})
              </Text>
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/(auth)/practice-exam/duplicate-question',
                  params: { subjectID: selectedSubject?.subjectID }
                })}
                className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <Text className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Duplicate</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={filteredQuestions}
            keyExtractor={(q, idx) => q.questionID?.toString() || idx.toString()}
            renderItem={({ item: q, index: idx }) => (
              <TouchableOpacity
                onPress={() => openDetail(q)}
                className={`rounded-2xl p-4 mx-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
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
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {q.choices?.length || 4} choices
                  </Text>
                </View>

                <View style={{ marginBottom: 12, maxHeight: 56, overflow: 'hidden' }}>
                  <RenderHtml
                    contentWidth={windowWidth - 96}
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
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            onEndReached={handleLoadMoreQuestions}
            onEndReachedThreshold={0.9}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#FE6900"
              />
            }
            ListFooterComponent={
              isLoadingQuestions ? (
                <View className="py-6 items-center">
                  <CapsActivityIndicator size="small" color="#FE6902" />
                  <Text className="text-xs mt-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className={`rounded-3xl p-8 items-center mx-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {searchQuery ? 'No Results Found' : 'No Questions Yet'}
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Try adjusting your search terms.' : `Add questions for ${selectedSubject?.subjectName}.`}
                </Text>
              </View>
            }
          />
        </View>
      )}

      <PrintExamModal visible={showPrintModal} onClose={() => setShowPrintModal(false)} />

      <Modal visible={showSubjectModal} transparent animationType="fade" onRequestClose={() => setShowSubjectModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className={`rounded-t-3xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject Code</Text>
            <TextInput
              value={subjectCode}
              onChangeText={setSubjectCode}
              placeholder="e.g. CS101"
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'border-gray-700 text-white bg-gray-800' : 'border-gray-200 text-gray-900 bg-white'}`}
            />

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject Name</Text>
            <TextInput
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g. Introduction to Computer Science"
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'border-gray-700 text-white bg-gray-800' : 'border-gray-200 text-gray-900 bg-white'}`}
            />

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Program</Text>
            <View className={`border rounded-xl mb-4 overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 8 }}>
                {programs.map((p: any) => (
                  <TouchableOpacity
                    key={p.programID || p.id}
                    onPress={() => setProgramID(String(p.programID || p.id))}
                    className={`px-3 py-2 rounded-lg ${String(programID) === String(p.programID || p.id) ? 'bg-primary' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm ${String(programID) === String(p.programID || p.id) ? 'text-white font-bold' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {p.programName || p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Year Level</Text>
            <View className={`border rounded-xl mb-6 overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 8 }}>
                {yearLevels.map((yl: any) => (
                  <TouchableOpacity
                    key={yl.yearLevelID || yl.id}
                    onPress={() => setYearLevelID(String(yl.yearLevelID || yl.id))}
                    className={`px-3 py-2 rounded-lg ${String(yearLevelID) === String(yl.yearLevelID || yl.id) ? 'bg-primary' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm ${String(yearLevelID) === String(yl.yearLevelID || yl.id) ? 'text-white font-bold' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {yl.name || yl.yearLevel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={handleSaveSubject}
              disabled={isSavingSubject}
              className={`rounded-xl py-4 items-center ${isSavingSubject ? 'opacity-60' : ''}`}
              style={{ backgroundColor: '#FE6902' }}
              activeOpacity={0.8}
            >
              {isSavingSubject ? (
                <CapsActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">{editingSubject ? 'Save Changes' : 'Add Subject'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                <CapsActivityIndicator size="large" color="#FE6902" />
                <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading settings...</Text>
              </View>
            ) : (
              <>
                <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-1 mr-3">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Target Subjects</Text>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Apply these settings to one subject or multiple subjects.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSettingsTargetSubjectIDs(subjects.map((subject) => subject.subjectID))}
                      className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <Text className="text-primary font-semibold">Select All</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    {subjects.map((subject) => {
                      const selected = settingsTargetSubjectIDs.includes(subject.subjectID);
                      return (
                        <TouchableOpacity
                          key={subject.subjectID}
                          onPress={() => toggleSettingsTargetSubject(subject.subjectID)}
                          className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                          activeOpacity={0.7}
                        >
                          <Text className={`text-sm font-semibold ${selected ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {subject.subjectName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {settingsTargetSubjectIDs.length === 0 ? (
                    <Text className={`text-xs mt-3 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Select at least one subject before saving.
                    </Text>
                  ) : null}
                </View>

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
                  {settingsMessage ? (
                    <View className={`rounded-xl px-3 py-3 mb-4 ${isDark ? 'bg-orange-500/10 border border-orange-400/30' : 'bg-orange-50 border border-orange-200'}`}>
                      <Text className={`${isDark ? 'text-orange-100' : 'text-orange-800'} text-sm font-medium`}>
                        {settingsMessage}
                      </Text>
                    </View>
                  ) : null}
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

      <BottomModal
        visible={showActionModal}
        title="Subject Actions"
        onClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-200 dark:border-gray-800"
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
          onPress={() => {
            setShowActionModal(false);
            if (activeSubjectForMenu) {
              openEditSubject(activeSubjectForMenu);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={22} color={isDark ? '#fff' : '#111827'} />
          <Text className="text-base font-semibold ml-3" style={{ color: isDark ? '#fff' : '#111827', marginLeft: 12 }}>Edit Subject Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-200 dark:border-gray-800"
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
          onPress={() => {
            setShowActionModal(false);
            if (activeSubjectForMenu) {
              openSettingsModal([activeSubjectForMenu.subjectID]);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color={isDark ? '#fff' : '#111827'} />
          <Text className="text-base font-semibold ml-3" style={{ color: isDark ? '#fff' : '#111827', marginLeft: 12 }}>Configure Qualifying Exam Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4"
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
          onPress={() => {
            setShowActionModal(false);
            if (activeSubjectForMenu) {
              handleDeleteSubject(activeSubjectForMenu);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
          <Text className="text-base font-semibold ml-3" style={{ color: '#EF4444', marginLeft: 12 }}>Delete Subject</Text>
        </TouchableOpacity>
      </BottomModal>
    </View>
  );
}
