// ─────────────────────────────────────────────────────────────────────────────
// StudentFilterSheet — bottom sheet for filtering leaderboard by program/subject.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { studentColors } from './studentTokens';

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
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(12,9,42,0.35)' }} onPress={onClose}>
        <Pressable className="bg-white rounded-t-[32px] px-5 pt-3 pb-6" style={{ maxHeight: '80%' }} onPress={(event) => event.stopPropagation()}>
          <View className="self-center w-11 h-1 rounded-full bg-[#E6E2F4] mb-4" />
          <Text className="font-sans text-[#0C092A] text-xl font-medium leading-7 mb-2">Leaderboard Filters</Text>

          <Text className="font-sans text-[#0C092A] text-sm font-bold leading-5 mt-3 mb-2.5">Program</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            <Pressable
              onPress={() => onSelectProgram(null)}
              className={`h-[42px] max-w-[180px] justify-center items-center px-3.5 py-2.5 rounded-[999px] border ${selectedProgramID === null ? 'bg-primary border-primary' : 'bg-white border-[#EFEEFC]'}`}
            >
              <Text className={`font-sans text-[13px] leading-5 ${selectedProgramID === null ? 'text-white font-bold' : 'text-[#858494] font-medium'}`}>
                All Programs
              </Text>
            </Pressable>
            {programs.map((program) => (
              <Pressable
                key={program.programID}
                onPress={() => onSelectProgram(program.programID)}
                className={`h-[42px] max-w-[180px] justify-center items-center px-3.5 py-2.5 rounded-[999px] border ${selectedProgramID === program.programID ? 'bg-primary border-primary' : 'bg-white border-[#EFEEFC]'}`}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className={`font-sans text-[13px] leading-5 ${selectedProgramID === program.programID ? 'text-white font-bold' : 'text-[#858494] font-medium'}`}
                >
                  {program.programName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="font-sans text-[#0C092A] text-sm font-bold leading-5 mt-3 mb-2.5">Subject</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <Pressable
              onPress={() => onSelectSubject(null)}
              className={`rounded-[18px] border px-3.5 py-3 ${selectedSubjectID === null ? 'bg-[#FFF1E9] border-[#FFA258]' : 'bg-white border-[#EFEEFC]'}`}
            >
              <Text className="font-sans text-[#0C092A] text-sm font-medium leading-5">All Subjects</Text>
            </Pressable>
            {subjects.map((subject) => (
              <Pressable
                key={subject.subjectID}
                onPress={() => onSelectSubject(subject.subjectID)}
                className={`rounded-[18px] border px-3.5 py-3 ${selectedSubjectID === subject.subjectID ? 'bg-[#FFF1E9] border-[#FFA258]' : 'bg-white border-[#EFEEFC]'}`}
              >
                <Text numberOfLines={1} className="font-sans text-[#0C092A] text-sm font-medium leading-5">
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? <Text className="font-sans text-[#858494] text-xs font-normal leading-[18px] mt-0.5">{subject.subjectCode}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}