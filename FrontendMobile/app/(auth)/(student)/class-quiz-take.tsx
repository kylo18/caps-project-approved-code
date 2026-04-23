import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { studentColors } from '../../../src/student/ui';
import { submitQuiz } from '../../../src/services/studentClassService';

interface Question {
  personalQuizQuestionID: number;
  questionText: string;
  image?: string | null;
  score?: number;
  choices: Choice[];
}

interface Choice {
  personalQuizChoiceID: number;
  choiceText: string;
  image?: string | null;
  position?: number;
}

export default function ClassQuizTakeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    classPersonalQuizID,
    classID,
    quizName,
    questions: questionsParam,
    settings: settingsParam,
    attemptNumber,
    startedAt,
  } = useLocalSearchParams();

  const quizId = String(classPersonalQuizID);
  const questions: Question[] = useMemoizedJson(questionsParam);
  const settings: any = useMemoizedJson(settingsParam);
  const attemptNum = Number(attemptNumber) || 1;
  const startTime = String(startedAt);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const timerEnabled = settings?.quizTimerEnabled && settings?.quizTimer;
  const totalSeconds = timerEnabled ? settings.quizTimer * 60 : 0;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestamp = useRef(Date.now());

  useEffect(() => {
    if (timerEnabled && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerEnabled]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;

  const handleSelect = (choiceID: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.personalQuizQuestionID]: choiceID }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Alert.alert('Time\'s Up!', 'Your quiz is being submitted automatically.');
    performSubmit();
  };

  const handleManualSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.personalQuizQuestionID]).length;
    if (unanswered > 0) {
      Alert.alert(
        'Submit Quiz?',
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`,
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Submit', onPress: performSubmit },
        ]
      );
    } else {
      Alert.alert('Submit Quiz?', 'Are you sure you want to submit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: performSubmit },
      ]);
    }
  };

  const performSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTakenSeconds = Math.round((Date.now() - startTimestamp.current) / 1000);

    const payload = {
      attempt_number: attemptNum,
      started_at: startTime,
      time_taken_seconds: timeTakenSeconds,
      answers: questions.map((q) => ({
        personalQuizQuestionID: q.personalQuizQuestionID,
        selectedChoiceID: answers[q.personalQuizQuestionID] ?? null,
      })),
    };

    try {
      const response = await submitQuiz(quizId, payload);
      const resultID = response?.resultID || response?.data?.resultID || response?.attemptID;

      if (resultID) {
        router.replace({
          pathname: '/(auth)/(student)/class-quiz-result',
          params: {
            resultID: String(resultID),
            quizName: String(quizName || 'Quiz'),
          },
        });
      } else {
        Alert.alert('Submitted', 'Your quiz has been submitted successfully.');
        router.replace('/(auth)/(student)/classes');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <CapsActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Top Bar */}
      <View
        className="flex-row items-center justify-between px-5 pb-4"
        style={{ paddingTop: insets.top + 12, backgroundColor: studentColors.orange }}
      >
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        <View className="items-center">
          <Text className="text-white font-medium text-sm" style={{ fontFamily: 'Rubik' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
          <View className="w-32 h-1.5 rounded-full bg-white/30 mt-1.5 overflow-hidden">
            <View className="h-full rounded-full bg-white" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
          </View>
        </View>

        {timerEnabled ? (
          <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: secondsLeft <= 300 ? '#FEE2E2' : 'rgba(255,255,255,0.2)' }}>
            <Ionicons name="time" size={14} color={secondsLeft <= 300 ? '#EF4444' : '#fff'} />
            <Text className="text-xs font-semibold" style={{ color: secondsLeft <= 300 ? '#EF4444' : '#fff', fontFamily: 'Rubik' }}>
              {formatTime(secondsLeft)}
            </Text>
          </View>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Question */}
        <Text
          className="text-base leading-6 mb-5"
          style={{ color: studentColors.text, fontFamily: 'Rubik', fontWeight: '500' }}
        >
          {stripHtml(currentQuestion.questionText)}
        </Text>

        {/* Choices */}
        <View className="gap-3">
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = answers[currentQuestion.personalQuizQuestionID] === choice.personalQuizChoiceID;
            return (
              <Pressable
                key={choice.personalQuizChoiceID}
                onPress={() => handleSelect(choice.personalQuizChoiceID)}
                className="flex-row items-center p-4 rounded-xl border-2"
                style={{
                  backgroundColor: isSelected ? '#FFF1E9' : studentColors.white,
                  borderColor: isSelected ? studentColors.orange : studentColors.border,
                }}
              >
                <View
                  className="w-7 h-7 rounded-full border-2 items-center justify-center mr-3"
                  style={{
                    borderColor: isSelected ? studentColors.orange : studentColors.textSoft,
                    backgroundColor: isSelected ? studentColors.orange : 'transparent',
                  }}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text
                  className="flex-1 text-[15px] leading-[22px]"
                  style={{
                    color: studentColors.text,
                    fontFamily: 'Rubik',
                    fontWeight: isSelected ? '600' : '400',
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {choice.choiceText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-white flex-row items-center justify-between"
        style={{
          borderTopWidth: 1,
          borderTopColor: studentColors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{
            backgroundColor: studentColors.surfaceSoft,
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          <Ionicons name="arrow-back" size={18} color={studentColors.text} />
          <Text className="ml-1 text-sm font-medium" style={{ color: studentColors.text, fontFamily: 'Rubik' }}>
            Prev
          </Text>
        </Pressable>

        <Text className="text-xs" style={{ color: studentColors.textSoft, fontFamily: 'Rubik' }}>
          {answeredCount} / {totalQuestions} answered
        </Text>

        {currentIndex === totalQuestions - 1 ? (
          <Pressable
            onPress={handleManualSubmit}
            disabled={submitting}
            className="flex-row items-center px-5 py-3 rounded-xl"
            style={{ backgroundColor: studentColors.orange, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <CapsActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text className="mr-1 text-sm font-semibold text-white" style={{ fontFamily: 'Rubik' }}>
                  Submit
                </Text>
                <Ionicons name="send" size={16} color="#fff" />
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            className="flex-row items-center px-5 py-3 rounded-xl"
            style={{ backgroundColor: studentColors.orange }}
          >
            <Text className="mr-1 text-sm font-semibold text-white" style={{ fontFamily: 'Rubik' }}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Safe JSON parse hook helper
function useMemoizedJson(param: any) {
  const [parsed, setParsed] = useState<any>(null);
  useEffect(() => {
    if (param) {
      try {
        setParsed(JSON.parse(String(param)));
      } catch {
        setParsed(null);
      }
    }
  }, [param]);
  return parsed ?? [];
}

const stripHtml = (input: string) =>
  input?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
