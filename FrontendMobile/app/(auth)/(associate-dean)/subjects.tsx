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

import { useState, useEffect, useMemo } from 'react';
import {   View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, useWindowDimensions, Modal, TextInput } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { Skeleton, SkeletonList } from '../../../src/components/Skeleton';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import type { AdminToolAction } from '../../../src/components/admin/AdminFloatingTools';
import PrintExamModal from '../../../src/components/PrintExamModal';

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
      if (selectedSubject) {
        const updatedSelection = list.find((subject) => subject.subjectID === selectedSubject.subjectID);
        setSelectedSubject(updatedSelection || null);
      }
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
    setSubjectCode((subject as any).subjectCode || '');
    setSubjectName(subject.subjectName || '');
    setProgramID(String((subject as any).programID || ''));
    setYearLevelID(String((subject as any).yearLevelID || ''));
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
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to save subject';
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
            await fetchSubjects();
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
    await fetchSubjects();
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
  ], [selectedSubject, router, openAddSubject, setShowPrintModal]);

  useScreenFloatingTools(fabActions);

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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
          <TouchableOpacity onPress={() => {
            if (selectedSubject) {
              setSelectedSubject(null);
              return;
            }
            if (router.canGoBack()) router.back(); else router.replace('/(auth)/(associate-dean)/dashboard' as any);
          }} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={24} className={isDark ? 'text-white' : 'text-gray-900'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubject?.subjectName || 'Subjects'}</Text>
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
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Subjects Yet</Text>
              </View>
            ) : (
              subjects.map(subject => (
                <TouchableOpacity
                  key={subject.subjectID}
                  onPress={() => setSelectedSubject(subject)}
                  className={`rounded-2xl p-4 mb-3 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{subject.subjectName}</Text>
                      {!!(subject as any).subjectCode && (
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{(subject as any).subjectCode}</Text>
                      )}
                    </View>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => openEditSubject(subject)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-orange-50'}`}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color="#FE6902" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSubject(subject)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-red-50'}`}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
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
    </View>
  );
}
