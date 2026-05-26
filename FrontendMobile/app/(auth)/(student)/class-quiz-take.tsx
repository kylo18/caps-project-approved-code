import { useEffect, useRef, useState, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions, Dimensions, Modal, Image, TouchableOpacity } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import RenderHtml from 'react-native-render-html';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const themeColors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const { width, height } = Dimensions.get('window');

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
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

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
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

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
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const colors = {
    bg: themeColors.page,
    card: themeColors.card,
    text: themeColors.text,
    textSecondary: themeColors.textSoft,
    border: themeColors.border,
    optionBg: themeColors.cardSoft,
    selectedBg: isDark ? themeColors.statsCard : themeColors.orangeSoft,
    selectedBorder: themeColors.orange,
    orange: themeColors.orange,
  };

  const questionTagsStyles = useMemo(() => ({
    p: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 8 },
    li: { color: colors.text, fontSize: 15, lineHeight: 22 },
    strong: { color: colors.text, fontWeight: '700' as const },
    u: { textDecorationLine: 'underline' as const },
    a: { color: colors.orange },
    img: {
      backgroundColor: isDark ? '#ffffff' : 'transparent',
      borderRadius: 8,
      padding: 6,
    },
  }), [colors.text, isDark]);

  // Image Modal
  const ImageModal = () => (
    <Modal visible={!!imageModalUrl} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
        {/* Close button */}
        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top + 12, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}
          onPress={() => setImageModalUrl(null)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Image */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          {imageModalUrl ? (
            <Image
              source={{ uri: imageModalUrl }}
              style={{ width: width - 40, height: height * 0.6, backgroundColor: '#ffffff', borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : null}
        </ScrollView>

        {/* Dismiss hint */}
        <TouchableOpacity
          style={{ position: 'absolute', bottom: insets.bottom + 20 }}
          onPress={() => setImageModalUrl(null)}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Tap × to close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  if (!currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <CapsActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Bar */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }}
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-bold mb-1.5" style={{ color: colors.text }} numberOfLines={1}>
            {String(quizName || 'Class Quiz')}
          </Text>
          <View className="flex-row gap-2">
            <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: themeColors.orangeSoft }}>
              <Text className="text-xs font-semibold" style={{ color: colors.orange }}>
                {answeredCount}/{totalQuestions}
              </Text>
            </View>
            {timerEnabled ? (
              <View
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl"
                style={{ backgroundColor: secondsLeft <= 300 ? (isDark ? '#351316' : '#FEE2E2') : themeColors.orangeSoft }}
              >
                <Ionicons name="time" size={14} color={secondsLeft <= 300 ? '#EF4444' : colors.orange} />
                <Text className="text-xs font-semibold" style={{ color: secondsLeft <= 300 ? '#EF4444' : colors.orange }}>
                  {formatTime(secondsLeft)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : '#D1FAE5' }}>
                <Ionicons name="infinite" size={14} color="#10B981" />
                <Text className="text-emerald-500 text-xs font-semibold">Unlimited</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => router.back()} className="p-2" activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="h-1.5 mx-4 mt-2 rounded-[3px]" style={{ backgroundColor: colors.border }}>
        <View className="h-full rounded-[3px]" style={{ width: `${progressPercent}%`, backgroundColor: colors.orange }} />
      </View>
      <Text className="text-xs text-right mx-4 mt-1 mb-2" style={{ color: colors.textSecondary }}>
        Question {currentIndex + 1} of {totalQuestions}
      </Text>

      {/* Question Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="rounded-2xl p-5 border" style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
          {/* Question Header */}
          <View className="flex-row items-center mb-4">
            <View className="w-9 h-9 rounded-full justify-center items-center mr-3" style={{ backgroundColor: colors.orange }}>
              <Text className="text-white text-base font-bold">{currentIndex + 1}</Text>
            </View>
            <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
            {currentQuestion.score ? (
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {currentQuestion.score} pt{currentQuestion.score !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>

          {/* Question Text */}
          <View className="mb-5">
            <RenderHtml
              contentWidth={windowWidth - 48}
              source={{ html: currentQuestion.questionText || '<p></p>' }}
              tagsStyles={questionTagsStyles}
              baseStyle={{ color: colors.text }}
              ignoredStyles={['color', 'backgroundColor']}
            />
          </View>

          {/* Question Image */}
          {currentQuestion.image && (
            <TouchableOpacity onPress={() => setImageModalUrl(currentQuestion.image!)} activeOpacity={0.8} className="mb-4">
              <Text className="text-sm font-medium" style={{ color: colors.orange }}>Tap to view question image</Text>
            </TouchableOpacity>
          )}

          {/* Choices */}
          <View className="gap-3">
            {currentQuestion.choices.map((choice, idx) => {
              const isSelected = answers[currentQuestion.personalQuizQuestionID] === choice.personalQuizChoiceID;
              return (
                <TouchableOpacity
                  key={choice.personalQuizChoiceID}
                  className="flex-row items-center p-[14px] rounded-xl border"
                  style={[
                    { backgroundColor: isSelected ? colors.selectedBg : colors.optionBg },
                    { borderColor: isSelected ? colors.selectedBorder : colors.border },
                    { borderLeftWidth: isSelected ? 4 : 1, borderLeftColor: isSelected ? colors.selectedBorder : 'transparent' },
                  ]}
                  onPress={() => handleSelect(choice.personalQuizChoiceID)}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-[22px] h-[22px] rounded-full border-2 justify-center items-center mr-3"
                    style={[
                      { borderColor: isSelected ? colors.selectedBorder : colors.textSecondary },
                      isSelected && { backgroundColor: colors.selectedBorder, borderColor: colors.selectedBorder },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text
                    className="flex-1 text-[15px] leading-[22px]"
                    style={[{ color: colors.text }, isSelected && { fontWeight: '600' }]}
                  >
                    {String.fromCharCode(65 + idx)}. {choice.choiceText}
                  </Text>
                  {choice.image && (
                    <TouchableOpacity onPress={() => setImageModalUrl(choice.image!)} activeOpacity={0.8}>
                      <Text className="text-xs font-medium" style={{ color: colors.orange }}>View image</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        className="flex-row justify-between px-4 py-3 border-t absolute bottom-0 left-0 right-0"
        style={{
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-row items-center justify-center py-3 px-5 rounded-xl border min-w-[120px] ${currentIndex === 0 ? 'opacity-40' : ''}`}
          style={{ borderColor: colors.border }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text className="text-[15px] font-semibold mx-1.5" style={{ color: colors.text }}>Previous</Text>
        </TouchableOpacity>

        <View className="justify-center">
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            {answeredCount} / {totalQuestions} answered
          </Text>
        </View>

        {currentIndex === totalQuestions - 1 ? (
          <TouchableOpacity
            onPress={handleManualSubmit}
            disabled={submitting}
            className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px]"
            style={{ backgroundColor: colors.orange, opacity: submitting ? 0.7 : 1 }}
            activeOpacity={0.8}
          >
            {submitting ? (
              <CapsActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white text-[15px] font-bold mx-1.5">Submit</Text>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px]"
            style={{ backgroundColor: colors.orange }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-[15px] font-semibold mx-1.5">Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ImageModal />
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
