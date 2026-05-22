import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
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
  getSubjectIcon,
  studentColors,
  studentShadow,
} from '../../../src/features/student/ui/StudentUI';

type SearchFilter = 'All' | 'Program' | 'General';

const FILTERS: SearchFilter[] = ['All', 'Program', 'General'];

export default function StudentSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('All');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingExam, setLoadingExam] = useState(false);

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
          enableTimer: Boolean(data.enableTimer).toString(),
          durationMinutes: data.durationMinutes?.toString() || '60',
        },
      });
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Unable to load exam', 'error');
    } finally {
      setLoadingExam(false);
    }
  }

  const filteredSubjects = useMemo(() => {
    let nextSubjects = [...subjects];

    const isGE = (subject: any) =>
      subject.programID === 6 ||
      subject.programName === 'GE' ||
      String(subject.programName).toLowerCase() === 'ge';

    if (activeFilter === 'Program') {
      nextSubjects = nextSubjects.filter((subject) => !isGE(subject));
    } else if (activeFilter === 'General') {
      nextSubjects = nextSubjects.filter((subject) => isGE(subject));
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
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Orange hero header */}
        <View className="px-6 pb-[18px]" style={{ paddingTop: insets.top + 18, backgroundColor: studentColors.orange }}>
          <StudentHeroDecoration />
          <Text className="mb-[18px] text-center text-[28px] font-medium leading-9 text-white" style={{ fontFamily: 'Rubik' }}>
            Search
          </Text>

          <View
            className="flex-row items-center gap-2.5 rounded-2xl border px-3.5 py-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.82)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Calculus I"
              placeholderTextColor="rgba(255,255,255,0.72)"
              className="flex-1 text-[15px] font-normal leading-[22px] text-white"
              style={{ fontFamily: 'Rubik', paddingVertical: 0 }}
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

        {/* White content sheet */}
        <View style={{ backgroundColor: studentColors.orange }}>
          <View
            className="min-h-[560px] px-6 pb-6 pt-5"
            style={{
              backgroundColor: studentColors.white,
              borderTopLeftRadius: 34,
              borderTopRightRadius: 34,
              marginTop: -10,
            }}
          >
            {/* Filter chips */}
            <View className="mb-5 flex-row items-center gap-2.5">
              {FILTERS.map((filter) => {
                const active = filter === activeFilter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    className="rounded-full px-3.5 py-2"
                    style={active ? { backgroundColor: studentColors.orange } : undefined}
                  >
                    <Text
                      className="text-[13px] font-medium leading-[18px]"
                      style={{
                        fontFamily: 'Rubik',
                        color: active ? studentColors.white : studentColors.textSoft,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <StudentSectionHeader
              title="Available Exams"
              actionLabel={filteredSubjects.length ? `${filteredSubjects.length}` : undefined}
              actionColor={studentColors.textSoft}
            />
            <Text className="mt-1 text-sm leading-5 text-gray-400" style={{ fontFamily: 'Rubik' }}>
              Search by subject name or subject code.
            </Text>

            {/* Results */}
            <View className="mt-[18px] gap-3.5">
              {isLoading ? (
                <View
                  className="items-center justify-center gap-2.5 rounded-3xl border-2 border-caps-border bg-white py-8 px-5"
                  style={studentShadow}
                >
                  <CapsActivityIndicator size="large" color={studentColors.orange} />
                  <Text className="text-center text-sm leading-5 text-gray-400" style={{ fontFamily: 'Rubik' }}>
                    Loading subjects...
                  </Text>
                </View>
              ) : loadingExam ? (
                <View
                  className="items-center justify-center gap-2.5 rounded-3xl border-2 border-caps-border bg-white py-8 px-5"
                  style={studentShadow}
                >
                  <CapsActivityIndicator size="large" color={studentColors.orange} />
                  <Text className="text-center text-sm leading-5 text-gray-400" style={{ fontFamily: 'Rubik' }}>
                    Loading exam...
                  </Text>
                </View>
              ) : filteredSubjects.length === 0 ? (
                <View
                  className="items-center justify-center gap-2.5 rounded-3xl border-2 border-caps-border bg-white py-8 px-5"
                  style={studentShadow}
                >
                  <Ionicons name="search-outline" size={32} color={studentColors.orange} />
                  <Text className="text-lg font-medium leading-6 text-gray-800" style={{ fontFamily: 'Rubik' }}>
                    No subjects found
                  </Text>
                  <Text className="text-center text-sm leading-5 text-gray-400" style={{ fontFamily: 'Rubik' }}>
                    Try a different search term or filter.
                  </Text>
                </View>
              ) : (
                filteredSubjects.map((subject) => (
                  <StudentExamCard
                    key={subject.subjectID}
                    title={subject.subjectName}
                    subtitle={subject.subjectCode || 'GEN'}
                    iconVariant={getSubjectVisualVariant(subject.subjectName)}
                    subjectCode={subject.subjectCode}
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
