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
import {   View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, Alert, useWindowDimensions } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RenderHtml from 'react-native-render-html';
import apiClient from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import QuestionListModal from '../../../src/components/QuestionListModal';
import { addBookmark, removeBookmark } from '../../../src/services/studentBookmarkService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function PracticeExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      const response = await apiClient.get(`/api/practice-exam/generate/${subjectID}`);
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      } else {
        setError('No questions available for this subject.');
      }
    } catch (err: any) {
      console.error('Failed to fetch exam questions:', err);
      const msg = err.response?.data?.message || 'Failed to load exam questions.';
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
    if (enableTimer && secondsLeft !== null && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setShowTimerModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enableTimer, secondsLeft !== null]);

  // Save answers to AsyncStorage
  useEffect(() => {
    saveState();
  }, [answers, bookmarkedQuestions, secondsLeft]);

  const loadSavedState = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem(`${examKey}_answers`);
      const savedBookmarks = await AsyncStorage.getItem(`${examKey}_bookmarks`);
      const savedTimer = await AsyncStorage.getItem(`${examKey}_timer`);

      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedBookmarks) setBookmarkedQuestions(JSON.parse(savedBookmarks));
      if (enableTimer && savedTimer) {
        const savedSeconds = parseInt(savedTimer);
        if (savedSeconds > 0) setSecondsLeft(savedSeconds);
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
      await AsyncStorage.setItem(`${examKey}_answers`, JSON.stringify(answers));
      await AsyncStorage.setItem(`${examKey}_bookmarks`, JSON.stringify(bookmarkedQuestions));
      if (enableTimer && secondsLeft !== null) {
        await AsyncStorage.setItem(`${examKey}_timer`, secondsLeft.toString());
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
      const response = await apiClient.post('/api/practice-exam/submit', {
        subjectID,
        answers: questions.map((q) => ({
          questionID: q.questionID,
          selectedChoiceID: answers[q.questionID] ? parseInt(answers[q.questionID]) : null,
        })),
      });

      await clearExamData();

      const score = response.data.score;
      const resultId = response.data.resultId;
      router.replace({
        pathname: '/(auth)/practice-exam/results',
        params: {
          earnedPoints: score.earnedPoints,
          totalPoints: score.totalPoints,
          percentage: score.percentage,
          subjectName,
          totalItems: questions.length,
          resultId: resultId ? String(resultId) : '',
          origin: 'home',
        }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.response?.data?.message || 'Failed to submit exam. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#111' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    optionBg: isDark ? '#1f2937' : '#f9fafb',
    selectedBg: isDark ? '#1c1917' : '#fff7ed',
    selectedBorder: '#FE6902',
  };

  const questionTagsStyles = useMemo(() => ({
    p: { color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 8 },
    li: { color: colors.text, fontSize: 15, lineHeight: 22 },
    strong: { color: colors.text, fontWeight: '700' as const },
    u: { textDecorationLine: 'underline' as const },
    a: { color: '#FE6902' },
  }), [colors.text]);

  // Timer Modal
  const TimerModal = () => (
    <Modal visible={showTimerModal} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="rounded-[20px] p-6 items-center" style={{ width: width * 0.85, backgroundColor: colors.card }}>
          <Ionicons name="alarm" size={48} color="#FE6902" style={{ marginBottom: 16 }} />
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
              <Text className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{bookmarkedQuestions.length}</Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Bookmarked</Text>
            </View>
          </View>
          <TouchableOpacity
            className="w-full bg-[#FE6902] py-3.5 rounded-xl items-center"
            style={{ opacity: isSubmitting ? 0.6 : 1 }}
            onPress={() => handleSubmit(true)}
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

  // Image Modal
  const ImageModal = () => (
    <Modal visible={!!imageModalUrl} transparent animationType="fade">
      <TouchableOpacity className="flex-1 bg-black/90 justify-center items-center" activeOpacity={1} onPress={() => setImageModalUrl(null)}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          Image viewer - URL: {imageModalUrl}
        </Text>
        <TouchableOpacity className="absolute top-[50px] right-5" onPress={() => setImageModalUrl(null)}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      {loading || !currentQuestion ? (
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color="#FE6902" />
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
                <View className="bg-amber-100 px-2.5 py-1 rounded-xl">
                  <Text className="text-[#FE6902] text-xs font-semibold">{answeredCount}/{questionCount}</Text>
                </View>
                {enableTimer && (
                  <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl" style={{ backgroundColor: secondsLeft !== null && secondsLeft <= 300 ? '#FEE2E2' : '#FEF3C7' }}>
                    {secondsLeft !== null ? (
                      <>
                        <Ionicons name="time" size={14} color={secondsLeft <= 300 ? '#EF4444' : '#FE6902'} />
                        <Text className="text-xs font-semibold" style={{ color: secondsLeft <= 300 ? '#EF4444' : '#FE6902' }}>
                          {(() => {
                            const t = formatTime(secondsLeft);
                            return `${t.hours}:${t.minutes}:${t.seconds}`;
                          })()}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-xs font-semibold text-[#FE6902]">00:00:00</Text>
                    )}
                  </View>
                )}
                {!enableTimer && (
                  <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100">
                    <Ionicons name="infinite" size={14} color="#10B981" />
                    <Text className="text-emerald-500 text-xs font-semibold">Unlimited</Text>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity className="p-2" onPress={() => setIsQuestionListOpen(true)}>
                <Ionicons name="list" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-1.5 mx-4 mt-2 rounded-[3px]" style={{ backgroundColor: colors.border }}>
            <View className="h-full bg-[#FE6902] rounded-[3px]" style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className="text-xs text-right mx-4 mt-1 mb-2" style={{ color: colors.textSecondary }}>{Math.round(progressPercent)}% Answered</Text>

          {/* Question Content */}
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View className="rounded-2xl p-5" style={{ backgroundColor: colors.card, elevation: 2 }}>
              {/* Question Header */}
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-full bg-[#FE6902] justify-center items-center mr-3">
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
                  <Text className="text-sm font-medium text-[#FE6902]">Tap to view question image</Text>
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
                          <Text className="text-xs font-medium text-[#FE6902]">View image</Text>
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
                className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px] bg-[#FE6902]"
                onPress={() => handleNavigate('next')}
                activeOpacity={0.8}
              >
                <Text className="text-white text-[15px] font-semibold mx-1.5">Next</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 px-5 rounded-xl min-w-[120px] bg-[#FE6902]"
                style={{ opacity: isSubmitting || (!allAnswered && !answers[currentQuestion.questionID]) ? 0.5 : 1 }}
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
          <TimerModal />
          <ImageModal />
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
