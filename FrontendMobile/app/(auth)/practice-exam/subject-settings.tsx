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
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
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

  const handleToggleExam = async (value) => {
    setExamEnabled(value);
    try {
      const endpoint = value ? `/api/subjects/${subjectID}/enable-exam-questions` : `/api/subjects/${subjectID}/disable-exam-questions`;
      await apiRequest(endpoint, { method: 'POST' });
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
    return <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subject Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Qualifying Exam</Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Enable exam questions for this subject</Text>
            </View>
            <Switch value={examEnabled} onValueChange={handleToggleExam} trackColor={{ true: colors.orange }} />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Practice Exam Settings</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Enable Timer</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Set time limit for practice exams</Text>
            </View>
            <Switch value={timerEnabled} onValueChange={setTimerEnabled} trackColor={{ true: colors.orange }} />
          </View>

          {timerEnabled && (
            <View style={styles.durationRow}>
              <Text style={[styles.durationLabel, { color: colors.text }]}>Duration (minutes)</Text>
              <TextInput
                style={[styles.durationInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]} onPress={handleSavePractice} disabled={isSaving} activeOpacity={0.8}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 },
  section: { borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionDesc: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 12, marginTop: 2 },
  durationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  durationLabel: { fontSize: 14, fontWeight: '600' },
  durationInput: { width: 80, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 16, textAlign: 'center' },
  saveBtn: { backgroundColor: '#FE6902', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
