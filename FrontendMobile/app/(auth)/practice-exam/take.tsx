// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Main practice exam screen where students answer questions one at a
//          time. Handles question display, answer selection, bookmarking,
//          optional countdown timer, and exam submission.
// Key sections:
//   - State: current question index, answers, bookmarks, timer, loading/error
//   - fetchExamQuestions: fetches exam questions from the API on mount
//   - loadSavedState / saveState: persists answers, bookmarks, and timer to AsyncStorage
//   - Timer logic: countdown interval with time-is-up modal when expired
//   - handleSelectAnswer / handleClearAnswer: manage answer state per question
//   - handleToggleBookmark: add/remove question from bookmarks
//   - handleNavigate: previous/next question navigation
//   - handleSubmit: POSTs answers to the API, clears saved state, navigates to results
//   - TimerModal: summary modal (answered/unanswered/bookmarked counts + submit button)
//   - ImageModal: full-screen overlay for question/choice images
//   - UI: header (subject name, progress badge, timer), progress bar, question card
//         with choices, navigation footer (Previous/Next/Submit), error banner
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, Alert, useWindowDimensions, Image } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RenderHtml from 'react-native-render-html';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import QuestionListModal from '../../../src/features/practice/components/QuestionListModal';
import { addBookmark, removeBookmark } from '../../../src/services/studentBookmarkService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';
import ConfirmModal from '../../../src/features/core/components/ConfirmModal';

const { width, height } = Dimensions.get('window');

// ── TimerModalProps for the module-scope TimerModal ──
interface TimerModalProps {
  visible: boolean;
  secondsLeft: number | null;
  answeredCount: number;
  questionCount: number;
  bookmarkedCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onGoToUnanswered: () => void;
  colors: {
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    orange: string;
  };
  shadow: object;
}

// ── Module-scope TimerModal: defined ONCE, not recreated on every render ──
const TimerModal = ({ visible, secondsLeft, answeredCount, questionCount, bookmarkedCount, isSubmitting, onSubmit, onGoToUnanswered, colors, shadow }: TimerModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 bg-black/50 justify-center items-center">
      <View className="rounded-[20px] p-6 items-center border" style={{ width: width * 0.85, backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
        <Ionicons name="alarm" size={48} color={colors.orange} style={{ marginBottom: 16 }} />
        <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
          {secondsLeft === 0 ? 'Time is Up!' : 'Submit Exam?'}
        </Text>
        <Text className="text-sm text-center mb-5" style={{ color: colors.textSecondary }}>
          You have answered {answeredCount} of {questionCount} questions.
        </Text>
        <View className="flex-row w-full justify-around mb-6">
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{answeredCount}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Answered</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{questionCount - answeredCount}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Unanswered</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{bookmarkedCount}</Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Bookmarked</Text>
          </View>
        </View>

        {/* Go back to first unanswered question */}
        {questionCount - answeredCount > 0 && (
          <TouchableOpacity
            className="w-full py-3 rounded-xl items-center border mb-3"
            style={{ borderColor: '#EF4444', backgroundColor: 'transparent' }}
            onPress={onGoToUnanswered}
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold" style={{ color: '#EF4444' }}>
              Go to Unanswered ({questionCount - answeredCount})
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="w-full py-3.5 rounded-xl items-center"
          style={{ backgroundColor: colors.orange, opacity: isSubmitting ? 0.6 : 1 }}
          onPress={onSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <CapsActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Submit Exam</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function PracticeExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const themeColors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const subjectID = params.subjectID as string;
  const subjectName = params.subjectName as string;
  const totalItems = parseInt(params.totalItems as string) || 0;
  const totalPoints = parseInt(params.totalPoints as string) || 0;
  const enableTimer = params.enableTimer === 'true';
  const durationMinutes = parseInt(params.durationMinutes as string) || 0;

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(enableTimer ? durationMinutes * 60 : null);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const origin = (params.origin as string) || 'home';

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerActiveRef = useRef(false); // prevents duplicate timer intervals
  const examKey = `exam_${subjectID}`;

  // Fetch exam questions from API
  useEffect(() => {
    fetchExamQuestions();
  }, []);

  // Sync global bookmarks after questions load
  useEffect(() => {
    if (questions.length > 0) {
      syncGlobalBookmarks();
    }
  }, [questions.length]);

  const fetchExamQuestions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/practice-exam/generate/${subjectID}`);
      if (data && data.questions) {
        setQuestions(data.questions);
        if (data.attempt_id) {
          setAttemptId(String(data.attempt_id));
          // Wrap with timestamp so cleanupOrphanedExamKeys() can evict stale entries
          await AsyncStorage.setItem(`${examKey}_attempt_id`, JSON.stringify({ data: String(data.attempt_id), timestamp: Date.now() }));
        }
      } else {
        setError('No questions available for this subject.');
      }
    } catch (err: any) {
      console.error('Failed to fetch exam questions:', err);
      const msg = err.data?.message || 'Failed to load exam questions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load saved state from AsyncStorage
  useEffect(() => {
    loadSavedState();
  }, []);

  // Timer
  useEffect(() => {
    if (!enableTimer || secondsLeft === null || secondsLeft <= 0) return;
    if (timerActiveRef.current) return; // prevent duplicate intervals (Fast Refresh safe)
    timerActiveRef.current = true;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          timerActiveRef.current = false;
          setShowTimerModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerActiveRef.current = false;
    };
  }, [enableTimer]);

  // Save answers to AsyncStorage (debounced: fires on answer/bookmark change, not every timer tick)
  useEffect(() => {
    saveState();
  }, [answers, bookmarkedQuestions]);

  // Periodic autosave: ensures we don't lose progress if the app crashes mid-exam
  // (answers save on every change via the effect above; this covers cases where the
  //  user never changes answers but the app is killed)
  useEffect(() => {
    const interval = setInterval(() => saveState(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Fire-and-forget save when student submits or exits
  useEffect(() => {
    return () => {
      AsyncStorage.setItem(`${examKey}_answers`, JSON.stringify({ data: answers, timestamp: Date.now() }));
      AsyncStorage.setItem(`${examKey}_bookmarks`, JSON.stringify({ data: bookmarkedQuestions, timestamp: Date.now() }));
    };
  }, []);

  const loadSavedState = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem(`${examKey}_answers`);
      const savedBookmarks = await AsyncStorage.getItem(`${examKey}_bookmarks`);
      const savedTimer = await AsyncStorage.getItem(`${examKey}_timer`);
      const savedAttemptId = await AsyncStorage.getItem(`${examKey}_attempt_id`);

      // Support both old flat format and new { data, timestamp } format
      const unwrap = <T,>(raw: string | null): T | null => {
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          // New wrapped format
          if (parsed && typeof parsed === 'object' && 'data' in parsed) {
            return parsed.data as T;
          }
          // Legacy flat format
          return parsed as T;
        } catch {
          return null;
        }
      };

      const answers_ = unwrap<Record<string, string>>(savedAnswers);
      const bookmarks_ = unwrap<string[]>(savedBookmarks);
      const timer_ = unwrap<string>(savedTimer);

      if (answers_) setAnswers(answers_);
      if (bookmarks_) setBookmarkedQuestions(bookmarks_);
      if (savedAttemptId) {
        try {
          const parsed = JSON.parse(savedAttemptId);
          setAttemptId(parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : savedAttemptId);
        } catch {
          setAttemptId(savedAttemptId);
        }
      }
      if (enableTimer && timer_) {
        const savedSeconds = parseInt(timer_);
        if (!isNaN(savedSeconds) && savedSeconds > 0) setSecondsLeft(savedSeconds);
      }
    } catch (error) {
      console.error('Failed to load exam state:', error);
    }
  };

  // Sync per-exam bookmarks with global bookmarks when questions load
  const syncGlobalBookmarks = async () => {
    try {
      const { getBookmarks } = await import('../../../src/services/studentBookmarkService');
      const globalBookmarks = await getBookmarks();
      const globalIds = globalBookmarks.map((b) => String(b.questionID));
      setBookmarkedQuestions((prev) => {
        const merged = Array.from(new Set([...prev, ...globalIds]));
        return merged;
      });
    } catch (error) {
      console.error('Failed to sync global bookmarks:', error);
    }
  };

  const saveState = async () => {
    try {
      // Wrap in { data, timestamp } so cleanupOrphanedExamKeys() can detect stale keys
      await AsyncStorage.setItem(`${examKey}_answers`, JSON.stringify({ data: answers, timestamp: Date.now() }));
      await AsyncStorage.setItem(`${examKey}_bookmarks`, JSON.stringify({ data: bookmarkedQuestions, timestamp: Date.now() }));
      if (enableTimer && secondsLeft !== null) {
        await AsyncStorage.setItem(`${examKey}_timer`, JSON.stringify({ data: secondsLeft.toString(), timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Failed to save exam state:', error);
    }
  };

  const clearExamData = async () => {
    try {
      await AsyncStorage.removeItem(`${examKey}_answers`);
      await AsyncStorage.removeItem(`${examKey}_bookmarks`);
      await AsyncStorage.removeItem(`${examKey}_timer`);
      await AsyncStorage.removeItem(`${examKey}_attempt_id`);
      // NOTE: global bookmarks (student_bookmarks) are intentionally NOT cleared
      // so students can review them later.
    } catch (error) {
      console.error('Failed to clear exam data:', error);
    }
  };

  // Use fetched questions; fall back to empty array while loading
  const currentQuestion = questions[currentQuestionIndex];
  const questionCount = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questionCount - 1;
  const allAnswered = answeredCount === questionCount;

  // Handlers
  const handleSelectAnswer = (choiceID: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.questionID]: choiceID }));
    setError('');
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.questionID];
      return newAnswers;
    });
  };

  const handleToggleBookmark = async (questionID: string) => {
    const isAdding = !bookmarkedQuestions.includes(questionID);
    setBookmarkedQuestions((prev) =>
      prev.includes(questionID) ? prev.filter((id) => id !== questionID) : [...prev, questionID]
    );

    // Sync to global bookmarks
    try {
      if (isAdding) {
        const question = questions.find((q) => String(q.questionID) === questionID);
        if (question) {
          await addBookmark({
            questionID: String(question.questionID),
            questionText: question.questionText || '',
            questionImage: question.questionImage || null,
            subjectID: question.subjectID ? Number(question.subjectID) : (subjectID ? Number(subjectID) : 0),
            subjectName: question.subjectName || subjectName || null,
            origin: question.subjectName || subjectName || 'Practice Exam',
            choices: Array.isArray(question.choices)
              ? question.choices.map((choice: any) => ({
                choiceID: String(choice.choiceID),
                choiceText: choice.choiceText || '',
                choiceImage: choice.choiceImage || null,
                isCorrect: Boolean(choice.isCorrect),
              }))
              : [],
          });
        }
      } else {
        await removeBookmark(questionID);
      }
    } catch (error) {
      console.error('Failed to sync bookmark:', error);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (direction === 'next' && currentQuestionIndex < totalItems - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (bypassCheck = false) => {
    if (!bypassCheck && isLastQuestion && !answers[currentQuestion.questionID]) {
      setError('Please answer the final question before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest('/api/practice-exam/submit', {
        method: 'POST',
        body: {
          attempt_id: attemptId ? parseInt(attemptId) : null,
          subjectID,
          answers: questions.map((q) => ({
            questionID: q.questionID,
            selectedChoiceID: answers[q.questionID] ? parseInt(answers[q.questionID]) : null,
          })),
        },
      });

      await clearExamData();

      const score = data.score;
      const resultId = data.resultId;
      router.replace({
        pathname: '/(auth)/practice-exam/results',
        params: {
          earnedPoints: score.earnedPoints,
          totalPoints: score.totalPoints,
          percentage: score.percentage,
          subjectName,
          totalItems: questions.length,
          resultId: resultId ? String(resultId) : '',
          origin: origin,
        }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.data?.message || 'Failed to submit exam. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to the first unanswered question and close the modal
  const handleGoToUnanswered = () => {
    const firstUnansweredIndex = questions.findIndex(
      (q) => !answers[q.questionID]
    );
    if (firstUnansweredIndex !== -1) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    }
    setShowTimerModal(false);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
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
  }), [colors.text]);

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
              style={{ width: width - 40, height: height * 0.6 }}
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      {loading || !currentQuestion ? (
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color={colors.orange} />
          <Text className="text-base mt-4" style={{ color: colors.text }}>
            {loading ? 'Loading exam questions...' : 'No questions available.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }}>
            <View className="flex-1">
              <Text className="text-base font-bold mb-1.5" style={{ color: colors.text }} numberOfLines={1}>{subjectName}</Text>
              <View className="flex-row gap-2">
                <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: themeColors.orangeSoft }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.orange }}>{answeredCount}/{questionCount}</Text>
                </View>
                {enableTimer && (
                  <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl" style={{ backgroundColor: secondsLeft !== null && secondsLeft <= 300 ? (isDark ? '#351316' : '#FEE2E2') : themeColors.orangeSoft }}>
                    {secondsLeft !== null ? (
                      <>
                        <Ionicons name="time" size={14} color={secondsLeft <= 300 ? '#EF4444' : colors.orange} />
                        <Text className="text-xs font-semibold" style={{ color: secondsLeft <= 300 ? '#EF4444' : colors.orange }}>
                          {(() => {
                            const t = formatTime(secondsLeft);
                            return `${t.hours}:${t.minutes}:${t.seconds}`;
                          })()}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-xs font-semibold" style={{ color: colors.orange }}>00:00:00</Text>
                    )}
                  </View>
                )}
                {!enableTimer && (
                  <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : '#D1FAE5' }}>
                    <Ionicons name="infinite" size={14} color="#10B981" />
                    <Text className="text-emerald-500 text-xs font-semibold">Unlimited</Text>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity className="p-2" onPress={() => setIsQuestionListOpen(true)}>
                <Ionicons name="list" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2" onPress={() => setShowExitModal(true)}>
                <Ionicons name="close" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-1.5 mx-4 mt-2 rounded-[3px]" style={{ backgroundColor: colors.border }}>
            <View className="h-full rounded-[3px]" style={{ width: `${progressPercent}%`, backgroundColor: colors.orange }} />
          </View>
          <Text className="text-xs text-right mx-4 mt-1 mb-2" style={{ color: colors.textSecondary }}>{Math.round(progressPercent)}% Answered</Text>

          {/* Question Content */}
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View className="rounded-2xl p-5 border" style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
              {/* Question Header */}
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-full justify-center items-center mr-3" style={{ backgroundColor: colors.orange }}>
                  <Text className="text-white text-base font-bold">{currentQuestionIndex + 1}</Text>
                </View>
                <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>Question {currentQuestionIndex + 1} of {totalItems}</Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => handleToggleBookmark(String(currentQuestion.questionID))}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={bookmarkedQuestions.includes(String(currentQuestion.questionID)) ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={bookmarkedQuestions.includes(String(currentQuestion.questionID)) ? '#F59E0B' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Question Text */}
              <View className="mb-5">
                <RenderHtml
                  contentWidth={windowWidth - 48}
                  source={{ html: currentQuestion.questionText || '<p></p>' }}
                  tagsStyles={questionTagsStyles}
                />
              </View>

              {/* Question Image */}
              {currentQuestion.questionImage && (
                <TouchableOpacity onPress={() => setImageModalUrl(currentQuestion.questionImage)} activeOpacity={0.8} className="mb-4">
                  <Text className="text-sm font-medium" style={{ color: colors.orange }}>Tap to view question image</Text>
                </TouchableOpacity>
              )}

              {/* Choices */}
              <View className="gap-3">
                {currentQuestion.choices.map((choice: any, idx: number) => {
                  const isSelected = answers[currentQuestion.questionID] === String(choice.choiceID);
                  return (
                    <TouchableOpacity
                      key={choice.choiceID}
                      className="flex-row items-center p-[14px] rounded-xl border"
                      style={[
                        { backgroundColor: isSelected ? colors.selectedBg : colors.optionBg },
                        { borderColor: isSelected ? colors.selectedBorder : colors.border },
                        { borderLeftWidth: isSelected ? 4 : 1, borderLeftColor: isSelected ? colors.selectedBorder : 'transparent' },
                      ]}
                      onPress={() => handleSelectAnswer(String(choice.choiceID))}
                      activeOpacity={0.7}
                    >
                      <View className="w-[22px] h-[22px] rounded-full border-2 justify-center items-center mr-3"
                        style={[
                          { borderColor: isSelected ? colors.selectedBorder : colors.textSecondary },
                          isSelected && { backgroundColor: colors.selectedBorder, borderColor: colors.selectedBorder },
                        ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text className="flex-1 text-[15px] leading-[22px]" style={[{ color: colors.text }, isSelected && { fontWeight: '600' }]}>
                        {String.fromCharCode(65 + idx)}. {choice.choiceText}
                      </Text>
                      {choice.choiceImage && (
                        <TouchableOpacity onPress={() => setImageModalUrl(choice.choiceImage)} activeOpacity={0.8}>
                          <Text className="text-xs font-medium" style={{ color: colors.orange }}>View image</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Clear Answer */}
              {answers[currentQuestion.questionID] && (
                <TouchableOpacity className="flex-row items-center justify-center mt-4 p-2.5" onPress={handleClearAnswer} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text className="text-red-500 text-sm font-semibold">Clear Answer</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Navigation Footer */}
          <View className="flex-row justify-between px-4 py-3 border-t absolute bottom-0 left-0 right-0" style={{ backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }}>
            <TouchableOpacity
              className={`flex-row items-center justify-center py-3 px-5 rounded-xl border min-w-[120px] ${currentQuestionIndex === 0 ? 'opacity-40' : ''}`}
              style={{ borderColor: colors.border }}
              onPress={() => handleNavigate('prev')}
              disabled={currentQuestionIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text className="text-[15px] font-semibold mx-1.5" style={{ color: colors.text }}>Previous</Text>
            </TouchableOpacity>

            {!isLastQuestion ? (
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px]"
                style={{ backgroundColor: colors.orange }}
                onPress={() => handleNavigate('next')}
                activeOpacity={0.8}
              >
                <Text className="text-white text-[15px] font-semibold mx-1.5">Next</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px]"
                style={{ backgroundColor: colors.orange, opacity: isSubmitting || (!allAnswered && !answers[currentQuestion.questionID]) ? 0.5 : 1 }}
                onPress={() => {
                  if (!answers[currentQuestion.questionID]) {
                    setError('Please answer this question before submitting.');
                    return;
                  }
                  setShowTimerModal(true);
                }}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <CapsActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-[15px] font-bold mx-1.5">Submit</Text>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View className="absolute left-4 right-4 bottom-20 bg-red-500 p-3 rounded-xl flex-row items-center">
              <Ionicons name="warning" size={18} color="#fff" />
              <Text className="text-white text-sm flex-1 ml-2">{error}</Text>
            </View>
          )}

          {/* Modals */}
          <TimerModal
            visible={showTimerModal}
            secondsLeft={secondsLeft}
            answeredCount={answeredCount}
            questionCount={questionCount}
            bookmarkedCount={bookmarkedQuestions.length}
            isSubmitting={isSubmitting}
            onSubmit={() => handleSubmit(true)}
            onGoToUnanswered={handleGoToUnanswered}
            colors={colors}
            shadow={shadow}
          />
          <ImageModal />
          <ConfirmModal
            visible={showExitModal}
            title="Exit Practice Exam?"
            message="Are you sure you want to exit?"
            confirmText="Exit"
            cancelText="Cancel"
            onConfirm={async () => {
              await clearExamData();
              setShowExitModal(false);
              router.replace('/(auth)/(student)/dashboard');
            }}
            onCancel={() => setShowExitModal(false)}
          />
          <QuestionListModal
            visible={isQuestionListOpen}
            onClose={() => setIsQuestionListOpen(false)}
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            bookmarkedQuestions={bookmarkedQuestions}
            onQuestionClick={(index) => {
              setCurrentQuestionIndex(index);
              setIsQuestionListOpen(false);
            }}
            onToggleBookmark={handleToggleBookmark}
            isDark={isDark}
          />
        </>
      )}
    </View>
  );
}
