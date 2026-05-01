// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Bottom sheet filter modal for leaderboard — program + subject.
// ─────────────────────────────────────────────────────────────────────────────

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { studentColors } from '../studentTheme';

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
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Leaderboard Filters</Text>

          <Text style={[styles.sheetSectionTitle, { marginTop: 4 }]}>Program</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sheetChipRow}
          >
            <Pressable
              onPress={() => onSelectProgram(null)}
              style={[
                styles.sheetChip,
                selectedProgramID === null ? styles.sheetChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.sheetChipText,
                  selectedProgramID === null ? styles.sheetChipTextActive : null,
                ]}
              >
                All Programs
              </Text>
            </Pressable>
            {programs.map((program) => (
              <Pressable
                key={program.programID}
                onPress={() => onSelectProgram(program.programID)}
                style={[
                  styles.sheetChip,
                  selectedProgramID === program.programID
                    ? styles.sheetChipActive
                    : null,
                ]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.sheetChipText,
                    selectedProgramID === program.programID
                      ? styles.sheetChipTextActive
                      : null,
                  ]}
                >
                  {program.programName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sheetSectionTitle}>Subject</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetSubjectList}
          >
            <Pressable
              onPress={() => onSelectSubject(null)}
              style={[
                styles.sheetListItem,
                selectedSubjectID === null ? styles.sheetListItemActive : null,
              ]}
            >
              <Text style={styles.sheetListTitle}>All Subjects</Text>
            </Pressable>
            {subjects.map((subject) => (
              <Pressable
                key={subject.subjectID}
                onPress={() => onSelectSubject(subject.subjectID)}
                style={[
                  styles.sheetListItem,
                  selectedSubjectID === subject.subjectID
                    ? styles.sheetListItemActive
                    : null,
                ]}
              >
                <Text numberOfLines={1} style={styles.sheetListTitle}>
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? (
                  <Text style={styles.sheetListSubtitle}>{subject.subjectCode}</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,9,42,0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E6E2F4',
    marginBottom: 16,
  },
  sheetTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    marginBottom: 8,
  },
  sheetSectionTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10,
    marginTop: 12,
  },
  sheetChipRow: {
    gap: 10,
    paddingBottom: 4,
  },
  sheetChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 180,
  },
  sheetChipActive: {
    backgroundColor: studentColors.orange,
    borderColor: studentColors.orange,
  },
  sheetChipText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  sheetChipTextActive: {
    color: studentColors.white,
    fontWeight: '700',
  },
  sheetSubjectList: {
    gap: 10,
    paddingBottom: 20,
  },
  sheetListItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetListItemActive: {
    backgroundColor: studentColors.surfaceSoft,
    borderColor: studentColors.orangeSoft,
  },
  sheetListTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  sheetListSubtitle: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
});