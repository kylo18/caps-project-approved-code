import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';

export const studentColors = {
  orange: '#FF6E00',
  orangeDark: '#EB6B00',
  orangeSoft: '#FFA258',
  orangeCard: '#F2B161',
  white: '#FFFFFF',
  text: '#0C092A',
  textSoft: '#858494',
  border: '#EFEEFC',
  borderSoft: '#F6F2FF',
  pink: '#FFD6DD',
  pinkSoft: '#FFC2CD',
  blue: '#C4D0FB',
  surface: '#FFF7F1',
  surfaceSoft: '#FFF1E9',
  pale: '#F8F6FF',
  success: '#86D2A8',
  gold: '#FFD45C',
  silver: '#C9CBD7',
  bronze: '#D89757',
};

export const studentRadii = {
  pill: 999,
  lg: 20,
  xl: 24,
  sheet: 32,
};

export const studentShadow = Platform.select({
  android: {
    elevation: 5,
  },
  default: {
    shadowColor: '#062B2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
});

export const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionColor?: string;
  style?: StyleProp<ViewStyle>;
};

type StudentAvatarProps = {
  label?: string;
  size?: number;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

type StudentExamCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  iconVariant?: 'bars' | 'formula' | 'grid';
  highlight?: boolean;
};

type StudentSegmentedControlProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

type StudentFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  programs: Array<{ programID: number; programName: string }>;
  subjects: Array<{ subjectID: number; subjectName: string; subjectCode?: string }>;
  selectedProgramID: number | null;
  selectedSubjectID: number | null;
  onSelectProgram: (programID: number | null) => void;
  onSelectSubject: (subjectID: number | null) => void;
};

type StudentLeaderboardRowProps = {
  entry: any;
  subtitle: string;
  showMedal?: boolean;
  emphasize?: boolean;
  trailingLabel?: string;
};

type StudentLeaderboardPodiumProps = {
  topThree: any[];
};

function StudentLogoBars() {
  return (
    <View style={styles.miniBars}>
      <View style={[styles.miniBarBase, { height: 18 }]} />
      <View style={[styles.miniBarAccent, { height: 26 }]} />
      <View style={[styles.miniBarBase, { height: 34 }]} />
    </View>
  );
}

function StudentFormulaIcon() {
  return <Text style={styles.fxText}>ƒx</Text>;
}

function StudentGridIcon() {
  return (
    <View style={styles.gridIcon}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.gridDot} />
      ))}
    </View>
  );
}

function SubjectTile({ iconVariant }: { iconVariant: StudentExamCardProps['iconVariant'] }) {
  const variant = iconVariant ?? 'bars';
  const tileColor = variant === 'grid' ? studentColors.pinkSoft : studentColors.blue;

  return (
    <View style={[styles.subjectTile, { backgroundColor: tileColor }]}>
      <View style={styles.subjectTilePaper}>
        {variant === 'formula' ? <StudentFormulaIcon /> : null}
        {variant === 'grid' ? <StudentGridIcon /> : null}
        {variant === 'bars' ? <StudentLogoBars /> : null}
      </View>
    </View>
  );
}

export function getSubjectVisualVariant(input?: string | null): StudentExamCardProps['iconVariant'] {
  const label = input?.toLowerCase() ?? '';
  if (label.includes('program') || label.includes('database') || label.includes('logic')) {
    return 'grid';
  }
  if (
    label.includes('calculus') ||
    label.includes('math') ||
    label.includes('economics') ||
    label.includes('chemistry')
  ) {
    return 'formula';
  }
  return 'bars';
}

export function StudentAvatar({ label = 'ST', size = 56, index = 0, style }: StudentAvatarProps) {
  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarPalette[index % avatarPalette.length],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          {
            fontSize: Math.max(14, size * 0.28),
          },
        ]}
      >
        {initials || 'ST'}
      </Text>
    </View>
  );
}

export function StudentHeroDecoration({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" className="absolute inset-0" style={style}>
      <View style={[styles.heroCircle, { top: -82, left: -78 }]} />
      <View style={[styles.heroCircle, { top: -34, right: -88, width: 200, height: 200, borderRadius: 100 }]} />
      <View style={[styles.heroDot, { top: 92, left: 88 }]} />
      <View style={[styles.heroDot, { top: 118, right: 76, width: 18, height: 18, borderRadius: 9 }]} />
    </View>
  );
}

export function StudentSectionHeader({
  title,
  actionLabel,
  onActionPress,
  actionColor = studentColors.orange,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable hitSlop={8} onPress={onActionPress}>
          <Text style={[styles.sectionHeaderAction, { color: actionColor }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StudentExamCard({
  title,
  subtitle,
  onPress,
  iconVariant,
  highlight = false,
}: StudentExamCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-[20px] px-2 py-2"
      style={[
        {
          gap: 16,
          backgroundColor: highlight ? studentColors.surfaceSoft : studentColors.white,
          borderWidth: 2,
          borderColor: studentColors.border,
        },
        studentShadow,
      ]}
    >
      <SubjectTile iconVariant={iconVariant} />
      <View className="flex-1" style={{ gap: 6 }}>
        <Text numberOfLines={1} className="text-base font-medium" style={{ color: studentColors.text }}>
          {title}
        </Text>
        <Text numberOfLines={1} className="text-xs" style={{ color: studentColors.textSoft }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={studentColors.orange} />
    </Pressable>
  );
}

export function StudentSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: StudentSegmentedControlProps<T>) {
  return (
    <View style={[styles.segmentedControl, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
          >
            <Text style={[styles.segmentButtonText, active ? styles.segmentButtonTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
        <Pressable style={styles.sheetCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Leaderboard Filters</Text>

          <Text style={[styles.sheetSectionTitle, { marginTop: 4 }]}>Program</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetChipRow}>
            <Pressable
              onPress={() => onSelectProgram(null)}
              style={[styles.sheetChip, selectedProgramID === null ? styles.sheetChipActive : null]}
            >
              <Text style={[styles.sheetChipText, selectedProgramID === null ? styles.sheetChipTextActive : null]}>
                All Programs
              </Text>
            </Pressable>
            {programs.map((program) => (
              <Pressable
                key={program.programID}
                onPress={() => onSelectProgram(program.programID)}
                style={[styles.sheetChip, selectedProgramID === program.programID ? styles.sheetChipActive : null]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.sheetChipText,
                    selectedProgramID === program.programID ? styles.sheetChipTextActive : null,
                  ]}
                >
                  {program.programName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sheetSectionTitle}>Subject</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetSubjectList}>
            <Pressable
              onPress={() => onSelectSubject(null)}
              style={[styles.sheetListItem, selectedSubjectID === null ? styles.sheetListItemActive : null]}
            >
              <Text style={styles.sheetListTitle}>All Subjects</Text>
            </Pressable>
            {subjects.map((subject) => (
              <Pressable
                key={subject.subjectID}
                onPress={() => onSelectSubject(subject.subjectID)}
                style={[styles.sheetListItem, selectedSubjectID === subject.subjectID ? styles.sheetListItemActive : null]}
              >
                <Text numberOfLines={1} style={styles.sheetListTitle}>
                  {subject.subjectName}
                </Text>
                {subject.subjectCode ? <Text style={styles.sheetListSubtitle}>{subject.subjectCode}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function StudentLeaderboardRow({
  entry,
  subtitle,
  showMedal = false,
  emphasize = false,
  trailingLabel,
}: StudentLeaderboardRowProps) {
  const rank = Number(entry?.rank ?? 0);
  const medalColor =
    rank === 1 ? studentColors.gold : rank === 2 ? studentColors.silver : rank === 3 ? studentColors.bronze : studentColors.border;
  const medalIcon = rank <= 3 ? 'ribbon' : 'ellipse-outline';

  return (
    <View style={[styles.leaderboardRow, emphasize ? styles.leaderboardRowEmphasis : null]}>
      <View style={styles.leaderboardRank}>
        <View style={[styles.rankBubble, { backgroundColor: emphasize ? studentColors.surfaceSoft : '#F8F6FF' }]}>
          <Text style={styles.rankBubbleText}>{rank}</Text>
        </View>
      </View>
      <StudentAvatar label={entry?.name ?? 'ST'} size={48} index={rank} />
      <View style={styles.leaderboardContent}>
        <Text numberOfLines={1} style={styles.leaderboardName}>
          {entry?.name ?? 'Student'}
        </Text>
        <Text numberOfLines={1} style={styles.leaderboardMeta}>
          {subtitle}
        </Text>
      </View>
      {showMedal ? (
        <View style={[styles.medalBadge, { backgroundColor: `${medalColor}33` }]}>
          <Ionicons name={medalIcon as any} size={18} color={medalColor} />
        </View>
      ) : (
        <View style={styles.leaderboardTrailing}>
          <Text style={styles.leaderboardTrailingValue}>{trailingLabel ?? `${entry?.points ?? entry?.score ?? 0}`}</Text>
          <Text style={styles.leaderboardTrailingText}>PTS</Text>
        </View>
      )}
    </View>
  );
}

export function StudentLeaderboardPodium({ topThree }: StudentLeaderboardPodiumProps) {
  const ordered = useMemo(
    () => [
      {
        place: 2,
        entry: topThree[1],
        height: 92,
        width: 58,
        avatarSize: 54,
        avatarColor: '#F7D6F3',
        barColor: '#BFC0C8',
        topColor: '#D7D8DE',
      },
      {
        place: 1,
        entry: topThree[0],
        height: 122,
        width: 74,
        avatarSize: 68,
        avatarColor: '#FFE47A',
        barColor: '#FFD52F',
        topColor: '#FFE985',
      },
      {
        place: 3,
        entry: topThree[2],
        height: 82,
        width: 58,
        avatarSize: 54,
        avatarColor: '#D9E0FF',
        barColor: '#D89548',
        topColor: '#E5AB66',
      },
    ],
    [topThree]
  );

  return (
    <View style={styles.podiumWrap}>
      {ordered.map(({ place, entry, height, width, avatarSize, avatarColor, barColor, topColor }) => (
        <View key={place} style={styles.podiumColumn}>
          <View style={[styles.podiumAvatarDock, place === 1 ? styles.podiumAvatarDockCenter : null]}>
            <StudentAvatar
              label={entry?.name ?? `${place}`}
              size={avatarSize}
              index={place}
              style={[styles.podiumAvatar, { backgroundColor: avatarColor }]}
            />
          </View>
          <View style={[styles.podiumPedestal, { width, height }]}>
            <View
              style={[
                styles.podiumTopShadow,
                {
                  width: width + 6,
                  top: 4,
                },
              ]}
            />
            <View
              style={[
                styles.podiumTopSurface,
                {
                  width,
                  backgroundColor: topColor,
                },
              ]}
            />
            <View
              style={[
                styles.podiumBar,
                {
                  width,
                  height: height - 10,
                  backgroundColor: barColor,
                },
              ]}
            >
              <Text style={styles.podiumBarText}>{place}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.podiumName}>
            {entry?.firstName ?? entry?.name ?? `#${place}`}
          </Text>
          <Text style={styles.podiumPoints}>
            {entry ? `${Math.round(entry.points ?? entry.score ?? 0)} pts` : '--'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function formatWeeklyCountdown(periodEndsAt?: string | null) {
  if (!periodEndsAt) {
    return '--';
  }

  const diff = new Date(periodEndsAt).getTime() - Date.now();
  if (diff <= 0) {
    return '00d 00h 00m';
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes
    .toString()
    .padStart(2, '0')}m`;
}

export function StudentTabBar({ state, descriptors, navigation }: any) {
  const routes = state.routes;
  const visibleTabNames = new Set(['dashboard', 'search', 'leaderboard', 'insights']);
  const activeRouteName = state.routes[state.index]?.name;
  const visibleRoutes = routes.filter((route: any) => visibleTabNames.has(route.name));

  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any) => {
          const focused = activeRouteName === route.name;
          const options = descriptors[route.key]?.options ?? {};
          const iconName = getTabIcon(route.name, focused);
          const label = options.title ?? options.headerTitle ?? route.name;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabBarItem}
            >
              <Ionicons name={iconName as any} size={22} color={focused ? studentColors.orange : '#C9C6D8'} />
              <Text style={[styles.tabBarLabel, { color: focused ? studentColors.orange : '#C9C6D8' }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getTabIcon(name: string, focused: boolean) {
  if (name === 'dashboard') {
    return focused ? 'home' : 'home-outline';
  }
  if (name === 'search') {
    return focused ? 'search' : 'search-outline';
  }
  if (name === 'leaderboard') {
    return focused ? 'trophy' : 'trophy-outline';
  }
  return focused ? 'analytics' : 'analytics-outline';
}

const styles = {
  heroCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  sectionHeaderAction: {
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  subjectTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectTilePaper: {
    width: 48,
    height: 64,
    backgroundColor: studentColors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  miniBarBase: {
    width: 6,
    borderRadius: 999,
    backgroundColor: studentColors.blue,
  },
  miniBarAccent: {
    width: 6,
    borderRadius: 999,
    backgroundColor: studentColors.orange,
  },
  fxText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 22,
    fontWeight: '700',
  },
  gridIcon: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: studentColors.pinkSoft,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: studentColors.orangeDark,
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFC48D',
  },
  segmentButtonText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  segmentButtonTextActive: {
    color: studentColors.orangeDark,
    fontWeight: '700',
  },
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
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leaderboardRowEmphasis: {
    backgroundColor: studentColors.surfaceSoft,
  },
  leaderboardRank: {
    width: 26,
    alignItems: 'center',
  },
  rankBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBubbleText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '500',
  },
  leaderboardContent: {
    flex: 1,
    gap: 2,
  },
  leaderboardName: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  leaderboardMeta: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  medalBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardTrailing: {
    alignItems: 'flex-end',
  },
  leaderboardTrailingValue: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  leaderboardTrailingText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
    letterSpacing: 1.6,
  },
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatarDock: {
    height: 74,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  podiumAvatarDockCenter: {
    height: 88,
  },
  podiumAvatar: {
    borderWidth: 3,
    borderColor: studentColors.white,
    ...studentShadow,
  },
  podiumPedestal: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumTopShadow: {
    position: 'absolute',
    top: 0,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(12,9,42,0.14)',
  },
  podiumTopSurface: {
    position: 'absolute',
    top: 0,
    height: 12,
    borderRadius: 999,
  },
  podiumBar: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBarText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 42,
    fontWeight: '700',
  },
  podiumName: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 88,
    textAlign: 'center',
  },
  podiumPoints: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 8,
    ...studentShadow,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    gap: 3,
  },
  tabBarDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabBarDotActive: {
    backgroundColor: studentColors.orange,
  },
  tabBarLabel: {
    fontFamily: 'Rubik',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
};
