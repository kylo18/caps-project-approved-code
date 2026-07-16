import { useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import {
  StudentHeroDecoration,
  getStudentColors,
  getStudentShadow,
} from '../../../src/features/student/ui/StudentUI';
import {
  getMyClasses,
  getMyTeachers,
  getQuizResults,
  getQuizSessions,
  invalidateMyClassesCache,
  joinClass,
} from '../../../src/services/studentClassService';

interface EnrolledClass {
  enrollmentID: number;
  classID: number;
  className: string;
  classCode: string;
  description?: string;
  schedule?: string;
  isActive: boolean;
  subject?: {
    subjectID: number;
    subjectCode: string;
    subjectName: string;
  };
  faculty?: {
    userID: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrolledAt?: string;
}

interface Teacher {
  teacherID?: number;
  userID?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export default function StudentClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);

  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadResults();
    loadSessions();
    const interval = setInterval(() => {
      loadClasses();
      loadResults();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function loadClasses() {
    try {
      const result = await getMyClasses();
      setClasses(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadTeachers() {
    try {
      const result = await getMyTeachers();
      setTeachers(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    }
  }

  async function loadResults() {
    try {
      const result = await getQuizResults();
      const list = Array.isArray(result) ? result : result?.data || [];
      setResults(list.slice(0, 5)); // Show latest 5
    } catch (error) {
      console.error('Error loading results:', error);
      setResults([]);
    }
  }

  async function loadSessions() {
    try {
      const result = await getQuizSessions();
      const list = Array.isArray(result) ? result : result?.data || [];
      setSessions(list);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await invalidateMyClassesCache();
    await loadClasses();
    await loadTeachers();
    await loadResults();
    await loadSessions();
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a class code');
      return;
    }
    setJoining(true);
    setJoinError('');
    try {
      const response = await joinClass(code);
      if (response?.success || response?.data?.success) {
        setJoinCode('');
        setShowJoinModal(false);
        await invalidateMyClassesCache();
        await loadClasses();
      } else {
        setJoinError(response?.message || response?.data?.message || 'Failed to join class');
      }
    } catch (error: unknown) {
      setJoinError(error instanceof Error ? error.message : 'Invalid class code or network error');
    } finally {
      setJoining(false);
    }
  };

  const displayName = (person?: { firstName?: string; lastName?: string }) => {
    if (!person) return 'Unknown';
    return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.page }}>
        <StatusBar style="light" />
        <CapsActivityIndicator size="large" color={colors.orange} />
        <Text className="mt-4 text-sm" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>
          Loading Classes...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
      >
        {/* ── Orange Hero Header ─────────────────────────────────────────── */}
        <View className="px-6 pb-[42px]" style={{ paddingTop: insets.top + 12, backgroundColor: isDark ? colors.headerWarm : colors.header }}>
          <StudentHeroDecoration />

          <View className="mb-[18px] flex-row items-center justify-between">
            <View>
              <Text
                className="text-white"
                style={{ fontFamily: 'Rubik', fontSize: 28, fontWeight: '500', lineHeight: 36 }}
              >
                Classes
              </Text>
              <Text
                className="mt-1"
                style={{
                  color: 'rgba(255,255,255,0.82)',
                  fontFamily: 'Rubik',
                  fontSize: 13,
                  fontWeight: '400',
                  lineHeight: 20,
                }}
              >
                Your enrolled classes and quizzes
              </Text>
            </View>
            <Pressable
              onPress={() => setShowJoinModal(true)}
              className="flex-row items-center rounded-full px-3 py-2"
              style={{ backgroundColor: isDark ? 'rgba(255,140,0,0.16)' : 'rgba(255,255,255,0.2)', gap: 6 }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text
                style={{
                  color: '#fff',
                  fontFamily: 'Rubik',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Join
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── White Content Sheet ────────────────────────────────────────── */}
        <View className="rounded-t-[34px] -mt-7 px-6 pt-6 pb-7 min-h-[500px]" style={{ backgroundColor: colors.card }}>
          {/* ── My Classes ──────────────────────────────────────────────── */}
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="school-outline" size={20} color={colors.orange} />
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Rubik',
                fontSize: 16,
                fontWeight: '600',
                lineHeight: 22,
              }}
            >
              My Classes
            </Text>
            <Text
              style={{
                color: colors.textSoft,
                fontFamily: 'Rubik',
                fontSize: 13,
                fontWeight: '400',
              }}
            >
              ({classes.length})
            </Text>
          </View>

          <View className="gap-3">
            {classes.length === 0 ? (
              <View
                className="items-center justify-center gap-2.5 rounded-3xl border-2 py-8 px-5"
                style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
              >
                <Ionicons name="school-outline" size={32} color={colors.orange} />
                <Text
                  className="text-center"
                  style={{
                    color: colors.textSoft,
                    fontFamily: 'Rubik',
                    fontSize: 14,
                    fontWeight: '400',
                    lineHeight: 20,
                  }}
                >
                  You're not enrolled in any classes yet.
                </Text>
                <Text
                  className="text-center"
                  style={{
                    color: colors.textSoft,
                    fontFamily: 'Rubik',
                    fontSize: 12,
                    fontWeight: '400',
                    lineHeight: 18,
                  }}
                >
                  Tap "Join" above and enter a class code to get started.
                </Text>
              </View>
            ) : (
              classes.map((cls) => (
                <Pressable
                  key={cls.enrollmentID}
                  className="rounded-[22px] border-2 px-4 py-3.5"
                  style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
                  onPress={() => {
                    router.push({
                      pathname: '/(auth)/(student)/class-detail',
                      params: { classID: String(cls.classID), className: cls.className, origin: 'classes' },
                    });
                  }}
                >
                  <View className="flex-row items-center gap-3.5">
                    <View
                      className="w-14 h-14 rounded-[18px] items-center justify-center"
                      style={{ backgroundColor: colors.cardSoft }}
                    >
                      <Ionicons name="school" size={24} color={colors.orange} />
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.text,
                          fontFamily: 'Rubik',
                          fontSize: 16,
                          fontWeight: '600',
                          lineHeight: 22,
                        }}
                      >
                        {cls.className}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSoft,
                          fontFamily: 'Rubik',
                          fontSize: 12,
                          fontWeight: '400',
                          lineHeight: 18,
                          marginTop: 2,
                        }}
                      >
                        {cls.subject?.subjectCode || 'SUBJ'} · {displayName(cls.faculty)}
                      </Text>
                      {cls.schedule ? (
                        <Text
                          style={{
                            color: colors.textSoft,
                            fontFamily: 'Rubik',
                            fontSize: 11,
                            fontWeight: '400',
                            lineHeight: 16,
                            marginTop: 2,
                          }}
                        >
                          {cls.schedule}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.orange} />
                  </View>
                </Pressable>
              ))
            )}
          </View>

          {/* ── Quiz Sessions ───────────────────────────────────────────── */}
          {sessions.length > 0 && (
            <>
              <View className="flex-row items-center gap-2 mt-7 mb-4">
                <Ionicons name="calendar-outline" size={20} color={colors.orange} />
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: 'Rubik',
                    fontSize: 16,
                    fontWeight: '600',
                    lineHeight: 22,
                  }}
                >
                  Quiz Sessions
                </Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {['ongoing', 'upcoming', 'completed', 'missed'].map((status) => {
                  const count = sessions.filter((s) => s.status === status || s.sessionStatus === status).length;
                  if (count === 0) return null;
                  const statusColors: Record<string, string> = {
                    ongoing: colors.orange,
                    upcoming: '#F59E0B',
                    completed: colors.success,
                    missed: '#EF4444',
                  };
                  const icons: Record<string, any> = {
                    ongoing: 'timer-outline',
                    upcoming: 'time-outline',
                    completed: 'checkmark-circle-outline',
                    missed: 'alert-circle-outline',
                  };
                  return (
                    <View
                      key={status}
                      className="flex-row items-center rounded-2xl px-3 py-2 border-2"
                      style={{ backgroundColor: colors.cardSoft, borderColor: colors.border, gap: 6 }}
                    >
                      <Ionicons name={icons[status]} size={16} color={statusColors[status]} />
                      <Text style={{ color: colors.text, fontFamily: 'Rubik', fontSize: 13, fontWeight: '600' }}>
                        {count} {status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Recent Results ──────────────────────────────────────────── */}
          {results.length > 0 && (
            <>
              <View className="flex-row items-center gap-2 mt-7 mb-4">
                <Ionicons name="trophy-outline" size={20} color={colors.orange} />
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: 'Rubik',
                    fontSize: 16,
                    fontWeight: '600',
                    lineHeight: 22,
                  }}
                >
                  Recent Results
                </Text>
              </View>
              <View className="gap-3">
                {results.map((result: any, index: number) => {
                  const accuracy = result.accuracy ?? result.score ?? 0;
                  const meta = accuracy >= 70
                    ? { icon: 'checkmark-circle' as const, color: colors.success }
                    : accuracy >= 50
                      ? { icon: 'alert-circle' as const, color: '#856404' }
                      : { icon: 'close-circle' as const, color: '#EF4444' };
                  return (
                    <Pressable
                      key={`${result.resultID || result.attemptID || index}-${index}`}
                      className="rounded-[22px] border-2 px-4 py-3"
                      style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
                      onPress={() => {
                        router.push({
                          pathname: '/(auth)/(student)/class-quiz-result',
                          params: {
                            resultID: String(result.resultID || result.attemptID),
                            quizName: result.quizName || result.personalQuiz?.title || 'Quiz',
                          },
                        });
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center flex-wrap gap-1.5 mb-1.5" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <View 
                              className="px-2 py-0.5 rounded-md" 
                              style={{ backgroundColor: colors.cardSoft, borderWidth: 1, borderColor: colors.border }}
                            >
                              <Text 
                                style={{ 
                                  color: colors.orange, 
                                  fontFamily: 'Rubik', 
                                  fontSize: 10, 
                                  fontWeight: '600' 
                                }}
                              >
                                {result.className || 'Class'}
                              </Text>
                            </View>
                          </View>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: colors.text,
                              fontFamily: 'Rubik',
                              fontSize: 14,
                              fontWeight: '500',
                              lineHeight: 20,
                            }}
                          >
                            {result.quizName || result.personalQuiz?.title || 'Quiz'}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSoft,
                              fontFamily: 'Rubik',
                              fontSize: 11,
                              fontWeight: '400',
                              lineHeight: 16,
                              marginTop: 2,
                            }}
                          >
                            {new Date(result.completedAt || result.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="flex-row items-center" style={{ gap: 4 }}>
                          <Ionicons name={meta.icon} size={14} color={meta.color} />
                          <Text
                            style={{
                              color: meta.color,
                              fontFamily: 'Rubik',
                              fontSize: 14,
                              fontWeight: '700',
                            }}
                          >
                            {Math.round(accuracy)}%
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ── My Teachers ─────────────────────────────────────────────── */}
          {teachers.length > 0 && (
            <>
              <View className="flex-row items-center gap-2 mt-7 mb-4">
                <Ionicons name="people-outline" size={20} color={colors.orange} />
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: 'Rubik',
                    fontSize: 16,
                    fontWeight: '600',
                    lineHeight: 22,
                  }}
                >
                  My Teachers
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {teachers.map((teacher, index) => {
                  const name = teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher';
                  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const palette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
                  const bg = palette[(teacher.userID || index) % palette.length];
                  return (
                    <View
                      key={teacher.userID || teacher.teacherID || index}
                      className="items-center rounded-2xl border-2 px-4 py-3"
                      style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow, minWidth: 100 }}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: bg }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontFamily: 'Rubik',
                            fontSize: 16,
                            fontWeight: '700',
                          }}
                        >
                          {initials}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.text,
                          fontFamily: 'Rubik',
                          fontSize: 12,
                          fontWeight: '500',
                          maxWidth: 100,
                        }}
                      >
                        {name}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Join Class Modal ───────────────────────────────────────────── */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.overlay }}
          onPress={() => {
            setShowJoinModal(false);
            setJoinCode('');
            setJoinError('');
          }}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={{ width: '100%' }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
              <View
                className="rounded-t-[32px] px-6 pt-5 pb-8"
                style={{ paddingBottom: insets.bottom + 24, backgroundColor: colors.card }}
              >
                <View className="self-center w-12 h-1.5 rounded-full mb-6" style={{ backgroundColor: colors.border }} />

                <Text
                  style={{
                    color: colors.text,
                    fontFamily: 'Rubik',
                    fontSize: 20,
                    fontWeight: '500',
                    lineHeight: 28,
                    marginBottom: 4,
                  }}
                >
                  Join a Class
                </Text>
                <Text
                  style={{
                    color: colors.textSoft,
                    fontFamily: 'Rubik',
                    fontSize: 14,
                    fontWeight: '400',
                    lineHeight: 20,
                    marginBottom: 20,
                  }}
                >
                  Enter the 6-character class code provided by your teacher.
                </Text>

                <TextInput
                  value={joinCode}
                  onChangeText={(text) => {
                    setJoinCode(text.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  maxLength={10}
                  className="rounded-2xl border-2 px-4 py-3.5 text-base"
                  style={{
                    borderColor: joinError ? '#EF4444' : colors.border,
                    backgroundColor: colors.cardSoft,
                    fontFamily: 'Rubik',
                    color: colors.text,
                  }}
                  placeholderTextColor={colors.textSoft}
                />
                {joinError ? (
                  <Text className="mt-2 text-sm" style={{ color: '#EF4444', fontFamily: 'Rubik' }}>
                    {joinError}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleJoin}
                  disabled={joining}
                  className="rounded-2xl py-4 mt-5 items-center"
                  style={{ backgroundColor: colors.orange, opacity: joining ? 0.7 : 1 }}
                >
                  {joining ? (
                    <CapsActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Rubik',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Join Class
                    </Text>
                  )}
                </Pressable>
              </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}
