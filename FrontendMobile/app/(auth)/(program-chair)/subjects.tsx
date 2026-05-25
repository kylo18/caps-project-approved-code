// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair "Program Subjects" screen — fetches all subjects in the
//          program, allows selection via horizontal tabs, and displays each
//          subject's questions with status badges. Supports adding new questions,
//          approving pending questions, deleting questions, and managing subjects
//          (add/edit/delete). Uses NativeWind for mobile-native styling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
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
import PrintExamModal from '../../../src/features/practice/components/PrintExamModal';
import SubjectCard from '../../../src/features/subjects/components/SubjectCard';
import BottomModal from '../../../src/features/core/components/BottomModal';

const TABS = [
  { key: 'practice', label: 'Practice' },
  { key: 'exam', label: 'Exam' },
  { key: 'pending', label: 'Pending' },
];

export default function ProgramChairSubjectsScreen() {
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
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsHasMore, setQuestionsHasMore] = useState(true);
  const [isLoadingMoreQuestions, setIsLoadingMoreQuestions] = useState(false);

  // Subject management modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [programID, setProgramID] = useState('');
  const [yearLevelID, setYearLevelID] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [yearLevels, setYearLevels] = useState<any[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeSubjectForMenu, setActiveSubjectForMenu] = useState<any>(null);
  const [filterProgramID, setFilterProgramID] = useState<string>('All');
  const [filterYearLevelID, setFilterYearLevelID] = useState<string>('All');

  useEffect(() => {
    fetchPrograms();
    fetchYearLevels();
  }, []);

  useEffect(() => {
    fetchSubjects(true);
  }, [filterProgramID, filterYearLevelID]);

  useEffect(() => {
    // Reset questions page and refetch when a new subject is selected
    setQuestionsPage(1);
    setQuestionsHasMore(true);
    setActiveTab('practice');
    if (selectedSubject) fetchQuestions(true);
  }, [selectedSubject?.subjectID]);

  const fetchSubjects = async (reset = false) => {
    const currentCursor = reset ? null : cursor;

    if (reset) {
      setIsLoading(true);
      setCursor(null);
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
      const list = Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      if (reset) {
        setSubjects(list);
        setHasMore(data?.hasMore === true);
        if (selectedSubject) {
          const updatedSelection = list.find((subject: any) => subject.subjectID === selectedSubject.subjectID);
          setSelectedSubject(updatedSelection || null);
        }
        // Set cursor for next page to last item's subjectID
        if (list.length > 0) {
          setCursor(data?.cursor ?? list[list.length - 1].subjectID);
        }
      } else {
        setSubjects(prev => {
          const existing = new Set(prev.map((s: any) => s.subjectID));
          const newUnique = list.filter((s: any) => !existing.has(s.subjectID));
          return [...prev, ...newUnique];
        });
        setHasMore(data?.hasMore === true);
        if (list.length > 0) {
          setCursor(data?.cursor ?? list[list.length - 1].subjectID);
        }
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

    if (reset) {
      setIsLoadingQuestions(true);
      setQuestionsPage(1);
      setQuestionsHasMore(true);
    } else {
      setIsLoadingMoreQuestions(true);
    }

    try {
      const data = await apiRequest(`/api/subjects/${selectedSubject.subjectID}/questions?page=${currentPage}&limit=20`);
      const list = Array.isArray(data?.questions) ? data.questions : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const total: number | undefined = data?.total ?? data?.count ?? data?.totalCount;

      if (reset) {
        setQuestions(list);
        setQuestionsHasMore(total !== undefined ? list.length < total : list.length >= 20);
      } else {
        setQuestions(prev => {
          const existing = new Set(prev.map((q: any) => q.questionID));
          const newUnique = list.filter((q: any) => !existing.has(q.questionID));
          const nextQuestions = [...prev, ...newUnique];
          setQuestionsHasMore(total !== undefined ? nextQuestions.length < total : list.length >= 20);
          return nextQuestions;
        });
        setQuestionsPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      if (reset) {
        setIsLoadingQuestions(false);
      } else {
        setIsLoadingMoreQuestions(false);
      }
    }
  };

  const handleLoadMoreQuestions = () => {
    if (!questionsHasMore || isLoadingMoreQuestions || isLoadingQuestions) return;
    fetchQuestions(false);
  };

  const handleMainScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const distanceFromBottom =
      nativeEvent.contentSize.height -
      (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y);

    if (distanceFromBottom > 96) {
      return;
    }

    if (selectedSubject) {
      handleLoadMoreQuestions();
    } else {
      handleLoadMore();
    }
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

  const filteredQuestions = useMemo(() => questions.filter((q: any) => {
    if (activeTab === 'pending') return q.status_id === 1 || q.status === 'pending';
    if (activeTab === 'practice') return (q.purpose_id === 2 || q.purpose === 'practice') && (q.status_id !== 1 && q.status !== 'pending');
    if (activeTab === 'exam') return (q.purpose_id === 1 || q.purpose === 'exam') && (q.status_id !== 1 && q.status !== 'pending');
    return true;
  }), [questions, activeTab]);

  const handleApproveQuestion = (questionID: number) => {
    Alert.alert(
      'Approve Question',
      'Are you sure you want to approve this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await apiRequest(`/api/questions/${questionID}/status`, { method: 'PATCH' });
              setQuestions(prev => prev.map(q => q.questionID === questionID ? { ...q, status: 'approved', status_id: 2 } : q));
              showToast('Question approved', 'success');
            } catch (error) {
              showToast('Failed to approve question', 'error');
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

  const openEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setSubjectCode(subject.subjectCode || '');
    setSubjectName(subject.subjectName || subject.name || '');
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
      await fetchSubjects(true);
    } catch (error: unknown) {
      const message = error instanceof Error && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message || error.message || 'Failed to save subject'
        : 'Failed to save subject';
      showToast(message, 'error');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = (subject: any) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete "${subject.subjectName || subject.name}"?`,
      [
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
              await fetchSubjects(true);
              showToast('Subject deleted', 'success');
            } catch (error) {
              showToast('Failed to delete subject', 'error');
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

  const fabActions = useMemo<AdminToolAction[]>(() => [
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
    {
      key: 'print-export',
      icon: 'print-outline',
      label: 'Print / Export',
      onPress: () => setShowPrintModal(true),
      backgroundColor: '#8B5CF6',
    },
  ], [selectedSubject, router, setShowPrintModal]);

  useScreenFloatingTools(fabActions);

  // Render loading state
  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
        <CapsActivityIndicator size="large" color="#FE6902" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
      {/* Header */}
      <View className={`px-4 pb-3 pt-3 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'} border-b ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`} style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                if (selectedSubject) {
                  setSelectedSubject(null);
                  return;
                }
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/(program-chair)/dashboard');
              }}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedSubject ? (selectedSubject.subjectName || selectedSubject.name || 'Subject Questions') : 'Program Subjects'}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(program-chair)/classes')}
              className={`px-3 py-2 rounded-xl ${isDark ? 'bg-[#242424]' : 'bg-gray-100'}`}
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
        onScroll={handleMainScroll}
        scrollEventThrottle={250}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
      >
        {!selectedSubject ? (
          <View className="px-4 py-4">
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
                    className={`px-3 py-1.5 rounded-full ${filterProgramID === 'All' ? 'bg-primary' : isDark ? 'bg-[#242424]' : 'bg-white border border-gray-200'}`}
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
                        className={`px-3 py-1.5 rounded-full ${filterProgramID === id ? 'bg-primary' : isDark ? 'bg-[#242424]' : 'bg-white border border-gray-200'}`}
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
                    className={`px-3 py-1.5 rounded-full ${filterYearLevelID === 'All' ? 'bg-primary' : isDark ? 'bg-[#242424]' : 'bg-white border border-gray-200'}`}
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
                        className={`px-3 py-1.5 rounded-full ${filterYearLevelID === id ? 'bg-primary' : isDark ? 'bg-[#242424]' : 'bg-white border border-gray-200'}`}
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

            {subjects.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-[#242424]' : 'bg-white'}`}>
                <Ionicons name="book-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Subjects Yet</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Add a subject to start organizing your question bank.
                </Text>
              </View>
            ) : (
              <>
                {subjects.map((subject) => (
                  <SubjectCard
                    key={String(subject.subjectID)}
                    subject={subject}
                    role="program_chair"
                    onPress={() => setSelectedSubject(subject)}
                    onMenuPress={() => {
                      setActiveSubjectForMenu(subject);
                      setShowActionModal(true);
                    }}
                  />
                ))}
                {isLoadingMore ? (
                    <View className="py-4 items-center">
                      <CapsActivityIndicator size="small" color="#FE6902" />
                      <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading more...</Text>
                    </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <>
          <View className="px-4 mb-3">
            <View className={`flex-row rounded-xl p-1 ${isDark ? 'bg-[#242424]' : 'bg-white'}`}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.key ? 'bg-primary' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-semibold ${activeTab === tab.key ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({filteredQuestions.length})
              </Text>
            </View>

            {isLoadingQuestions ? (
              <View className="py-16 items-center">
                <CapsActivityIndicator size="large" color="#FE6902" />
                <Text className="text-sm mt-3" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading questions...</Text>
              </View>
            ) : filteredQuestions.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-[#242424]' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Questions Yet</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Start adding questions for this subject.
                </Text>
              </View>
            ) : (
              <>
                {filteredQuestions.map((q, idx) => (
                <View
                  key={q.questionID || idx}
                  className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-[#242424]' : 'bg-white'}`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Q{idx + 1}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-1 rounded-lg ${q.status === 'approved' || q.status_id === 2 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        <Text className="text-white text-xs font-semibold">{q.status === 'approved' || q.status_id === 2 ? 'Approved' : 'Pending'}</Text>
                      </View>
                      {(q.status === 'pending' || q.status_id === 1) && (
                        <TouchableOpacity
                          onPress={() => handleApproveQuestion(q.questionID)}
                          className="p-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </TouchableOpacity>
                      )}
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
                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 dark:border-[#2A2A2A]">
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{q.choices?.length || 4} choices</Text>
                    <Ionicons name="chevron-forward" size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                  </View>
                </View>
                ))}
                {isLoadingMoreQuestions ? (
                    <View className="py-4 items-center">
                      <CapsActivityIndicator size="small" color="#FE6902" />
                    </View>
                ) : null}
              </>
            )}
          </View>
          </>
        )}
      </ScrollView>



      <PrintExamModal visible={showPrintModal} onClose={() => setShowPrintModal(false)} />

      {/* Add/Edit Subject Modal */}
      <Modal visible={showSubjectModal} transparent animationType="fade" onRequestClose={() => setShowSubjectModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className={`rounded-t-3xl p-5 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
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
              className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'border-[#2A2A2A] text-white bg-[#242424]' : 'border-gray-200 text-gray-900 bg-white'}`}
            />

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject Name</Text>
            <TextInput
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g. Introduction to Computer Science"
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'border-[#2A2A2A] text-white bg-[#242424]' : 'border-gray-200 text-gray-900 bg-white'}`}
            />

            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Program</Text>
            <View className={`border rounded-xl mb-4 overflow-hidden ${isDark ? 'border-[#2A2A2A] bg-[#242424]' : 'border-gray-200 bg-white'}`}>
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
            <View className={`border rounded-xl mb-6 overflow-hidden ${isDark ? 'border-[#2A2A2A] bg-[#242424]' : 'border-gray-200 bg-white'}`}>
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

      <BottomModal
        visible={showActionModal}
        title="Subject Actions"
        onClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-200 dark:border-[#2A2A2A]"
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
