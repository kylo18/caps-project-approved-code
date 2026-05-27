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
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
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
  const [settingsMessage, setSettingsMessage] = useState('');

  const applyPracticeSettings = (practice: any) => {
    const payload = practice?.data || practice || {};
    const nextDuration = payload?.durationMinutes ?? payload?.duration_minutes ?? 60;
    const nextTimerEnabled = payload?.enableTimer ?? payload?.isEnabled ?? Number(nextDuration) > 0;

    setPracticeSettings(payload);
    setTimerEnabled(Boolean(nextTimerEnabled));
    setDurationMinutes(String(nextDuration || 60));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setSettingsMessage('');
    try {
      const [examStatus, practice] = await Promise.allSettled([
        apiRequest(`/api/subjects/${subjectID}/exam-questions-status`),
        apiRequest(`/api/practice-settings/${subjectID}`),
      ]);

      if (examStatus.status === 'fulfilled') {
        const examPayload = examStatus.value?.data || examStatus.value || {};
        setExamEnabled(Boolean(examPayload?.is_enabled_for_exam_questions ?? examPayload?.enabled));
      } else {
        console.error('Failed to load exam question status:', examStatus.reason);
        setExamEnabled(false);
      }

      if (practice.status === 'fulfilled') {
        applyPracticeSettings(practice.value);
      } else {
        const message = String(practice.reason?.message || '');
        const isMissingSettings = message.toLowerCase().includes('practice exam setting not found');
        applyPracticeSettings(null);
        setSettingsMessage(
          isMissingSettings
            ? 'No settings available yet. Default values are shown below.'
            : 'Unable to load saved practice settings. Default values are shown below.'
        );
        if (!isMissingSettings) {
          console.error('Failed to load practice settings:', practice.reason);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      applyPracticeSettings(null);
      setSettingsMessage('Unable to load saved practice settings. Default values are shown below.');
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
    bg: isDark ? '#0F0F0F' : '#f3f4f6',
    card: isDark ? '#1A1A1A' : '#fff',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6b7280',
    border: isDark ? '#2A2A2A' : '#e5e7eb',
    inputBg: isDark ? '#242424' : '#fff',
    orange: '#FE6902',
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}><CapsActivityIndicator size="large" color={colors.orange} /></View>;
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
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

          {settingsMessage ? (
            <View className="rounded-xl px-3 py-3 mt-3 mb-1" style={{ backgroundColor: `${colors.orange}12`, borderWidth: 1, borderColor: `${colors.orange}33` }}>
              <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>{settingsMessage}</Text>
            </View>
          ) : null}

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
            {isSaving ? <CapsActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-bold">Save Settings</Text>}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
