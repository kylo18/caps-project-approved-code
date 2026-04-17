import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiRequest } from '../../../src/services/apiClient';
import { studentColors } from '../../../src/student/ui';

interface Choice {
  choiceID: string;
  choiceText: string;
  choiceImage: string | null;
  isCorrect: boolean;
}

interface MistakenQuestion {
  questionID: string;
  questionText: string;
  questionImage: string | null;
  subjectID: string;
  subjectName: string;
  wrong_count: number;
  consecutive_wrong_count: number;
  choices: Choice[];
}

export default function FrequentlyMistakenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<MistakenQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMistaken();
  }, []);

  const fetchMistaken = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest('/api/student/analytics/frequently-mistaken');
      if (res?.data) {
        setQuestions(res.data);
      } else {
        setQuestions([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load frequently mistaken questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: studentColors.orange }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">
              Frequently Mistaken
            </Text>
            <Text className="text-sm text-white/80">
              Questions you've missed 3+ times in a row
            </Text>
          </View>
        </View>
      </View>

      {/* White sheet */}
      <View
        className="flex-1 rounded-t-[32px] bg-white px-5 pt-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={studentColors.orange} />
            <Text className="mt-4 text-base text-gray-400">Loading...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="mt-3 text-center text-base text-gray-600">{error}</Text>
            <Pressable
              onPress={fetchMistaken}
              className="mt-4 rounded-full px-6 py-3"
              style={{ backgroundColor: studentColors.orange }}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : questions.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="checkmark-circle-outline" size={56} color={studentColors.success} />
            <Text className="mt-4 text-center text-lg font-semibold text-gray-800">
              Great Job!
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-400">
              You don't have any frequently mistaken questions. Keep it up!
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-sm text-gray-400">
              {questions.length} question{questions.length !== 1 ? 's' : ''} to review
            </Text>
            {questions.map((q) => {
              const isExpanded = expandedId === q.questionID;
              return (
                <Pressable
                  key={q.questionID}
                  onPress={() =>
                    setExpandedId(isExpanded ? null : q.questionID)
                  }
                  className="mb-3 rounded-2xl border p-4"
                  style={{ borderColor: studentColors.border }}
                >
                  {/* Question header */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-sm font-semibold text-gray-800"
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {q.questionText || 'Question'}
                      </Text>
                      <View className="mt-2 flex-row items-center gap-2">
                        <View
                          className="self-start rounded-full px-2.5 py-1"
                          style={{ backgroundColor: studentColors.surface }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: studentColors.orange }}
                          >
                            {q.subjectName || 'Unknown'}
                          </Text>
                        </View>
                        <View
                          className="rounded-full px-2.5 py-1"
                          style={{ backgroundColor: studentColors.pink }}
                        >
                          <Text className="text-xs font-medium text-red-500">
                            {q.consecutive_wrong_count}x wrong streak
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={studentColors.textSoft}
                    />
                  </View>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View className="mt-4 border-t pt-4" style={{ borderColor: studentColors.border }}>
                      <Text className="mb-2 text-xs font-medium text-gray-400 uppercase">
                        Choices
                      </Text>
                      {q.choices.map((c) => (
                        <View
                          key={c.choiceID}
                          className="mb-2 flex-row items-center rounded-xl p-3"
                          style={{
                            backgroundColor: c.isCorrect
                              ? 'rgba(134,210,168,0.15)'
                              : studentColors.pale,
                            borderWidth: c.isCorrect ? 1 : 0,
                            borderColor: c.isCorrect ? studentColors.success : 'transparent',
                          }}
                        >
                          <Ionicons
                            name={c.isCorrect ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={c.isCorrect ? studentColors.success : studentColors.textSoft}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            className="flex-1 text-sm"
                            style={{
                              color: c.isCorrect ? '#065f46' : studentColors.text,
                              fontWeight: c.isCorrect ? '600' : '400',
                            }}
                          >
                            {c.choiceText}
                          </Text>
                        </View>
                      ))}
                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-xs text-gray-400">
                          Total wrong attempts: {q.wrong_count}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          Current streak: {q.consecutive_wrong_count}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
