import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardTypeOptions, Modal, RefreshControl, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { showToast } from '../../../hooks/useToast';
import { getRoleShadow, getRoleThemeColors } from '../../core/styles/roleTheme';
import DatePickerInput from '../components/DatePickerInput';
import SchedulePickerInput from '../components/SchedulePickerInput';
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
  createFacultyClass,
  getPersonalQuizQuestions,
  getClassQuizResults,
  getQuizResultsForQuiz,
  getQuizNonTakers,
  getClassQuizSettings,
  createClassQuizSettings,
  getPersonalQuizLeaderboard,
  getPersonalQuizRecentTakers,
} from '../../../services/facultyClassService';

export default function ClassDetailScreen({ rolePath = "/(dean)" }: { rolePath?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);
  const cardStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...getRoleShadow(isDark),
  };
  const { classID, className, origin } = useLocalSearchParams();
  const resolvedClassID = String(classID || '');

  const handleBack = () => {
    if (origin === 'classes') {
      router.replace(`/(auth)${rolePath}/classes` as string);
    } else {
      router.back();
    }
  };

  const [segment, setSegment] = useState<'students' | 'quizzes' | 'results'>('students');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<any[]>([]);
  const [classLoadMessage, setClassLoadMessage] = useState('');

  // Results & Leaderboard state
  const [classQuizResults, setClassQuizResults] = useState<any[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showNonTakersModal, setShowNonTakersModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedResultsQuiz, setSelectedResultsQuiz] = useState<any>(null);
  const [quizStudentResults, setQuizStudentResults] = useState<any[]>([]);
  const [quizNonTakers, setQuizNonTakers] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [recentTakers, setRecentTakers] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedPreviewQuizID, setSelectedPreviewQuizID] = useState<number | string | null>(null);
  const [selectedPreviewQuizName, setSelectedPreviewQuizName] = useState<string>('');

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
  const [assignDates, setAssignDates] = useState({
    startDate: '',
    deadlineDate: '',
    quizAttempts: '',
    quizTimerEnabled: false,
    quizTimer: ''
  });
  const [dateForm, setDateForm] = useState({ startDate: '', deadlineDate: '', quizAttempts: '', quizTimerEnabled: false, quizTimer: '' });

  const loadStudents = useCallback(async () => {
    if (!resolvedClassID) {
      setClassInfo(null);
      setStudents([]);
      return;
    }
    const data = await getClassStudents(resolvedClassID);
    setClassInfo(data.classInfo);
    setStudents(Array.isArray(data.students) ? data.students : []);
    setClassLoadMessage(data.emptyReason === 'class_not_found' ? data.message || 'Class not found.' : '');
  }, [resolvedClassID]);

  const loadAssignedQuizzes = useCallback(async () => {
    if (!resolvedClassID) {
      setAssignedQuizzes([]);
      return;
    }
    const list = await getAssignedClassQuizzes(resolvedClassID);
    setAssignedQuizzes(Array.isArray(list) ? list : []);
  }, [resolvedClassID]);

  const loadClassQuizResults = useCallback(async () => {
    if (!resolvedClassID) {
      setClassQuizResults([]);
      return;
    }
    setLoadingResults(true);
    try {
      const results = await getClassQuizResults(resolvedClassID);
      setClassQuizResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error loading class quiz results:', error);
    } finally {
      setLoadingResults(false);
    }
  }, [resolvedClassID]);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadStudents(), loadAssignedQuizzes(), loadClassQuizResults()]);
    } catch (error) {
      console.error('Error loading class detail:', error);
      showToast('Unable to load class details', 'error');
      setStudents([]);
      setAssignedQuizzes([]);
      setClassQuizResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAssignedQuizzes, loadStudents, loadClassQuizResults]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30_000);
    return () => clearInterval(interval);
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

  useEffect(() => {
    if (!resolvedClassID && !loading) {
      // Add a tiny delay to ensure the screen has fully rendered before opening the modal
      const timer = setTimeout(() => {
        openEditModal();
      }, 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClassID, loading]);

  const openAssignQuizModal = async () => {
    if (!resolvedClassID) {
      showToast('Please save the class first before assigning quizzes.', 'error');
      return;
    }
    try {
      const list = await getAvailableClassQuizzes(resolvedClassID);
      setAvailableQuizzes(Array.isArray(list) ? list : []);
      setSelectedQuiz(null);
      setAssignDates({
        startDate: '',
        deadlineDate: '',
        quizAttempts: '',
        quizTimerEnabled: false,
        quizTimer: ''
      });
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
      const payload = {
        className: editForm.className.trim(),
        subjectID: Number(selectedSubjectID),
        description: editForm.description.trim() || null,
        schedule: editForm.schedule.trim() || null,
        isActive: editForm.isActive,
      };

      if (resolvedClassID) {
        await updateFacultyClass(resolvedClassID, payload);
        showToast('Class updated successfully', 'success');
        setShowEditModal(false);
        await loadAll();
      } else {
        await createFacultyClass(payload);
        showToast('Class created successfully', 'success');
        setShowEditModal(false);
        if (origin === 'classes') {
          router.replace(`/(auth)${rolePath}/classes` as string);
        } else {
          router.back();
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      showToast('Failed to save class', 'error');
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

    const attemptsNum = assignDates.quizAttempts?.trim()
      ? parseInt(assignDates.quizAttempts, 10)
      : null;

    if (attemptsNum !== null && (isNaN(attemptsNum) || attemptsNum < 1)) {
      showToast('Attempts limit must be a number greater than or equal to 1', 'error');
      return;
    }

    const timerVal = assignDates.quizTimerEnabled && assignDates.quizTimer?.trim()
      ? parseInt(assignDates.quizTimer, 10)
      : null;

    if (assignDates.quizTimerEnabled && (timerVal === null || isNaN(timerVal) || timerVal < 1)) {
      showToast('Timer duration must be a number of minutes greater than or equal to 1', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await assignQuizToClass({
        classID: resolvedClassID,
        personalQuizID,
        startDate: assignDates.startDate || null,
        deadlineDate: assignDates.deadlineDate || null,
      });

      const classPersonalQuizID = res?.classPersonalQuiz?.classPersonalQuizID || res?.classPersonalQuizID || res?.id;
      if (classPersonalQuizID) {
        if (attemptsNum !== null || assignDates.quizTimerEnabled) {
          try {
            await createClassQuizSettings(classPersonalQuizID, {
              startTime: assignDates.startDate || null,
              endTime: assignDates.deadlineDate || null,
              quizAttempts: attemptsNum,
              quizTimerEnabled: assignDates.quizTimerEnabled,
              quizTimer: timerVal,
            });
          } catch (settingsError) {
            console.error('Error creating quiz settings on assign:', settingsError);
          }
        }
      }

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

  const handleOpenQuestionsModal = (quiz: any) => {
    const quizID = quiz.personalQuizID || quiz.personalQuiz?.personalQuizID;
    if (!quizID) {
      showToast('Quiz ID not found', 'error');
      return;
    }
    setSelectedPreviewQuizID(quizID);
    setSelectedPreviewQuizName(quiz.quizName || quiz.personalQuiz?.title || 'Quiz Preview');
    setShowQuestionsModal(true);
  };

  const handleOpenDatesModal = async (quiz: any) => {
    setSelectedAssignedQuiz(quiz);
    setDateForm({
      startDate: (quiz.startTime || quiz.startDate || '').slice(0, 10),
      deadlineDate: (quiz.endTime || quiz.deadlineDate || '').slice(0, 10),
      quizAttempts: quiz.maxAttempts ? String(quiz.maxAttempts) : '',
      quizTimerEnabled: quiz.durationMinutes ? true : false,
      quizTimer: quiz.durationMinutes ? String(quiz.durationMinutes) : '',
    });
    setShowDatesModal(true);

    const quizID = quiz.classPersonalQuizID || quiz.id;
    if (quizID) {
      try {
        const res = await getClassQuizSettings(quizID);
        const settings = res?.setting || res;
        if (settings) {
          setDateForm(prev => ({
            ...prev,
            startDate: (settings.startTime || settings.startDate || prev.startDate || '').slice(0, 10),
            deadlineDate: (settings.endTime || settings.deadlineDate || prev.deadlineDate || '').slice(0, 10),
            quizAttempts: settings.quizAttempts || settings.maxAttempts ? String(settings.quizAttempts || settings.maxAttempts) : prev.quizAttempts,
            quizTimerEnabled: settings.quizTimerEnabled !== undefined ? !!settings.quizTimerEnabled : prev.quizTimerEnabled,
            quizTimer: settings.quizTimer ? String(settings.quizTimer) : prev.quizTimer,
          }));
        }
      } catch (err) {
        console.log('Class quiz settings fetch fallback:', err);
      }
    }
  };

  const handleOpenQuizResults = async (quiz: any) => {
    setSelectedResultsQuiz(quiz);
    setQuizStudentResults([]);
    setShowResultsModal(true);
    const quizID = quiz.classPersonalQuizID || quiz.id || quiz.personalQuizID;
    if (quizID) {
      try {
        const results = await getQuizResultsForQuiz(quizID);
        setQuizStudentResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error loading quiz results:', error);
        showToast('Unable to load student scores', 'error');
      }
    }
  };

  const handleOpenNonTakers = async (quiz: any) => {
    setSelectedResultsQuiz(quiz);
    setQuizNonTakers([]);
    setShowNonTakersModal(true);
    const quizID = quiz.classPersonalQuizID || quiz.id || quiz.personalQuizID;
    if (quizID) {
      try {
        const nonTakers = await getQuizNonTakers(quizID);
        setQuizNonTakers(Array.isArray(nonTakers) ? nonTakers : []);
      } catch (error) {
        console.error('Error loading non-takers:', error);
        showToast('Unable to load non-takers', 'error');
      }
    }
  };

  const handleOpenLeaderboard = async (quiz: any) => {
    setSelectedResultsQuiz(quiz);
    setLeaderboardData([]);
    setRecentTakers([]);
    setShowLeaderboardModal(true);
    setLoadingLeaderboard(true);
    const quizID = quiz.quiz?.personalQuizID || quiz.personalQuiz?.personalQuizID || quiz.personalQuizID || quiz.id;
    if (quizID) {
      try {
        const [leaderboard, recent] = await Promise.all([
          getPersonalQuizLeaderboard(quizID),
          getPersonalQuizRecentTakers(quizID)
        ]);
        setLeaderboardData(Array.isArray(leaderboard) ? leaderboard : []);
        setRecentTakers(Array.isArray(recent) ? recent : []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        showToast('Unable to load leaderboard data', 'error');
      } finally {
        setLoadingLeaderboard(false);
      }
    }
  };

  const handleSaveDates = async () => {
    if (!selectedAssignedQuiz?.classPersonalQuizID) return;
    setIsUpdatingDates(true);
    try {
      const attemptsNum = dateForm.quizAttempts?.trim()
        ? parseInt(dateForm.quizAttempts, 10)
        : null;

      if (attemptsNum !== null && (isNaN(attemptsNum) || attemptsNum < 1)) {
        showToast('Attempts limit must be a number greater than or equal to 1', 'error');
        setIsUpdatingDates(false);
        return;
      }

      const timerVal = dateForm.quizTimerEnabled && dateForm.quizTimer?.trim()
        ? parseInt(dateForm.quizTimer, 10)
        : null;

      if (dateForm.quizTimerEnabled && (timerVal === null || isNaN(timerVal) || timerVal < 1)) {
        showToast('Timer duration must be a number of minutes greater than or equal to 1', 'error');
        setIsUpdatingDates(false);
        return;
      }

      await updateClassQuizDates(selectedAssignedQuiz.classPersonalQuizID, {
        startTime: dateForm.startDate || null,
        endTime: dateForm.deadlineDate || null,
        quizAttempts: attemptsNum,
        quizTimerEnabled: dateForm.quizTimerEnabled,
        quizTimer: timerVal,
      } as any);
      showToast('Quiz settings updated', 'success');
      setShowDatesModal(false);
      await loadAssignedQuizzes();
    } catch (error) {
      console.error('Error updating quiz settings:', error);
      showToast('Failed to update quiz settings', 'error');
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
      <View className="flex-1" style={{ backgroundColor: colors.page, paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center px-4 pb-4">
          <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>Class Detail</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <CapsActivityIndicator size="large" color={colors.accent} />
          <Text className="mt-3" style={{ color: colors.muted }}>Loading class manager...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <View
        className="px-4 pb-4 border-b"
        style={{ paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-start">
            <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 mr-2">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>{title}</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                {subtitle || classInfo?.schedule || 'Class manager'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center ml-3" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={openEditModal}
              disabled={!classInfo && !!resolvedClassID}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: colors.surfaceSoft, opacity: (!classInfo && !!resolvedClassID) ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#FE6902" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchiveClass}
              disabled={isArchiving || !classInfo}
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: colors.surfaceSoft, opacity: classInfo ? 1 : 0.5 }}
              activeOpacity={0.8}
            >
              <Ionicons name="archive-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-4">
          {/* Copyable class code */}
          <TouchableOpacity
            onPress={async () => {
              const code = classInfo?.classCode;
              if (code) {
                await Clipboard.setStringAsync(code);
                showToast(`Code "${code}" copied!`, 'success');
              }
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              gap: 6,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Ionicons name="key-outline" size={14} color={colors.accent} />
            <Text style={{ fontSize: 12, color: colors.text }}>{classInfo?.classCode || 'No code'}</Text>
            <Ionicons name="copy-outline" size={13} color={colors.muted} />
          </TouchableOpacity>
          <HeaderPill icon="time-outline" text={classInfo?.schedule || 'No schedule'} colors={colors} />
          <HeaderPill icon="people-outline" text={`${students.length} students`} colors={colors} />
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row rounded-2xl p-1" style={cardStyle}>
          {(['students', 'quizzes', 'results'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setSegment(item)}
              className={`flex-1 rounded-xl py-3 ${segment === item ? 'bg-primary' : 'bg-transparent'}`}
              activeOpacity={0.8}
            >
              <Text className="text-center font-semibold text-xs" style={{ color: segment === item ? '#FFFFFF' : colors.muted }}>
                {item === 'students' ? 'Students' : item === 'quizzes' ? 'Quizzes' : 'Results'}
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
            colors={colors}
            cardStyle={cardStyle}
            icon="alert-circle-outline"
            title="Class not found"
            message={classLoadMessage}
          />
        ) : null}
        {segment === 'students' ? (
          students.length === 0 ? (
            <EmptyCard
              colors={colors}
              cardStyle={cardStyle}
              icon="people-outline"
              title="No students enrolled"
              message="Students added to this class will appear here."
            />
          ) : (
            students.map((student, index) => (
              <View
                key={student.enrollmentID || student.studentID || student.userID || index}
                className="rounded-2xl p-4"
                style={cardStyle}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {student.firstName} {student.lastName}
                    </Text>
                    <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                      {student.userCode || 'No user code'}{student.program ? ` · ${student.program}` : ''}
                    </Text>
                    {student.email ? (
                      <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{student.email}</Text>
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
        ) : segment === 'quizzes' ? (
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
                colors={colors}
                cardStyle={cardStyle}
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
                    className="rounded-2xl p-4"
                    style={cardStyle}
                  >
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>{name}</Text>
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      <HeaderPill icon="calendar-outline" text={`Start: ${start}`} colors={colors} />
                      <HeaderPill icon="calendar-clear-outline" text={`End: ${end}`} colors={colors} />
                      <HeaderPill
                        icon="repeat-outline"
                        text={quiz.maxAttempts ? `${quiz.maxAttempts} attempt${quiz.maxAttempts !== 1 ? 's' : ''}` : 'Unlimited attempts'}
                        colors={colors}
                      />
                      {accuracy !== undefined ? (
                        <HeaderPill icon="stats-chart-outline" text={`${Number(accuracy).toFixed(1)}% accuracy`} colors={colors} />
                      ) : null}
                    </View>

                    <View className="flex-row flex-wrap gap-2 mt-4">
                      <TouchableOpacity
                        onPress={() => handleOpenQuestionsModal(quiz)}
                        className="flex-1 min-w-[120px] rounded-xl py-2.5 border"
                        style={{ borderColor: colors.accent, backgroundColor: 'transparent' }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.accent }}>View Questions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleOpenLeaderboard(quiz)}
                        className="flex-1 min-w-[120px] rounded-xl py-2.5 border"
                        style={{ borderColor: colors.accent, backgroundColor: 'transparent' }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.accent }}>Leaderboard</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleOpenDatesModal(quiz)}
                        className="flex-1 min-w-[80px] rounded-xl py-2.5"
                        style={{ backgroundColor: colors.surfaceSoft }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.text }}>Settings</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleUnassignQuiz(quiz)}
                        className="flex-1 min-w-[80px] rounded-xl py-2.5 bg-red-50"
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px] text-red-600">Unassign</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            {loadingResults ? (
              <View className="py-8 items-center justify-center">
                <CapsActivityIndicator size="small" color={colors.accent} />
                <Text className="mt-2 text-xs" style={{ color: colors.muted }}>Loading quiz results...</Text>
              </View>
            ) : classQuizResults.length === 0 ? (
              <EmptyCard
                colors={colors}
                cardStyle={cardStyle}
                icon="bar-chart-outline"
                title="No results available"
                message="Students' scores will appear here after they attempt the assigned quizzes."
              />
            ) : (
              classQuizResults.map((quiz, index) => {
                const name = quiz.quiz?.title || quiz.quizName || quiz.personalQuiz?.title || quiz.title || 'Untitled Quiz';
                const takers = quiz.totalStudents ?? quiz.takersCount ?? quiz.takers_count ?? 0;
                const totalStudents = students.length;
                const avgAccuracy = quiz.avgAccuracy ?? quiz.averageAccuracy ?? quiz.average_accuracy ?? quiz.accuracy ?? (
                  quiz.students && quiz.students.length > 0
                    ? quiz.students.reduce((acc: number, s: any) => acc + (s.highestAttempt?.percentage ?? 0), 0) / quiz.students.length
                    : 0
                );

                // Color-coded badge for average accuracy
                const accuracyColor = avgAccuracy >= 70 ? '#10B981' : avgAccuracy >= 50 ? '#F59E0B' : '#EF4444';
                const accuracyBg = avgAccuracy >= 70 ? (isDark ? '#064e3b30' : '#ecfdf5') : avgAccuracy >= 50 ? (isDark ? '#78350f30' : '#fffbeb') : (isDark ? '#7f1d1d30' : '#fef2f2');

                return (
                  <View
                    key={quiz.classPersonalQuizID || `${name}-${index}`}
                    className="rounded-2xl p-4"
                    style={cardStyle}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-2">
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>{name}</Text>
                        <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                          {takers} / {totalStudents} student{totalStudents !== 1 ? 's' : ''} attempted
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: accuracyBg }}>
                        <Text className="text-[11px] font-bold" style={{ color: accuracyColor }}>
                          {Number(avgAccuracy).toFixed(1)}% avg
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2 mt-4">
                      <TouchableOpacity
                        onPress={() => handleOpenQuizResults(quiz)}
                        className="flex-1 min-w-[100px] rounded-xl py-2"
                        style={{ backgroundColor: colors.surfaceSoft }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.text }}>View Scores</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleOpenNonTakers(quiz)}
                        className="flex-1 min-w-[100px] rounded-xl py-2"
                        style={{ backgroundColor: colors.surfaceSoft }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.text }}>Non-Takers</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleOpenLeaderboard(quiz)}
                        className="flex-1 min-w-[100px] rounded-xl py-2 border"
                        style={{ borderColor: colors.accent, backgroundColor: 'transparent' }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-center font-semibold text-[11px]" style={{ color: colors.accent }}>Leaderboard</Text>
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
        colors={colors}
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
        colors={colors}
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

      <QuizSettingsModal
        isDark={isDark}
        colors={colors}
        visible={showDatesModal}
        title={selectedAssignedQuiz?.quizName || selectedAssignedQuiz?.personalQuiz?.title || 'Quiz Settings'}
        dates={dateForm}
        setDates={setDateForm}
        onClose={() => setShowDatesModal(false)}
        onSave={handleSaveDates}
        loading={isUpdatingDates}
      />

      <ViewQuestionsModal
        isDark={isDark}
        colors={colors}
        visible={showQuestionsModal}
        title={selectedPreviewQuizName}
        personalQuizID={selectedPreviewQuizID}
        onClose={() => {
          setShowQuestionsModal(false);
          setSelectedPreviewQuizID(null);
        }}
      />

      <QuizResultsModal
        isDark={isDark}
        colors={colors}
        visible={showResultsModal}
        title={selectedResultsQuiz?.quizName || selectedResultsQuiz?.title || 'Quiz Results'}
        results={quizStudentResults}
        onClose={() => setShowResultsModal(false)}
      />

      <NonTakersModal
        isDark={isDark}
        colors={colors}
        visible={showNonTakersModal}
        title={selectedResultsQuiz?.quizName || selectedResultsQuiz?.title || 'Quiz Non-Takers'}
        students={quizNonTakers}
        onClose={() => setShowNonTakersModal(false)}
      />

      <LeaderboardModal
        isDark={isDark}
        colors={colors}
        visible={showLeaderboardModal}
        title={selectedResultsQuiz?.quizName || selectedResultsQuiz?.title || 'Quiz'}
        leaderboard={leaderboardData}
        recent={recentTakers}
        loading={loadingLeaderboard}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </View>
  );
}

function HeaderPill({ icon, text, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; colors: ReturnType<typeof getRoleThemeColors> }) {
  return (
    <View
      className="flex-row items-center px-3 py-2 rounded-full"
      style={{ backgroundColor: colors.surfaceSoft, gap: 6 }}
    >
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text className="text-xs" style={{ color: colors.text }}>{text}</Text>
    </View>
  );
}

function EmptyCard({
  colors,
  cardStyle,
  icon,
  title,
  message,
}: {
  colors: ReturnType<typeof getRoleThemeColors>;
  cardStyle: object;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View className="rounded-2xl p-8 items-center" style={cardStyle}>
      <Ionicons name={icon} size={48} color={colors.mutedIcon} />
      <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>{title}</Text>
      <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>{message}</Text>
    </View>
  );
}

function EditClassModal({
  isDark,
  colors,
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
    <BottomModal isDark={isDark} colors={colors} visible={visible} title="Edit Class" onClose={onClose}>
      <LabeledInput
        isDark={isDark}
        colors={colors}
        label="Class Name"
        value={form.className}
        onChangeText={(text) => setForm((prev: any) => ({ ...prev, className: text }))}
        placeholder="Enter class name"
      />
      <SchedulePickerInput
        isDark={isDark}
        colors={colors}
        label="Schedule"
        value={form.schedule}
        onChange={(text) => setForm((prev: any) => ({ ...prev, schedule: text }))}
        placeholder="Select class schedule"
      />
      <LabeledInput
        isDark={isDark}
        colors={colors}
        label="Description"
        value={form.description}
        onChangeText={(text) => setForm((prev: any) => ({ ...prev, description: text }))}
        placeholder="Optional class description"
        multiline
      />

      <Text className="mt-4 mb-2 font-semibold" style={{ color: colors.text }}>Subject</Text>
      <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          {subjects.map((subject: any) => {
            const subjectID = subject.subjectID || subject.id;
            const selected = selectedSubjectID === subjectID;
            return (
              <TouchableOpacity
                key={subjectID}
                onPress={() => setSelectedSubjectID(subjectID)}
                className="rounded-xl px-4 py-3 border"
                style={{ borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}18` : colors.input }}
              >
                <Text className="font-semibold" style={{ color: selected ? colors.accent : colors.text }}>
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? (
                  <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{subject.subjectCode}</Text>
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
  colors,
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
    <BottomModal isDark={isDark} colors={colors} visible={visible} title="Assign Quiz" onClose={onClose}>
      <DatePickerInput
        isDark={isDark}
        colors={colors}
        label="Start Date"
        value={dates.startDate}
        onChange={(text) => setDates((prev: any) => ({ ...prev, startDate: text }))}
        placeholder="Select start date"
      />
      <DatePickerInput
        isDark={isDark}
        colors={colors}
        label="Deadline"
        value={dates.deadlineDate}
        onChange={(text) => setDates((prev: any) => ({ ...prev, deadlineDate: text }))}
        placeholder="Select deadline date"
      />

      <LabeledInput
        isDark={isDark}
        colors={colors}
        label="Attempts Limit"
        value={dates.quizAttempts}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, quizAttempts: text }))}
        placeholder="e.g. 3 (leave blank for unlimited)"
        keyboardType="numeric"
      />

      <View className="flex-row items-center justify-between mt-4 mb-2">
        <Text className="font-semibold text-[15px]" style={{ color: colors.text }}>Enable Time Limit</Text>
        <Switch
          value={dates.quizTimerEnabled}
          onValueChange={(val) => setDates((prev: any) => ({ ...prev, quizTimerEnabled: val }))}
          trackColor={{ false: '#767577', true: '#FE6902' }}
          thumbColor={dates.quizTimerEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      {dates.quizTimerEnabled && (
        <LabeledInput
          isDark={isDark}
          colors={colors}
          label="Time Limit (minutes)"
          value={dates.quizTimer || ''}
          onChangeText={(text) => setDates((prev: any) => ({ ...prev, quizTimer: text }))}
          placeholder="e.g. 60"
          keyboardType="numeric"
        />
      )}

      <Text className="mt-4 mb-2 font-semibold" style={{ color: colors.text }}>Available Quizzes</Text>
      <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          {quizzes.length === 0 ? (
            <View className="rounded-xl px-4 py-5" style={{ backgroundColor: colors.surfaceSoft }}>
              <Text className="text-center" style={{ color: colors.muted }}>No available quizzes for this class.</Text>
            </View>
          ) : (
            quizzes.map((quiz: any) => {
              const quizID = quiz.personalQuizID || quiz.quizID || quiz.id;
              const selected = (selectedQuiz?.personalQuizID || selectedQuiz?.quizID || selectedQuiz?.id) === quizID;
              return (
                <TouchableOpacity
                  key={quizID}
                  onPress={() => setSelectedQuiz(selected ? null : quiz)}
                  className="rounded-xl px-4 py-3 border"
                  style={{ borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}18` : colors.input }}
                >
                  <Text className="font-semibold" style={{ color: selected ? colors.accent : colors.text }}>
                    {quiz.title || quiz.quizName || 'Untitled Quiz'}
                  </Text>
                  {quiz.subject?.subjectCode ? (
                    <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{quiz.subject.subjectCode}</Text>
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

function QuizSettingsModal({ isDark, colors, visible, title, dates, setDates, onClose, onSave, loading }: any) {
  return (
    <BottomModal isDark={isDark} colors={colors} visible={visible} title={title} onClose={onClose}>
      <DatePickerInput
        isDark={isDark}
        colors={colors}
        label="Start Date"
        value={dates.startDate}
        onChange={(text) => setDates((prev: any) => ({ ...prev, startDate: text }))}
        placeholder="Select start date"
      />
      <DatePickerInput
        isDark={isDark}
        colors={colors}
        label="End Date"
        value={dates.deadlineDate}
        onChange={(text) => setDates((prev: any) => ({ ...prev, deadlineDate: text }))}
        placeholder="Select end date"
      />
      <LabeledInput
        isDark={isDark}
        colors={colors}
        label="Attempts Limit"
        value={dates.quizAttempts}
        onChangeText={(text) => setDates((prev: any) => ({ ...prev, quizAttempts: text }))}
        placeholder="e.g. 3 (leave blank for unlimited)"
        keyboardType="numeric"
      />

      <View className="flex-row items-center justify-between mt-4 mb-2">
        <Text className="font-semibold text-[15px]" style={{ color: colors.text }}>Enable Time Limit</Text>
        <Switch
          value={dates.quizTimerEnabled}
          onValueChange={(val) => setDates((prev: any) => ({ ...prev, quizTimerEnabled: val }))}
          trackColor={{ false: '#767577', true: '#FE6902' }}
          thumbColor={dates.quizTimerEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      {dates.quizTimerEnabled && (
        <LabeledInput
          isDark={isDark}
          colors={colors}
          label="Time Limit (minutes)"
          value={dates.quizTimer || ''}
          onChangeText={(text) => setDates((prev: any) => ({ ...prev, quizTimer: text }))}
          placeholder="e.g. 60"
          keyboardType="numeric"
        />
      )}

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        className="bg-primary rounded-2xl py-4 items-center mt-5"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <CapsActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save Settings</Text>}
      </TouchableOpacity>
    </BottomModal>
  );
}

function BottomModal({
  isDark,
  colors,
  visible,
  title,
  onClose,
  children,
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View className="rounded-t-3xl px-5 pt-5 pb-8" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.muted} />
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
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text className="mb-2 font-semibold" style={{ color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedIcon}
        multiline={multiline}
        keyboardType={keyboardType}
        className="border rounded-2xl px-4 py-3"
        style={[
          { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          multiline ? { minHeight: 90, textAlignVertical: 'top' } : null,
        ]}
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

function ViewQuestionsModal({
  isDark,
  colors,
  visible,
  title,
  personalQuizID,
  onClose,
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  visible: boolean;
  title: string;
  personalQuizID: number | string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (visible && personalQuizID) {
      loadQuestions();
    } else {
      setQuestions([]);
      setTotal(0);
    }
  }, [visible, personalQuizID]);

  async function loadQuestions() {
    setLoading(true);
    try {
      const data = await getPersonalQuizQuestions(personalQuizID!);
      setQuestions(data.questions);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading quiz questions preview:', error);
      showToast('Unable to load quiz questions', 'error');
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: '80%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {title}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                {loading ? 'Loading questions...' : `${total} question${total !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 999, backgroundColor: colors.surfaceSoft }}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <CapsActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : questions.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons name="document-text-outline" size={48} color={colors.mutedIcon} />
              <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>No questions</Text>
              <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>This quiz doesn't have any questions yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={{ gap: 16 }}>
                {questions.map((question: any, qIdx: number) => {
                  const qText = question.questionText || question.personalQuizQuestionText || '';
                  const choices = question.choices || question.personalQuizChoices || [];
                  const points = question.score || 1;

                  return (
                    <View
                      key={question.personalQuizQuestionID || qIdx}
                      className="rounded-2xl p-4 border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceSoft,
                      }}
                    >
                      {/* Header row with Q index and points */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="px-2 py-0.5 rounded" style={{ backgroundColor: `${colors.accent}15` }}>
                          <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                            QUESTION {qIdx + 1}
                          </Text>
                        </View>
                        <Text className="text-xs" style={{ color: colors.muted }}>
                          {points} pt{points !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {/* Question Image if any */}
                      {question.image ? (
                        <Image
                          source={{ uri: question.image }}
                          className="w-full h-40 rounded-xl mb-3"
                          style={{ resizeMode: 'cover' }}
                        />
                      ) : null}

                      {/* Question Text */}
                      <Text
                        className="text-[15px] leading-5 font-semibold mb-3"
                        style={{ color: colors.text }}
                      >
                        {stripHtml(qText)}
                      </Text>

                      {/* Choices */}
                      <View style={{ gap: 8 }}>
                        {choices.map((choice: any, cIdx: number) => {
                          const isCorrect = choice.isCorrect === true || choice.isCorrect === 1;
                          return (
                            <View
                              key={choice.personalQuizChoiceID || cIdx}
                              className="flex-row items-center p-3 rounded-xl border"
                              style={{
                                borderColor: isCorrect ? '#10B981' : colors.border,
                                backgroundColor: isCorrect ? (isDark ? '#064e3b30' : '#ecfdf5') : colors.surface,
                              }}
                            >
                              <View className="mr-3">
                                <Ionicons
                                  name={isCorrect ? "checkmark-circle" : "ellipse-outline"}
                                  size={18}
                                  color={isCorrect ? "#10B981" : colors.muted}
                                />
                              </View>
                              <Text
                                className="flex-1 text-sm"
                                style={{
                                  color: isCorrect ? "#10B981" : colors.text,
                                  fontWeight: isCorrect ? '700' : '400',
                                }}
                              >
                                {String.fromCharCode(65 + cIdx)}. {choice.choiceText}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const stripHtml = (input: string) =>
  input?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';

// ── Custom subcomponents for Results, Non-Takers, and Leaderboards ───────────

function QuizResultsModal({
  isDark,
  colors,
  visible,
  title,
  results,
  onClose,
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  visible: boolean;
  title: string;
  results: any[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: '80%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {title} — Scores
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                {results.length} attempt{results.length !== 1 ? 's' : ''} recorded
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 999, backgroundColor: colors.surfaceSoft }}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {results.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons name="people-outline" size={48} color={colors.mutedIcon} />
              <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>No attempts yet</Text>
              <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>No student has submitted this quiz yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={{ gap: 12 }}>
                {results.map((item: any, idx: number) => {
                  const studentName = item.studentName || (item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Unknown Student');
                  const studentCode = item.studentCode || item.student?.userCode || '';
                  const score = item.score ?? 0;
                  const total = item.totalQuestions ?? item.total_questions ?? 10;
                  const acc = item.accuracy ?? ((score / (total || 1)) * 100);
                  const isPassed = acc >= 50;

                  return (
                    <View
                      key={item.resultID || item.id || idx}
                      className="rounded-2xl p-4 border flex-row items-center justify-between"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceSoft,
                      }}
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>
                          {studentName}
                        </Text>
                        {studentCode ? (
                          <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                            {studentCode}
                          </Text>
                        ) : null}
                      </View>
                      <View className="items-end">
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>
                          {score} / {total}
                        </Text>
                        <View className="px-2 py-0.5 rounded-full mt-1.5" style={{ backgroundColor: isPassed ? '#10B98120' : '#EF444420' }}>
                          <Text className="text-[10px] font-bold" style={{ color: isPassed ? '#10B981' : '#EF4444' }}>
                            {Number(acc).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function NonTakersModal({
  isDark,
  colors,
  visible,
  title,
  students,
  onClose,
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  visible: boolean;
  title: string;
  students: any[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: '80%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {title} — Non-Takers
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                {students.length} student{students.length !== 1 ? 's' : ''} have not started
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 999, backgroundColor: colors.surfaceSoft }}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {students.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>100% Completed!</Text>
              <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>All students have completed this quiz.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={{ gap: 12 }}>
                {students.map((item: any, idx: number) => {
                  const student = item.student || item;
                  const studentName = item.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student';
                  const studentCode = item.studentCode || student.userCode || '';
                  const email = item.email || student.email || '';
                  const studentID = item.studentID || student.userID || idx;

                  return (
                    <View
                      key={studentID}
                      className="rounded-2xl p-4 border flex-row items-center justify-between"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceSoft,
                      }}
                    >
                      <View className="flex-1">
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>
                          {studentName}
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                          {[studentCode, email].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EF444415' }}>
                        <Text className="text-[10px] font-bold text-red-500">
                          Pending
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function LeaderboardModal({
  isDark,
  colors,
  visible,
  title,
  leaderboard,
  recent,
  loading,
  onClose,
}: {
  isDark: boolean;
  colors: ReturnType<typeof getRoleThemeColors>;
  visible: boolean;
  title: string;
  leaderboard: any[];
  recent: any[];
  loading: boolean;
  onClose: () => void;
}) {
  const [showRecent, setShowRecent] = useState(false);

  // Group top 3 and others
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: '85%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
                🏆 {title} Leaderboard
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                Top performers in this class
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 999, backgroundColor: colors.surfaceSoft }}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <CapsActivityIndicator size="large" color={colors.accent} />
              <Text className="mt-2 text-xs" style={{ color: colors.muted }}>Loading rankings...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons name="ribbon-outline" size={48} color={colors.mutedIcon} />
              <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>No rankings yet</Text>
              <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>Take the quiz to populate the leaderboard!</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Podium for top 3 */}
              {top3.length > 0 ? (
                <View className="flex-row justify-center items-end gap-3 mb-6 mt-4 px-2">
                  {/* 2nd Place */}
                  {top3[1] ? (
                    <View className="items-center flex-1">
                      <Text className="text-2xl">🥈</Text>
                      <View className="w-full rounded-t-2xl py-3 px-1 items-center mt-2" style={{ backgroundColor: colors.surfaceSoft, minHeight: 90, borderWidth: 1, borderColor: colors.border }}>
                        <Text className="text-[11px] font-bold text-center" style={{ color: colors.text }} numberOfLines={2}>
                          {top3[1].name || top3[1].studentName || top3[1].student?.firstName || 'Student 2'}
                        </Text>
                        <Text className="text-xs font-bold mt-2 text-gray-500">
                          {Number(top3[1].highestPercentage ?? top3[1].percentage ?? top3[1].accuracy ?? 0).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  ) : <View className="flex-1" />}

                  {/* 1st Place */}
                  {top3[0] ? (
                    <View className="items-center flex-1">
                      <Text className="text-3xl">🥇</Text>
                      <View className="w-full rounded-t-2xl py-4 px-1 items-center mt-2" style={{ backgroundColor: `${colors.accent}15`, minHeight: 110, borderWidth: 2, borderColor: colors.accent }}>
                        <Text className="text-[12px] font-bold text-center" style={{ color: colors.accent }} numberOfLines={2}>
                          {top3[0].name || top3[0].studentName || top3[0].student?.firstName || 'Student 1'}
                        </Text>
                        <Text className="text-sm font-extrabold mt-2" style={{ color: colors.accent }}>
                          {Number(top3[0].highestPercentage ?? top3[0].percentage ?? top3[0].accuracy ?? 0).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* 3rd Place */}
                  {top3[2] ? (
                    <View className="items-center flex-1">
                      <Text className="text-2xl">🥉</Text>
                      <View className="w-full rounded-t-2xl py-3 px-1 items-center mt-2" style={{ backgroundColor: colors.surfaceSoft, minHeight: 80, borderWidth: 1, borderColor: colors.border }}>
                        <Text className="text-[11px] font-bold text-center" style={{ color: colors.text }} numberOfLines={2}>
                          {top3[2].name || top3[2].studentName || top3[2].student?.firstName || 'Student 3'}
                        </Text>
                        <Text className="text-xs font-bold mt-2 text-amber-700">
                          {Number(top3[2].highestPercentage ?? top3[2].percentage ?? top3[2].accuracy ?? 0).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  ) : <View className="flex-1" />}
                </View>
              ) : null}

              {/* Remaining ranked students */}
              {remaining.length > 0 ? (
                <View style={{ gap: 8 }} className="mb-6">
                  <Text className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.muted }}>
                    Other Rankings
                  </Text>
                  {remaining.map((item: any, idx: number) => {
                    const rankNum = idx + 4;
                    const studentName = item.name || item.studentName || (item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Student');
                    const acc = item.highestPercentage ?? item.percentage ?? item.accuracy ?? 0;

                    return (
                      <View
                        key={item.id || idx}
                        className="flex-row items-center justify-between p-3.5 rounded-xl"
                        style={{ backgroundColor: colors.surfaceSoft }}
                      >
                        <View className="flex-row items-center">
                          <Text className="text-xs font-bold w-6 text-center" style={{ color: colors.muted }}>
                            #{rankNum}
                          </Text>
                          <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                            {studentName}
                          </Text>
                        </View>
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>
                          {Number(acc).toFixed(0)}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Collapsible Recent Takers */}
              {recent.length > 0 ? (
                <View className="mt-2 border-t pt-4" style={{ borderTopColor: colors.border }}>
                  <TouchableOpacity
                    onPress={() => setShowRecent(!showRecent)}
                    className="flex-row justify-between items-center py-2"
                  >
                    <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.muted }}>
                      Recent Attempts ({recent.length})
                    </Text>
                    <Ionicons
                      name={showRecent ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.muted}
                    />
                  </TouchableOpacity>

                  {showRecent ? (
                    <View style={{ gap: 8 }} className="mt-2">
                      {recent.map((item: any, idx: number) => {
                        const name = item.name || item.studentName || item.student?.firstName || 'Student';
                        const acc = item.lastAttemptPercentage ?? item.highestPercentage ?? item.accuracy ?? 0;
                        const dateStr = item.lastAttemptDate || item.takenAt || item.completedAt || item.submitTime || '';

                        return (
                          <View
                            key={idx}
                            className="flex-row justify-between items-center p-3 rounded-lg"
                            style={{ backgroundColor: colors.surfaceSoft }}
                          >
                            <View>
                              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                                {name}
                              </Text>
                              {dateStr ? (
                                <Text className="text-[10px] mt-0.5" style={{ color: colors.muted }}>
                                  {formatDate(dateStr)}
                                </Text>
                              ) : null}
                            </View>
                            <Text className="text-xs font-bold" style={{ color: colors.text }}>
                              {Number(acc).toFixed(0)}%
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
