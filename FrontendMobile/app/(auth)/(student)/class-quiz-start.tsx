import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { studentColors } from '../../../src/features/student/ui/StudentUI';
import { getQuizInfo, startQuiz } from '../../../src/services/studentClassService';

export default function ClassQuizStartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { classPersonalQuizID, classID, quizName } = useLocalSearchParams();
  const quizId = String(classPersonalQuizID);

  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  async function loadInfo() {
    try {
      const data = await getQuizInfo(quizId);
      setInfo(data);
    } catch (error) {
      console.error('Error loading quiz info:', error);
      Alert.alert('Error', 'Failed to load quiz information');
    } finally {
      setLoading(false);
    }
  }

  const handleStart = async () => {
    setStarting(true);
    try {
      const response = await startQuiz(quizId);
      const questions = response?.questions || [];
      const settings = response?.settings || {};
      const attemptNumber = response?.attemptNumber || response?.attempt_number || 1;
      const startedAt = response?.startedAt || response?.started_at || new Date().toISOString();

      if (!questions.length) {
        Alert.alert('Error', 'No questions found for this quiz');
        return;
      }

      router.push({
        pathname: '/(auth)/(student)/class-quiz-take',
        params: {
          classPersonalQuizID: quizId,
          classID: String(classID),
          quizName: quizName || info?.quiz?.title || 'Quiz',
          questions: JSON.stringify(questions),
          settings: JSON.stringify(settings),
          attemptNumber: String(attemptNumber),
          startedAt,
        },
      });
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start quiz');
    } finally {
      setStarting(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Untimed';
    if (minutes < 60) return `${minutes} minutes`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hours`;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <StatusBar style="light" />
        <CapsActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  const quiz = info?.quiz || {};
  const settings = info?.settings || {};

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pb-6" style={{ paddingTop: insets.top + 12, backgroundColor: studentColors.orange }}>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text
          className="text-white"
          style={{ fontFamily: 'Rubik', fontSize: 22, fontWeight: '600', lineHeight: 30 }}
        >
          {quizName || quiz.title || 'Quiz'}
        </Text>
      </View>

      <ScrollView
        className="flex-1 bg-white rounded-t-[24px] -mt-4"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta Cards */}
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          <MetaCard icon="document-text-outline" label="Questions" value={`${info?.questionCount || '?'} questions`} />
          <MetaCard
            icon="time-outline"
            label="Duration"
            value={settings.quizTimerEnabled ? formatDuration(settings.quizTimer) : 'Untimed'}
          />
          <MetaCard icon="refresh-outline" label="Attempts" value={`${info?.maxAttempts || 1} allowed`} />
          {info?.deadlineDate && (
            <MetaCard icon="calendar-outline" label="Deadline" value={new Date(info.deadlineDate).toLocaleDateString()} />
          )}
        </View>

        {/* Instructions */}
        {(quiz.description || quiz.instruction) && (
          <View className="mt-6">
            <Text
              style={{
                color: studentColors.text,
                fontFamily: 'Rubik',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Instructions
            </Text>
            {quiz.description ? (
              <Text
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                {quiz.description}
              </Text>
            ) : null}
            {quiz.instruction ? (
              <Text
                className="mt-2"
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                {quiz.instruction}
              </Text>
            ) : null}
          </View>
        )}

        {/* Settings Summary */}
        <View className="mt-6">
          <Text
            style={{
              color: studentColors.text,
              fontFamily: 'Rubik',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Quiz Settings
          </Text>
          <View className="gap-2">
            <SettingRow active={settings.shuffleQuestions} label="Shuffled questions" />
            <SettingRow active={settings.shuffleChoices} label="Shuffled choices" />
            <SettingRow active={settings.showScoreAfterQuiz} label="Show score after quiz" />
            <SettingRow active={settings.showCorrectAnswers} label="Show correct answers after" />
            <SettingRow active={settings.autoSubmitOnTimeout} label="Auto-submit when time runs out" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white"
        style={{
          borderTopWidth: 1,
          borderTopColor: studentColors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <Pressable
          onPress={handleStart}
          disabled={starting}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: studentColors.orange, opacity: starting ? 0.7 : 1 }}
        >
          {starting ? (
            <CapsActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontFamily: 'Rubik', fontSize: 16, fontWeight: '600' }}>
              Start Quiz
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MetaCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View
      className="flex-row items-center rounded-2xl px-3 py-2.5 border-2 flex-1"
      style={{ backgroundColor: studentColors.surfaceSoft, borderColor: studentColors.border, minWidth: 140 }}
    >
      <Ionicons name={icon} size={18} color={studentColors.orange} style={{ marginRight: 8 }} />
      <View>
        <Text
          style={{
            color: studentColors.textSoft,
            fontFamily: 'Rubik',
            fontSize: 10,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: studentColors.text,
            fontFamily: 'Rubik',
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SettingRow({ active, label }: { active?: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        name={active ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={active ? studentColors.success : studentColors.textSoft}
      />
      <Text
        style={{
          color: active ? studentColors.text : studentColors.textSoft,
          fontFamily: 'Rubik',
          fontSize: 13,
          fontWeight: active ? '500' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
