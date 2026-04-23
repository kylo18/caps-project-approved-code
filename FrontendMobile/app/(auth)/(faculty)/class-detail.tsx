import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import {
  archiveFacultyClass,
  assignQuizToClass,
  getAssignedClassQuizzes,
  getAvailableClassQuizzes,
  getClassStudents,
  getClassSubjects,
  removeStudentFromClass,
  unassignQuizFromClass,
  updateClassQuizDates,
  updateFacultyClass,
} from '../../../src/services/facultyClassService';

export default function FacultyClassDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { classID, className } = useLocalSearchParams();
  const resolvedClassID = String(classID || '');

  const [segment, setSegment] = useState<'students' | 'quizzes'>('students');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<any[]>([]);
  const [classLoadMessage, setClassLoadMessage] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedSubjectID, setSelectedSubjectID] = useState<number | null>(null);
  const [selectedAssignedQuiz, setSelectedAssignedQuiz] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);

  const [editForm, setEditForm] = useState({
    className: '',
    description: '',
    schedule: '',
    isActive: true,
  });
  const [assignDates, setAssignDates] = useState({ startDate: '', deadlineDate: '' });
  const [dateForm, setDateForm] = useState({ startDate: '', deadlineDate: '' });

  const loadStudents = useCallback(async () => {
    const data = await getClassStudents(resolvedClassID);
    setClassInfo(data.classInfo);
    setStudents(Array.isArray(data.students) ? data.students : []);
    setClassLoadMessage(data.emptyReason === 'class_not_found' ? data.message || 'Class not found.' : '');
  }, [resolvedClassID]);

  const loadAssignedQuizzes = useCallback(async () => {
    const list = await getAssignedClassQuizzes(resolvedClassID);
    setAssignedQuizzes(Array.isArray(list) ? list : []);
  }, [resolvedClassID]);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadStudents(), loadAssignedQuizzes()]);
    } catch (error) {
      console.error('Error loading class detail:', error);
      showToast('Unable to load class details', 'error');
      setStudents([]);
      setAssignedQuizzes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAssignedQuizzes, loadStudents]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!classInfo) return;
    setEditForm({
      className: classInfo.className || String(className || ''),
      description: classInfo.description || '',
      schedule: classInfo.schedule || '',
      isActive: classInfo.isActive !== false,
    });
    setSelectedSubjectID(classInfo.subjectID || classInfo.subject?.subjectID || null);
  }, [classInfo, className]);

  const filteredAvailableQuizzes = useMemo(() => {
    return availableQuizzes.filter((quiz) => {
      const id = quiz.personalQuizID || quiz.quizID || quiz.id;
      return id != null;
    });
  }, [availableQuizzes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
  };

  const openEditModal = async () => {
    try {
      const list = await getClassSubjects();
      setSubjects(Array.isArray(list) ? list : []);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading subjects for class edit:', error);
      showToast('Unable to load subjects', 'error');
    }
  };

  const openAssignQuizModal = async () => {
    try {
      const list = await getAvailableClassQuizzes(resolvedClassID);
      setAvailableQuizzes(Array.isArray(list) ? list : []);
      setSelectedQuiz(null);
      setAssignDates({ startDate: '', deadlineDate: '' });
      setShowAssignModal(true);
    } catch (error) {
      console.error('Error loading available quizzes:', error);
      showToast('Unable to load available quizzes', 'error');
    }
  };

  const handleSaveClass = async () => {
    if (!editForm.className.trim()) {
      showToast('Class name is required', 'error');
      return;
    }
    if (!selectedSubjectID) {
      showToast('Please select a subject', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateFacultyClass(resolvedClassID, {
        className: editForm.className.trim(),
        subjectID: Number(selectedSubjectID),
        description: editForm.description.trim() || null,
        schedule: editForm.schedule.trim() || null,
        isActive: editForm.isActive,
      });
      showToast('Class updated successfully', 'success');
      setShowEditModal(false);
      await loadAll();
    } catch (error) {
      console.error('Error updating class:', error);
      showToast('Failed to update class', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveClass = () => {
    Alert.alert(
      'Archive Class',
      `Are you sure you want to archive ${classInfo?.className || className || 'this class'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setIsArchiving(true);
            try {
              await archiveFacultyClass(resolvedClassID);
              showToast('Class archived successfully', 'success');
              router.back();
            } catch (error) {
              console.error('Error archiving class:', error);
              showToast('Failed to archive class', 'error');
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveStudent = (student: any) => {
    Alert.alert(
      'Remove Student',
      `Remove ${student.firstName || ''} ${student.lastName || ''} from this class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStudentFromClass(resolvedClassID, student.studentID || student.userID);
              showToast('Student removed from class', 'success');
              await loadStudents();
            } catch (error) {
              console.error('Error removing student:', error);
              showToast('Failed to remove student', 'error');
            }
          },
        },
      ]
    );
  };

  const handleAssignQuiz = async () => {
    const personalQuizID = selectedQuiz?.personalQuizID || selectedQuiz?.quizID || selectedQuiz?.id;
    if (!personalQuizID) {
      showToast('Please select a quiz', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      await assignQuizToClass({
        classID: resolvedClassID,
        personalQuizID,
        startDate: assignDates.startDate || null,
        deadlineDate: assignDates.deadlineDate || null,
      });
      showToast('Quiz assigned to class', 'success');
      setShowAssignModal(false);
      await loadAssignedQuizzes();
    } catch (error) {
      console.error('Error assigning quiz:', error);
      showToast('Failed to assign quiz', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenDatesModal = (quiz: any) => {
    setSelectedAssignedQuiz(quiz);
    setDateForm({
      startDate: (quiz.startTime || quiz.startDate || '').slice(0, 10),
      deadlineDate: (quiz.endTime || quiz.deadlineDate || '').slice(0, 10),
    });
    setShowDatesModal(true);
  };

  const handleSaveDates = async () => {
    if (!selectedAssignedQuiz?.classPersonalQuizID) return;
    setIsUpdatingDates(true);
    try {
      await updateClassQuizDates(selectedAssignedQuiz.classPersonalQuizID, {
        startTime: dateForm.startDate || undefined,
        endTime: dateForm.deadlineDate || undefined,
      });
      showToast('Quiz dates updated', 'success');
      setShowDatesModal(false);
      await loadAssignedQuizzes();
    } catch (error) {
      console.error('Error updating quiz dates:', error);
      showToast('Failed to update quiz dates', 'error');
    } finally {
      setIsUpdatingDates(false);
    }
  };

  const handleUnassignQuiz = (quiz: any) => {
    Alert.alert(
      'Unassign Quiz',
      `Remove ${quiz.quizName || quiz.personalQuiz?.title || 'this quiz'} from this class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              await unassignQuizFromClass(quiz.classPersonalQuizID);
              showToast('Quiz removed from class', 'success');
              await loadAssignedQuizzes();
            } catch (error) {
              console.error('Error unassigning quiz:', error);
              showToast('Failed to remove quiz', 'error');
            }
          },
        },
      ]
    );
  };

  const title = classInfo?.className || String(className || 'Class Detail');
  const subtitle = [classInfo?.subject?.subjectCode, classInfo?.subject?.subjectName].filter(Boolean).join(' · ');

  if (loading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`} style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center px-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Class Detail</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <CapsActivityIndicator size="large" color="#FE6902" />
          <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading class manager...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <View
        className={`px-4 pb-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-start">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#111827'} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
              <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {subtitle || classInfo?.schedule || 'Class manager'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center ml-3" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={openEditModal}
              disabled={!classInfo}
              className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              style={{ opacity: classInfo ? 1 : 0.5 }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#FE6902" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchiveClass}
              disabled={isArchiving || !classInfo}
              className={`px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              style={{ opacity: classInfo ? 1 : 0.5 }}
              activeOpacity={0.8}
            >
              <Ionicons name="archive-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-4">
          <HeaderPill icon="key-outline" text={classInfo?.classCode || 'No code'} isDark={isDark} />
          <HeaderPill icon="time-outline" text={classInfo?.schedule || 'No schedule'} isDark={isDark} />
          <HeaderPill icon="people-outline" text={`${students.length} students`} isDark={isDark} />
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className={`flex-row rounded-2xl p-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          {(['students', 'quizzes'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setSegment(item)}
              className={`flex-1 rounded-xl py-3 ${segment === item ? 'bg-primary' : 'bg-transparent'}`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-semibold ${segment === item ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item === 'students' ? 'Students' : 'Assigned Quizzes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
        showsVerticalScrollIndicator={false}
      >
        {classLoadMessage && !classInfo ? (
          <EmptyCard
            isDark={isDark}
            icon="alert-circle-outline"
            title="Class not found"
            message={classLoadMessage}
          />
        ) : null}
        {segment === 'students' ? (
          students.length === 0 ? (
            <EmptyCard
              isDark={isDark}
              icon="people-outline"
              title="No students enrolled"
              message="Students added to this class will appear here."
            />
          ) : (
            students.map((student, index) => (
              <View
                key={student.enrollmentID || student.studentID || student.userID || index}
                className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {student.firstName} {student.lastName}
                    </Text>
                    <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {student.userCode || 'No user code'}{student.program ? ` · ${student.program}` : ''}
                    </Text>
                    {student.email ? (
                      <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{student.email}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveStudent(student)}
                    className="px-3 py-2 rounded-xl bg-red-50"
                    activeOpacity={0.8}
                  >
                    <Text className="text-red-600 font-semibold">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          <>
            <TouchableOpacity
              onPress={openAssignQuizModal}
              className="bg-primary rounded-2xl py-4 items-center"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text className="text-white font-semibold text-base">Assign Quiz</Text>
              </View>
            </TouchableOpacity>

            {assignedQuizzes.length === 0 ? (
              <EmptyCard
                isDark={isDark}
                icon="clipboard-outline"
                title="No quizzes assigned"
                message="Use the button above to assign an available quiz to this class."
              />
            ) : (
              assignedQuizzes.map((quiz, index) => {
                const name = quiz.quizName || quiz.personalQuiz?.title || 'Untitled Quiz';
                const start = formatDate(quiz.startTime || quiz.startDate);
                const end = formatDate(quiz.endTime || quiz.deadlineDate);
                const accuracy = quiz.avgAccuracy ?? quiz.accuracy;

                return (
                  <View
                    key={quiz.classPersonalQuizID || `${name}-${index}`}
                    className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  >
                    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</Text>
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      <HeaderPill icon="calendar-outline" text={`Start: ${start}`} isDark={isDark} />
                      <HeaderPill icon="calendar-clear-outline" text={`End: ${end}`} isDark={isDark} />
                      {accuracy !== undefined ? (
                        <HeaderPill icon="stats-chart-outline" text={`${Number(accuracy).toFixed(1)}% accuracy`} isDark={isDark} />
                      ) : null}
                    </View>

                    <View className="flex-row gap-3 mt-4">
                      <TouchableOpacity
                        onPress={() => handleOpenDatesModal(quiz)}
                        className={`flex-1 rounded-xl py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                        activeOpacity={0.8}
                      >
                        <Text className={`text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dates</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleUnassignQuiz(quiz)}
                        className="flex-1 rounded-xl py-3 bg-red-50"
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-red-600">Unassign</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <EditClassModal
        isDark={isDark}
        visible={showEditModal}
        form={editForm}
        setForm={setEditForm}
        subjects={subjects}
        selectedSubjectID={selectedSubjectID}
        setSelectedSubjectID={setSelectedSubjectID}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveClass}
        loading={isSaving}
      />

      <AssignQuizModal
        isDark={isDark}
        visible={showAssignModal}
        quizzes={filteredAvailableQuizzes}
        selectedQuiz={selectedQuiz}
        setSelectedQuiz={setSelectedQuiz}
        dates={assignDates}
        setDates={setAssignDates}
        onClose={() => setShowAssignModal(false)}
        onSave={handleAssignQuiz}
        loading={isAssigning}
      />

      <QuizDatesModal
        isDark={isDark}
        visible={showDatesModal}
        title={selectedAssignedQuiz?.quizName || selectedAssignedQuiz?.personalQuiz?.title || 'Quiz Dates'}
        dates={dateForm}
        setDates={setDateForm}
        onClose={() => setShowDatesModal(false)}
        onSave={handleSaveDates}
        loading={isUpdatingDates}
      />
    </View>
  );
}

function HeaderPill({ icon, text, isDark }: { icon: keyof typeof Ionicons.glyphMap; text: string; isDark: boolean }) {
  return (
    <View
      className={`flex-row items-center px-3 py-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
      style={{ gap: 6 }}
    >
      <Ionicons name={icon} size={14} color="#FE6902" />
      <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</Text>
    </View>
  );
}

function EmptyCard({
  isDark,
  icon,
  title,
  message,
}: {
  isDark: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Ionicons name={icon} size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
      <Text className={`mt-3 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
      <Text className={`mt-2 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{message}</Text>
    </View>
  );
}

function EditClassModal({
  isDark,
  visible,
  form,
  setForm,
  subjects,
  selectedSubjectID,
  setSelectedSubjectID,
  onClose,
  onSave,
  loading,
}: any) {
  return (
    <BottomModal isDark={isDark} visible={visible} title="Edit Class" onClose={onClose}>
      <LabeledInput
        isDark={isDark}
        label="Class Name"
        value={form.className}
        onChangeText={(text) => setForm((prev: any) => ({ ...prev, className: text }))}
        placeholder="Enter class name"
      />
      <LabeledInput
        isDark={isDark}
        label="Schedule"
        value={form.schedule}
        onChangeText={(text) => setForm((prev: any) => ({ ...prev, schedule: text }))}
        placeholder="e.g. Mon/Wed 8:00 - 10:00"
      />
      <LabeledInput
        isDark={isDark}
        label="Description"
        value={form.description}
        onChangeText={(text) => setForm((prev: any) => ({ ...prev, description: text }))}
        placeholder="Optional class description"
        multiline
      />

      <Text className={`mt-4 mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subject</Text>
      <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          {subjects.map((subject: any) => {
            const subjectID = subject.subjectID || subject.id;
            const selected = selectedSubjectID === subjectID;
            return (
              <TouchableOpacity
                key={subjectID}
                onPress={() => setSelectedSubjectID(subjectID)}
                className={`rounded-xl px-4 py-3 border ${selected ? 'border-primary bg-orange-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`font-semibold ${selected ? 'text-primary' : isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? (
                  <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{subject.subjectCode}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        className="bg-primary rounded-2xl py-4 items-center mt-5"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <CapsActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save Class</Text>}
      </TouchableOpacity>
    </BottomModal>
  );
}

function AssignQuizModal({
  isDark,
  visible,
  quizzes,
  selectedQuiz,
  setSelectedQuiz,
  dates,
  setDates,
  onClose,
  onSave,
  loading,
}: any) {
  return (
    <BottomModal isDark={isDark} visible={visible} title="Assign Quiz" onClose={onClose}>
      <LabeledInput
        isDark={isDark}
        label="Start Date"
        value={dates.startDate}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, startDate: text }))}
        placeholder="YYYY-MM-DD"
      />
      <LabeledInput
        isDark={isDark}
        label="Deadline"
        value={dates.deadlineDate}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, deadlineDate: text }))}
        placeholder="YYYY-MM-DD"
      />

      <Text className={`mt-4 mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Available Quizzes</Text>
      <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          {quizzes.length === 0 ? (
            <View className={`rounded-xl px-4 py-5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No available quizzes for this class.</Text>
            </View>
          ) : (
            quizzes.map((quiz: any) => {
              const quizID = quiz.personalQuizID || quiz.quizID || quiz.id;
              const selected = (selectedQuiz?.personalQuizID || selectedQuiz?.quizID || selectedQuiz?.id) === quizID;
              return (
                <TouchableOpacity
                  key={quizID}
                  onPress={() => setSelectedQuiz(selected ? null : quiz)}
                  className={`rounded-xl px-4 py-3 border ${selected ? 'border-primary bg-orange-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                >
                  <Text className={`font-semibold ${selected ? 'text-primary' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {quiz.title || quiz.quizName || 'Untitled Quiz'}
                  </Text>
                  {quiz.subject?.subjectCode ? (
                    <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{quiz.subject.subjectCode}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        className="bg-primary rounded-2xl py-4 items-center mt-5"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <CapsActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Assign Quiz</Text>}
      </TouchableOpacity>
    </BottomModal>
  );
}

function QuizDatesModal({ isDark, visible, title, dates, setDates, onClose, onSave, loading }: any) {
  return (
    <BottomModal isDark={isDark} visible={visible} title={title} onClose={onClose}>
      <LabeledInput
        isDark={isDark}
        label="Start Date"
        value={dates.startDate}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, startDate: text }))}
        placeholder="YYYY-MM-DD"
      />
      <LabeledInput
        isDark={isDark}
        label="End Date"
        value={dates.deadlineDate}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, deadlineDate: text }))}
        placeholder="YYYY-MM-DD"
      />

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        className="bg-primary rounded-2xl py-4 items-center mt-5"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <CapsActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save Dates</Text>}
      </TouchableOpacity>
    </BottomModal>
  );
}

function BottomModal({
  isDark,
  visible,
  title,
  onClose,
  children,
}: {
  isDark: boolean;
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View className={`rounded-t-3xl px-5 pt-5 pb-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function LabeledInput({
  isDark,
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        multiline={multiline}
        className={`${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border rounded-2xl px-4 py-3`}
        style={multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
