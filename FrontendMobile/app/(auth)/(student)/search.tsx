import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiRequest } from '../../../src/services/apiClient';
import { showToast } from '../../../src/hooks/useToast';
import {
  StudentExamCard,
  StudentHeroDecoration,
  StudentSectionHeader,
  getSubjectVisualVariant,
  studentColors,
  studentShadow,
} from '../../../src/student/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Search filter types — "Program" shows only subjects tied to a program,
// "General" shows subjects available to all programs, "All" shows both.
// ─────────────────────────────────────────────────────────────────────────────
type SearchFilter = 'All' | 'Program' | 'General';

const FILTERS: SearchFilter[] = ['All', 'Program', 'General'];

export default function StudentSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Search state ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('All');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingExam, setLoadingExam] = useState(false);

  // ── Fetch all practice subjects on mount ───────────────────────────────

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setIsLoading(true);

    try {
      const data = await apiRequest('/api/student/practice-subjects');
      setSubjects(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showToast('Unable to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubjectPress(subject: any) {
    setLoadingExam(true);

    try {
      const data = await apiRequest(`/api/practice-exam/generate/${subject.subjectID}`);

      if (!data?.questions || data.questions.length === 0) {
        throw new Error('No questions available for this subject.');
      }

      router.push({
        pathname: '/(auth)/practice-exam/info',
        params: {
          subjectID: subject.subjectID,
          subjectName: data.subjectName || subject.subjectName,
          totalItems: data.questions.length,
          totalPoints: data.totalPoints || data.questions.length,
          enableTimer: data.enableTimer?.toString() || 'false',
          durationMinutes: data.durationMinutes?.toString() || '60',
        },
      });
    } catch (error: any) {
      showToast(error?.message || 'Unable to load exam', 'error');
    } finally {
      setLoadingExam(false);
    }
  }

  // ── Filter + search logic: applies Program/General filter first,
  // then narrows results by subject name or code match.
  // ──────────────────────────────────────────────────────────────────────
  const filteredSubjects = useMemo(() => {
    let nextSubjects = [...subjects];

    if (activeFilter === 'Program') {
      nextSubjects = nextSubjects.filter((subject) => Boolean(subject.programID));
    } else if (activeFilter === 'General') {
      nextSubjects = nextSubjects.filter((subject) => !subject.programID);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextSubjects = nextSubjects.filter(
        (subject) =>
          subject.subjectName?.toLowerCase().includes(query) ||
          subject.subjectCode?.toLowerCase().includes(query)
      );
    }

    return nextSubjects;
  }, [activeFilter, searchQuery, subjects]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ─────────────────────────────────────────────────────────────────
          SCROLLABLE CONTENT
          Orange hero header with search bar + white sheet with filter
          chips and exam card results.
          ───────────────────────────────────────────────────────────────── */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ───────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Screen title + translucent search input field.
            ─────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 18 }]}>
          <StudentHeroDecoration />

          <Text style={styles.heroTitle}>Search</Text>

          <View style={styles.searchField}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.82)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Calculus I"
              placeholderTextColor="rgba(255,255,255,0.72)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.78)" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────
            WHITE CONTENT SHEET
            Filter chips (All / Program / General) + exam results list.
            ─────────────────────────────────────────────────────────────── */}
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>

            {/* ── Filter chips: toggle between Program, General, or All subjects ── */}
            <View style={styles.filterRow}>
              {FILTERS.map((filter) => {
                const active = filter === activeFilter;

                return (
                  <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={[styles.filterChip, active ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{filter}</Text>
                  </Pressable>
                );
              })}
            </View>

            <StudentSectionHeader
              title="Available Exams"
              actionLabel={filteredSubjects.length ? `${filteredSubjects.length}` : undefined}
              actionColor={studentColors.textSoft}
            />
            <Text style={styles.sheetSubtitle}>Search by subject name or subject code.</Text>

            {/* ── Search results: loading, loading exam, empty, or filtered exam cards ── */}
            <View style={styles.resultsWrap}>
              {isLoading ? (
                <View style={styles.feedbackCard}>
                  <ActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={styles.feedbackText}>Loading subjects...</Text>
                </View>
              ) : loadingExam ? (
                <View style={styles.feedbackCard}>
                  <ActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={styles.feedbackText}>Loading exam...</Text>
                </View>
              ) : filteredSubjects.length === 0 ? (
                <View style={styles.feedbackCard}>
                  <Ionicons name="search-outline" size={32} color={studentColors.orange} />
                  <Text style={styles.feedbackTitle}>No subjects found</Text>
                  <Text style={styles.feedbackText}>Try a different search term or filter.</Text>
                </View>
              ) : (
                filteredSubjects.map((subject) => (
                  <StudentExamCard
                    key={subject.subjectID}
                    title={subject.subjectName}
                    subtitle={`${subject.subjectCode || 'GEN'} • ${subject.questionCount || 10} quizzes`}
                    iconVariant={getSubjectVisualVariant(subject.subjectName)}
                    onPress={() => handleSubjectPress(subject)}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.white,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: studentColors.orange,
  },
  heroTitle: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 18,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  searchInput: {
    flex: 1,
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    paddingVertical: 0,
  },
  sheetWrap: {
    backgroundColor: studentColors.orange,
  },
  sheet: {
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -10,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    minHeight: 560,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: studentColors.orange,
  },
  filterChipText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  filterChipTextActive: {
    color: studentColors.white,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 4,
  },
  resultsWrap: {
    gap: 14,
    marginTop: 18,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
    paddingVertical: 30,
    paddingHorizontal: 20,
    ...studentShadow,
  },
  feedbackTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  feedbackText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
});
