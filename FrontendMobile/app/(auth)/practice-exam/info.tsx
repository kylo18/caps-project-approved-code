// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Pre-exam information screen that displays exam details (total items,
//          total points, duration) and instructions before the student begins.
// Key sections:
//   - Reads exam config params (subjectID, totalItems, totalPoints, timer, duration)
//   - formatDuration: converts minutes into human-readable hours/minutes string
//   - instructions: dynamic list of rules shown to the student
//   - UI: header with back button, exam details card, instructions card,
//         "Back to Subjects" and "Start Exam" action buttons
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PracticeExamInfo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const subjectID = params.subjectID as string;
  const subjectName = params.subjectName as string;
  const totalItems = parseInt(params.totalItems as string) || 0;
  const totalPoints = parseInt(params.totalPoints as string) || 0;
  const enableTimer = params.enableTimer === 'true';
  const durationMinutes = parseInt(params.durationMinutes as string) || 0;

  const handleStartExam = () => {
    router.push({
      pathname: '/(auth)/practice-exam/take',
      params: { subjectID, subjectName, totalItems, totalPoints, enableTimer: String(enableTimer), durationMinutes: String(durationMinutes) }
    });
  };

  const colors = {
    bg: isDark ? '#000' : '#f9fafb',
    card: isDark ? '#111' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    sectionBg: isDark ? '#1f2937' : '#f9fafb',
  };

  const formatDuration = () => {
    if (!enableTimer) return 'No time limit';
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const instructions = [
    'Make sure to answer all questions before submitting',
    'Progress will not be saved if you exit',
    enableTimer ? `You have ${formatDuration()} to complete this exam` : 'There is no time limit for this exam',
    'You can bookmark questions to review them later',
    'Use the navigation buttons to move between questions',
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6" style={{ paddingTop: insets.top + 8 }}>
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Exam Information</Text>
        </View>

        {/* Exam Details Card */}
        <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full justify-center items-center" style={{ backgroundColor: '#FEF3C7' }}>
              <Ionicons name="book" size={32} color="#FE6902" />
            </View>
          </View>

          <Text className="text-xl font-bold text-center mb-4" style={{ color: colors.text }}>{subjectName || 'Practice Exam'}</Text>

          {/* Exam Details Grid */}
          <View className="rounded-xl p-4" style={{ backgroundColor: colors.sectionBg }}>
            <View className="flex-row items-center py-2">
              <Ionicons name="help-circle" size={20} color="#FE6902" />
              <View className="ml-3 flex-1">
                <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Total Items</Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{totalItems}</Text>
              </View>
            </View>

            <View className="h-px my-2" style={{ backgroundColor: '#e5e7eb' }} />

            <View className="flex-row items-center py-2">
              <Ionicons name="star" size={20} color="#FE6902" />
              <View className="ml-3 flex-1">
                <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Total Points</Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{totalPoints}</Text>
              </View>
            </View>

            <View className="h-px my-2" style={{ backgroundColor: '#e5e7eb' }} />

            <View className="flex-row items-center py-2">
              <Ionicons name="time" size={20} color="#FE6902" />
              <View className="ml-3 flex-1">
                <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Duration</Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{formatDuration()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions Card */}
        <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="information-circle" size={24} color="#FE6902" />
            <Text className="text-lg font-bold ml-2.5" style={{ color: colors.text }}>Instructions</Text>
          </View>

          <View className="gap-3">
            {instructions.map((instruction, index) => (
              <View key={index} className="flex-row items-start">
                <View className="w-6 h-6 rounded-full justify-center items-center mr-3 mt-0.5" style={{ backgroundColor: '#FE6902' }}>
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-sm leading-5" style={{ color: colors.textSecondary }}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View className="mt-2 gap-3">
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center border"
            style={{ borderColor: colors.border }}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold" style={{ color: colors.text }}>Back to Subjects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#FE6902] py-3.5 rounded-xl items-center flex-row justify-center"
            style={{ elevation: 4 }}
            onPress={handleStartExam}
            activeOpacity={0.9}
          >
            <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white text-base font-bold">Start Exam</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
