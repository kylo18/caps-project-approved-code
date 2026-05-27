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

import { useState, useEffect, useMemo, useRef } from 'react';
import {   View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, useWindowDimensions, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import CustomDropdown from '../../../src/features/core/components/CustomDropdown';

// Types
interface Subject {
  subjectID: number;
  subjectName: string;
  subjectCode?: string;
  programID?: number | string;
  yearLevelID?: number | string;
}

interface Question {
  questionID: number;
  questionText?: string;
  status?: string;
  status_name?: string;
  choices?: unknown[];
  subjectName?: string;
  topic?: string;
  difficulty?: string;
  points?: number;
  score?: number;
  maxPoints?: number;
}

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

function normalizeQuestion(question: any): Question {
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

export default function AssoDeanSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ subjectID?: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsHasMore, setQuestionsHasMore] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
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
  const hasAppliedParamSubject = useRef(false);

  useEffect(() => {
    fetchPrograms();
    fetchYearLevels();
  }, []);

  useEffect(() => {
    fetchSubjects(true);
  }, [filterProgramID, filterYearLevelID]);

  // Auto-select subject from URL param after subjects load
  useEffect(() => {
    if (subjects.length > 0 && params.subjectID && !hasAppliedParamSubject.current) {
      const match = subjects.find((s: Subject) => String(s.subjectID) === params.subjectID);
      if (match) {
        setSelectedSubject(match);
        hasAppliedParamSubject.current = true;
      }
    }
  }, [subjects, params.subjectID]);

  useEffect(() => {
    if (selectedSubject) fetchQuestions(true);
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
      const list: Subject[] = Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      if (reset) {
        setSubjects(list);
        setHasMore(data?.hasMore === true);
        if (selectedSubject) {
          const updatedSelection = list.find((subject) => subject.subjectID === selectedSubject.subjectID);
          setSelectedSubject(updatedSelection || null);
        }
      } else {
        setSubjects(prev => {
          const existing = new Set(prev.map(s => s.subjectID));
          const newUnique = list.filter(s => !existing.has(s.subjectID));
          return [...prev, ...newUnique];
        });
        setHasMore(data?.hasMore === true);
      }
      if (list.length > 0) {
        setCursor(data?.cursor ?? list[list.length - 1].subjectID);
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

  const handleLoadMoreQuestions = () => {
    if (!questionsHasMore || isLoadingQuestions || !selectedSubject) return;
    fetchQuestions(false);
  };

  const fetchQuestions = async (reset = false) => {
    if (!selectedSubject) return;
    const currentPage = reset ? 1 : questionsPage;
    setIsLoadingQuestions(true);
    try {
      const data = await apiRequest(
        `/api/subjects/${selectedSubject.subjectID}/questions?page=${currentPage}&limit=20`
      );
      const qList: Question[] = (Array.isArray(data?.questions) ? data.questions : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []).map(normalizeQuestion);
      const totalPages = data?.total_pages;

      if (reset) {
        setQuestions(qList);
        setQuestionsPage(1);
        setQuestionsHasMore(totalPages ? currentPage < totalPages : qList.length === 20);
      } else {
        setQuestions(prev => {
          const existing = new Set(prev.map(q => q.questionID));
          const newUnique = qList.filter(q => !existing.has(q.questionID));
          return [...prev, ...newUnique];
        });
        setQuestionsPage(prev => prev + 1);
        setQuestionsHasMore(totalPages ? currentPage < totalPages : qList.length === 20);
      }
    } catch (error) {
      showToast('Unable to load questions', 'error');
    } finally {
      setIsLoadingQuestions(false);
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

  const openEditSubject = (subject: Subject) => {
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
          method: 'PUT',
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
        ? (error as { data?: { message?: string } }).data?.message || 'Failed to save subject'
        : 'Failed to save subject';
      showToast(message, 'error');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert('Delete Subject', `Are you sure you want to delete "${subject.subjectName}"?`, [
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
    ]);
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
    await fetchSubjects(true);
    if (selectedSubject) await fetchQuestions(true);
    setIsRefreshing(false);
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
    {
      key: 'configure-subject',
      icon: 'settings-outline',
      label: 'Configure Subject',
      onPress: () => {},
      disabled: true,
      backgroundColor: '#6366F1',
    },
  ], [selectedSubject, router, openAddSubject, setShowPrintModal]);

  useScreenFloatingTools(fabActions);

  const programItems = useMemo(() => [
    { id: 'All', label: 'All Programs', value: 'All' },
    ...programs.map(p => ({
      id: String(p.programID || p.id),
      label: p.programName || p.name || '',
      value: String(p.programID || p.id)
    }))
  ], [programs]);

  const yearItems = useMemo(() => [
    { id: 'All', label: 'All Years', value: 'All' },
    ...yearLevels.map(yl => ({
      id: String(yl.yearLevelID || yl.id),
      label: yl.name || yl.yearLevel || '',
      value: String(yl.yearLevelID || yl.id)
    }))
  ], [yearLevels]);

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
          <TouchableOpacity onPress={() => {
            if (selectedSubject) {
              setSelectedSubject(null);
              return;
            }
            if (router.canGoBack()) router.back(); else router.replace('/(auth)/(associate-dean)/dashboard');
          }} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={24} className={isDark ? 'text-white' : 'text-gray-900'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubject?.subjectName || 'Subjects'}</Text>
          </View>
        </View>
      </View>

      {!selectedSubject ? (
        <View className="flex-1 px-4 py-4">
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Subject List ({subjects.length})
          </Text>

          {/* Filters */}
          <View className="flex-row gap-3 mb-4 z-50">
            <View className="flex-1">
              <CustomDropdown
                label="Program"
                items={programItems}
                selectedValue={filterProgramID}
                onSelect={(val) => setFilterProgramID(val)}
                placeholder="Select Program"
              />
            </View>
            <View className="flex-1">
              <CustomDropdown
                label="Year Level"
                items={yearItems}
                selectedValue={filterYearLevelID}
                onSelect={(val) => setFilterYearLevelID(val)}
                placeholder="Select Year"
              />
            </View>
          </View>

          <FlatList
            data={subjects}
            keyExtractor={(subject) => subject.subjectID?.toString() || Math.random().toString()}
            renderItem={({ item: subject }) => (
              <SubjectCard
                subject={subject}
                role="associate_dean"
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
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FE6902" />
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
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-[#242424]' : 'bg-white'}`}>
                <Ionicons name="book-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Subjects Yet</Text>
              </View>
            }
          />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Questions ({questions.length})
            </Text>
          </View>

          <FlatList
            data={questions}
            keyExtractor={(q, idx) => q.questionID?.toString() || idx.toString()}
            renderItem={({ item: q, index: idx }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/practice-exam/edit-question', params: { questionID: q.questionID, question: JSON.stringify(q), returnTo: `/(auth)/(associate-dean)/subjects?subjectID=${selectedSubject?.subjectID}` } })}
                className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-[#242424]' : 'bg-white'}`}
                activeOpacity={0.7}
              >
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
                    baseStyle={{ color: isDark ? '#fff' : '#111827' }}
                    tagsStyles={{
                      p: { color: isDark ? '#fff' : '#111827', fontSize: 15, lineHeight: 20, marginBottom: 4 },
                      li: { color: isDark ? '#fff' : '#111827', fontSize: 14, lineHeight: 18 },
                      strong: { color: isDark ? '#fff' : '#111827', fontWeight: '700' },
                      u: { textDecorationLine: 'underline' },
                      a: { color: '#FE6902' },
                      img: {
                        backgroundColor: isDark ? '#ffffff' : 'transparent',
                        borderRadius: 8,
                        padding: 6,
                      },
                    }}
                    ignoredStyles={['color', 'backgroundColor']}
                  />
                </View>
                <View className="flex-row items-center pt-2 border-t border-gray-200 dark:border-[#2A2A2A]">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{q.choices?.length || 4} choices</Text>
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
            ListFooterComponent={
              isLoadingQuestions ? (
                <View className="py-4 items-center">
                  <CapsActivityIndicator size="small" color="#FE6902" />
                  <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-[#242424]' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Questions</Text>
              </View>
            }
          />
        </View>
      )}

      <PrintExamModal visible={showPrintModal} onClose={() => setShowPrintModal(false)} />

      <Modal visible={showSubjectModal} transparent animationType="fade" onRequestClose={() => setShowSubjectModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
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

            <CustomDropdown
              label="Program"
              items={programs.map((p: any) => ({ id: p.programID || p.id, label: p.programName || p.name, value: String(p.programID || p.id) }))}
              selectedValue={programID}
              onSelect={(value: any) => setProgramID(value)}
              placeholder="Select program"
            />

            <View className="mb-4" />

            <CustomDropdown
              label="Year Level"
              items={yearLevels.map((yl: any) => ({ id: yl.yearLevelID || yl.id, label: yl.name || yl.yearLevel, value: String(yl.yearLevelID || yl.id) }))}
              selectedValue={yearLevelID}
              onSelect={(value: any) => setYearLevelID(value)}
              placeholder="Select year level"
            />

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
          </KeyboardAvoidingView>
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
