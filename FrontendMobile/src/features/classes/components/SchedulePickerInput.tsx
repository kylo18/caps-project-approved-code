import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SchedulePickerInputProps {
  isDark: boolean;
  colors: any;
  label: string;
  value: string; // "Mon/Wed 08:00 - 10:00" or similar
  onChange: (scheduleStr: string) => void;
  placeholder?: string;
}

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
  { key: 'Sun', label: 'Sun' }
];

const HOURS = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function SchedulePickerInput({
  isDark,
  colors,
  label,
  value,
  onChange,
  placeholder = 'Select schedule'
}: SchedulePickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Picker states
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startHour, setStartHour] = useState('08');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');

  // Parses value (e.g. "Mon/Wed 08:00 - 10:00") to populate picker states
  const parseScheduleString = (str: string) => {
    if (!str) {
      setSelectedDays([]);
      setStartHour('08');
      setStartMin('00');
      setEndHour('10');
      setEndMin('00');
      return;
    }

    // 1. Parse days (look for matching tokens)
    const activeDays = DAYS_OF_WEEK.filter(d => str.includes(d.key)).map(d => d.key);
    setSelectedDays(activeDays);

    // 2. Parse times (looks for HH:MM - HH:MM pattern)
    const timeRegex = /(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/;
    const match = str.match(timeRegex);
    if (match) {
      const sh = match[1];
      const sm = match[2];
      const eh = match[3];
      const em = match[4];

      if (HOURS.includes(sh)) setStartHour(sh);
      if (MINUTES.includes(sm)) setStartMin(sm);
      if (HOURS.includes(eh)) setEndHour(eh);
      if (MINUTES.includes(em)) setEndMin(em);
    }
  };

  const handleOpen = () => {
    parseScheduleString(value);
    setModalVisible(true);
  };

  const toggleDay = (dayKey: string) => {
    setSelectedDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  // Live generated schedule preview string
  const getPreviewString = () => {
    if (selectedDays.length === 0) return 'No days selected';
    const daysStr = selectedDays.join('/');
    return `${daysStr} ${startHour}:${startMin} - ${endHour}:${endMin}`;
  };

  const handleApply = () => {
    if (selectedDays.length === 0) {
      onChange('');
    } else {
      onChange(getPreviewString());
    }
    setModalVisible(false);
  };

  return (
    <View style={{ marginTop: 10 }}>
      <Text className="mb-2 font-semibold" style={{ color: colors.text }}>{label}</Text>

      <View
        className="flex-row items-center border rounded-2xl px-4 py-3"
        style={{ backgroundColor: colors.input, borderColor: colors.border }}
      >
        <TouchableOpacity
          onPress={handleOpen}
          className="flex-1 flex-row items-center justify-between"
        >
          {value ? (
            <Text className="text-base font-medium" style={{ color: colors.text }}>
              {value}
            </Text>
          ) : (
            <Text className="text-base" style={{ color: colors.mutedIcon }}>
              {placeholder}
            </Text>
          )}
          <Ionicons name="time-outline" size={20} color={colors.muted} />
        </TouchableOpacity>

        {value ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            className="pl-3 py-1 ml-1"
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Builder</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              
              {/* Section 1: Weekdays */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Days</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <TouchableOpacity
                      key={day.key}
                      onPress={() => toggleDay(day.key)}
                      style={[
                        styles.dayBadge,
                        { borderColor: colors.border },
                        isSelected ? { backgroundColor: colors.accent, borderColor: colors.accent } : { backgroundColor: colors.surfaceSoft }
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          { color: isSelected ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section 2: Start Time */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Start Time</Text>
              <View style={styles.timePickerContainer}>
                <View style={styles.scrollCol}>
                  <Text style={[styles.timeLabel, { color: colors.muted }]}>Hour</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={`sh-${h}`}
                        onPress={() => setStartHour(h)}
                        style={[
                          styles.timePill,
                          { backgroundColor: colors.surfaceSoft },
                          startHour === h ? { backgroundColor: colors.accent } : null
                        ]}
                      >
                        <Text style={[styles.timePillText, { color: startHour === h ? '#fff' : colors.text }]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.scrollCol}>
                  <Text style={[styles.timeLabel, { color: colors.muted }]}>Minute</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {MINUTES.map(m => (
                      <TouchableOpacity
                        key={`sm-${m}`}
                        onPress={() => setStartMin(m)}
                        style={[
                          styles.timePill,
                          { backgroundColor: colors.surfaceSoft },
                          startMin === m ? { backgroundColor: colors.accent } : null
                        ]}
                      >
                        <Text style={[styles.timePillText, { color: startMin === m ? '#fff' : colors.text }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Section 3: End Time */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>End Time</Text>
              <View style={styles.timePickerContainer}>
                <View style={styles.scrollCol}>
                  <Text style={[styles.timeLabel, { color: colors.muted }]}>Hour</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={`eh-${h}`}
                        onPress={() => setEndHour(h)}
                        style={[
                          styles.timePill,
                          { backgroundColor: colors.surfaceSoft },
                          endHour === h ? { backgroundColor: colors.accent } : null
                        ]}
                      >
                        <Text style={[styles.timePillText, { color: endHour === h ? '#fff' : colors.text }]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.scrollCol}>
                  <Text style={[styles.timeLabel, { color: colors.muted }]}>Minute</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {MINUTES.map(m => (
                      <TouchableOpacity
                        key={`em-${m}`}
                        onPress={() => setEndMin(m)}
                        style={[
                          styles.timePill,
                          { backgroundColor: colors.surfaceSoft },
                          endMin === m ? { backgroundColor: colors.accent } : null
                        ]}
                      >
                        <Text style={[styles.timePillText, { color: endMin === m ? '#fff' : colors.text }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Live Preview Box */}
              <View style={[styles.previewBox, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.muted }]}>Live Preview</Text>
                <Text style={[styles.previewText, { color: selectedDays.length > 0 ? colors.accent : colors.muted }]}>
                  {getPreviewString()}
                </Text>
              </View>

            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-3.5 rounded-xl border mr-2 flex-1 items-center"
                style={{ borderColor: colors.border }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleApply}
                disabled={selectedDays.length === 0}
                className="px-6 py-3.5 rounded-xl bg-primary flex-2 items-center"
                style={{ opacity: selectedDays.length === 0 ? 0.6 : 1 }}
              >
                <Text className="text-white font-semibold">Confirm Schedule</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    width: '100%'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  dayBadge: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 44,
    alignItems: 'center'
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  timePickerContainer: {
    marginBottom: 18,
    gap: 12
  },
  scrollCol: {
    gap: 6
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  horizontalScroll: {
    gap: 8,
    paddingRight: 16
  },
  timePill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 40
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '700'
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  previewText: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10
  }
});
