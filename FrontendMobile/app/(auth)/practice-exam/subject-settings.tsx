// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Settings screen for configuring practice exam options per subject.
//          Allows toggling the qualifying exam on/off, enabling/disabling the
//          timer, and setting the exam duration in minutes.
// Key sections:
//   - State: examEnabled, practiceSettings, timerEnabled, durationMinutes
//   - fetchSettings: loads exam question status and practice settings from API
//   - handleToggleExam: enables/disables exam questions for the subject
//   - handleSavePractice: saves timer preference and duration to the API
//   - UI: header, "Qualifying Exam" toggle section, "Practice Exam Settings"
//         section (timer switch + duration input), save button
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

export default function SubjectSettingsDean() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const subjectID = params.subjectID;

  const [examEnabled, setExamEnabled] = useState(false);
  const [practiceSettings, setPracticeSettings] = useState(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [examStatus, practice] = await Promise.all([
        apiRequest(`/api/subjects/${subjectID}/exam-questions-status`),
        apiRequest(`/api/practice-settings/${subjectID}`),
      ]);
      setExamEnabled(examStatus?.enabled || false);
      setPracticeSettings(practice?.data || practice);
      setTimerEnabled(practice?.data?.enableTimer || false);
      setDurationMinutes(String(practice?.data?.durationMinutes || 60));
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExam = async (value: boolean) => {
    setExamEnabled(value);
    try {
      const endpoint = value ? `/api/subjects/${subjectID}/enable-exam-questions` : `/api/subjects/${subjectID}/disable-exam-questions`;
      await apiRequest(endpoint, { method: 'PATCH' });
      showToast(value ? 'Exam questions enabled' : 'Exam questions disabled', 'success');
    } catch (error) {
      showToast('Failed to update exam settings', 'error');
    }
  };

  const handleSavePractice = async () => {
    setIsSaving(true);
    try {
      await apiRequest('/api/practice-settings', {
        method: 'POST',
        body: {
          subjectID,
          enableTimer: timerEnabled,
          durationMinutes: parseInt(durationMinutes) || 60,
        },
      });
      showToast('Practice settings saved', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    inputBg: isDark ? '#111827' : '#fff',
    orange: '#FE6902',
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>Subject Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <View className="flex-row items-center py-3 gap-3">
            <View style={{ flex: 1 }}>
              <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>Qualifying Exam</Text>
              <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Enable exam questions for this subject</Text>
            </View>
            <Switch value={examEnabled} onValueChange={handleToggleExam} trackColor={{ true: colors.orange }} />
          </View>
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card, elevation: 2 }}>
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>Practice Exam Settings</Text>

          <View className="flex-row items-center py-3 gap-3">
            <View style={{ flex: 1 }}>
              <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>Enable Timer</Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Set time limit for practice exams</Text>
            </View>
            <Switch value={timerEnabled} onValueChange={setTimerEnabled} trackColor={{ true: colors.orange }} />
          </View>

          {timerEnabled && (
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>Duration (minutes)</Text>
              <TextInput
                className="w-20 border rounded-lg p-2 text-base text-center"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <TouchableOpacity className="bg-[#FE6902] py-3 rounded-xl items-center mt-2" style={{ opacity: isSaving ? 0.6 : 1 }} onPress={handleSavePractice} disabled={isSaving} activeOpacity={0.8}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-bold">Save Settings</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
