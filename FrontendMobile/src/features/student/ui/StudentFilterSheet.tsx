// ─────────────────────────────────────────────────────────────────────────────
// StudentFilterSheet — bottom sheet for filtering leaderboard by program/subject.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStudentColors } from './studentTokens';

export type StudentFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  programs: Array<{ programID: number; programName: string }>;
  subjects: Array<{ subjectID: number; subjectName: string; subjectCode?: string }>;
  selectedProgramID: number | null;
  selectedSubjectID: number | null;
  onSelectProgram: (programID: number | null) => void;
  onSelectSubject: (subjectID: number | null) => void;
};

export function StudentFilterSheet({
  visible,
  onClose,
  programs,
  subjects,
  selectedProgramID,
  selectedSubjectID,
  onSelectProgram,
  onSelectSubject,
}: StudentFilterSheetProps) {
  const { theme } = useTheme();
  const colors = getStudentColors(theme === 'dark');

  const pillStyle = (selected: boolean) => ({
    backgroundColor: selected ? colors.orange : colors.card,
    borderColor: selected ? colors.orange : colors.border,
  });
  const subjectStyle = (selected: boolean) => ({
    backgroundColor: selected ? colors.statsCard : colors.card,
    borderColor: selected ? colors.orangeSoft : colors.border,
  });

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }} onPress={onClose}>
        <Pressable
          className="rounded-t-[32px] px-5 pt-3 pb-6"
          style={{ maxHeight: '80%', backgroundColor: colors.card }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="self-center w-11 h-1 rounded-full mb-4" style={{ backgroundColor: colors.border }} />
          <Text className="font-sans text-xl font-medium leading-7 mb-2" style={{ color: colors.text }}>Leaderboard Filters</Text>

          <Text className="font-sans text-sm font-bold leading-5 mt-3 mb-2.5" style={{ color: colors.text }}>Program</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            <Pressable
              onPress={() => onSelectProgram(null)}
              className="h-[42px] max-w-[180px] justify-center items-center px-3.5 py-2.5 rounded-[999px] border"
              style={pillStyle(selectedProgramID === null)}
            >
              <Text
                className={`font-sans text-[13px] leading-5 ${selectedProgramID === null ? 'font-bold' : 'font-medium'}`}
                style={{ color: selectedProgramID === null ? '#FFFFFF' : colors.textSoft }}
              >
                All Programs
              </Text>
            </Pressable>
            {programs.map((program) => (
              <Pressable
                key={program.programID}
                onPress={() => onSelectProgram(program.programID)}
                className="h-[42px] max-w-[180px] justify-center items-center px-3.5 py-2.5 rounded-[999px] border"
                style={pillStyle(selectedProgramID === program.programID)}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className={`font-sans text-[13px] leading-5 ${selectedProgramID === program.programID ? 'font-bold' : 'font-medium'}`}
                  style={{ color: selectedProgramID === program.programID ? '#FFFFFF' : colors.textSoft }}
                >
                  {program.programName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="font-sans text-sm font-bold leading-5 mt-3 mb-2.5" style={{ color: colors.text }}>Subject</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <Pressable
              onPress={() => onSelectSubject(null)}
              className="rounded-[18px] border px-3.5 py-3"
              style={subjectStyle(selectedSubjectID === null)}
            >
              <Text className="font-sans text-sm font-medium leading-5" style={{ color: colors.text }}>All Subjects</Text>
            </Pressable>
            {subjects.map((subject) => (
              <Pressable
                key={subject.subjectID}
                onPress={() => onSelectSubject(subject.subjectID)}
                className="rounded-[18px] border px-3.5 py-3"
                style={subjectStyle(selectedSubjectID === subject.subjectID)}
              >
                <Text numberOfLines={1} className="font-sans text-sm font-medium leading-5" style={{ color: colors.text }}>
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? <Text className="font-sans text-xs font-normal leading-[18px] mt-0.5" style={{ color: colors.textSoft }}>{subject.subjectCode}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
