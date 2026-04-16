// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair "Program Subjects" screen — fetches all subjects in the
//          program, allows selection via horizontal tabs, and displays each
//          subject's questions with status badges. Supports adding new questions,
//          approving pending questions, deleting questions, and managing subjects
//          (add/edit/delete). Uses NativeWind for mobile-native styling.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, useWindowDimensions, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { Skeleton, SkeletonList } from '../../../src/components/Skeleton';

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
  const [activeTab, setActiveTab] = useState('practice');

  // Subject management modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchQuestions();
  }, [selectedSubject, activeTab]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/subjects');
      const list = Array.isArray(data?.subjects) ? data.subjects : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
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
      const allQuestions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const filteredQuestions = questions.filter((q: any) => {
    if (activeTab === 'pending') return q.status_id === 1 || q.status === 'pending';
    if (activeTab === 'practice') return (q.purpose_id === 2 || q.purpose === 'practice') && (q.status_id !== 1 && q.status !== 'pending');
    if (activeTab === 'exam') return (q.purpose_id === 1 || q.purpose === 'exam') && (q.status_id !== 1 && q.status !== 'pending');
    return true;
  });

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
    setShowSubjectModal(true);
  };

  const openEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setSubjectCode(subject.subjectCode || '');
    setSubjectName(subject.subjectName || subject.name || '');
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectCode.trim() || !subjectName.trim()) {
      showToast('Please fill in all fields', 'error');
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
            programID: editingSubject.programID,
            yearLevelID: editingSubject.yearLevelID,
          },
        });
        showToast('Subject updated', 'success');
      } else {
        await apiRequest('/api/add-subjects', {
          method: 'POST',
          body: {
            subjectCode: subjectCode.trim(),
            subjectName: subjectName.trim(),
            programID: '',
            yearLevelID: '',
          },
        });
        showToast('Subject added', 'success');
      }
      setShowSubjectModal(false);
      await fetchSubjects();
    } catch (error) {
      showToast('Failed to save subject', 'error');
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
              await fetchSubjects();
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
    await fetchSubjects();
    setIsRefreshing(false);
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <View className={`px-4 py-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center">
            <Skeleton variant="text" className="w-40 h-6" />
          </View>
        </View>
        <View className="px-4 py-4">
          <View className="flex-row mb-4">
            {[1, 2, 3, 4].map(i => (
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
            <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(program-chair)/dashboard' as any); }} className="p-2 -ml-2 mr-2">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Program Subjects</Text>
          </View>
          <TouchableOpacity
            onPress={openAddSubject}
            className="flex-row items-center bg-primary px-3 py-2 rounded-xl"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white font-semibold ml-1">Subject</Text>
          </TouchableOpacity>
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
                px-4 py-2 rounded-full mr-2 border flex-row items-center
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
              {selectedSubject?.subjectID === subject.subjectID && (
                <>
                  <TouchableOpacity
                    onPress={() => openEditSubject(subject)}
                    className="ml-2"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteSubject(subject)}
                    className="ml-1"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Question Tabs */}
        {selectedSubject && (
          <View className="px-4 mb-3">
            <View className={`flex-row rounded-xl p-1 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
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
        )}

        {/* Questions List */}
        {selectedSubject && (
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Questions ({filteredQuestions.length})
              </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/practice-exam/add-question', params: { subjectID: selectedSubject.subjectID } })}
                className="flex-row items-center bg-primary px-3 py-2 rounded-xl"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-semibold ml-1">Add</Text>
              </TouchableOpacity>
            </View>

            {filteredQuestions.length === 0 ? (
              <View className={`rounded-3xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Ionicons name="help-circle-outline" size={64} color="#FE6902" />
                <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Questions Yet</Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Start adding questions for this subject.
                </Text>
              </View>
            ) : (
              filteredQuestions.map((q, idx) => (
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

      {/* Add/Edit Subject Modal */}
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
              className={`border rounded-xl px-4 py-3 mb-6 ${isDark ? 'border-gray-700 text-white bg-gray-800' : 'border-gray-200 text-gray-900 bg-white'}`}
            />

            <TouchableOpacity
              onPress={handleSaveSubject}
              disabled={isSavingSubject}
              className={`rounded-xl py-4 items-center ${isSavingSubject ? 'opacity-60' : ''}`}
              style={{ backgroundColor: '#FE6902' }}
              activeOpacity={0.8}
            >
              {isSavingSubject ? (
                <ActivityIndicator color="#fff" />
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
