// ─────────────────────────────────────────────────────────────────────────────
// StudentLeaderboard — podium + row list for rankings.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStudentColors, getStudentShadow } from './studentTokens';
import { StudentAvatar } from './StudentAvatar';

type LeaderboardRowProps = {
  entry: any;
  subtitle: string;
  showMedal?: boolean;
  emphasize?: boolean;
  trailingLabel?: string;
};

function StudentLeaderboardRow({
  entry,
  subtitle,
  showMedal = false,
  emphasize = false,
  trailingLabel,
}: LeaderboardRowProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const studentColors = getStudentColors(isDark);
  const studentShadow = getStudentShadow(isDark);
  const rank = Number(entry?.rank ?? 0);
  const medalColor =
    rank === 1 ? studentColors.gold
    : rank === 2 ? studentColors.silver
    : rank === 3 ? studentColors.bronze
    : studentColors.border;
  const medalIcon = rank <= 3 ? 'ribbon' : 'ellipse-outline';

  return (
    <View
      className="flex-row items-center gap-3 rounded-[20px] border-2 px-3 py-2.5"
      style={{
        backgroundColor: emphasize ? studentColors.statsCard : studentColors.card,
        borderColor: studentColors.border,
        ...studentShadow,
      }}
    >
      <View className="w-[26px] items-center">
        <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: emphasize ? studentColors.orangeSoft : studentColors.pale }}>
          <Text className="font-sans text-xs font-medium" style={{ color: studentColors.textSoft }}>{rank}</Text>
        </View>
      </View>
      <StudentAvatar label={entry?.name ?? 'ST'} size={48} index={rank} />
      <View className="flex-1 gap-0.5">
        <Text 
          numberOfLines={2} 
          className="font-sans text-base font-medium leading-6" 
          style={{ color: studentColors.text }}
        >
          {entry?.name ?? 'Student'}
        </Text>
        <Text numberOfLines={1} className="font-sans text-xs font-normal leading-[18px]" style={{ color: studentColors.textSoft }}>
          {subtitle}
        </Text>
      </View>
      {showMedal ? (
        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${medalColor}33` }}>
          <Ionicons name={medalIcon as keyof typeof Ionicons.glyphMap} size={18} color={medalColor} />
        </View>
      ) : (
        <View className="items-end">
          <Text className="font-sans text-base font-bold leading-5" style={{ color: studentColors.text }}>
            {trailingLabel ?? `${entry?.points ?? entry?.score ?? 0}`}
          </Text>
          <Text className="font-sans text-[10px] font-medium leading-3 tracking-[1.6px]" style={{ color: studentColors.textSoft }}>PTS</Text>
        </View>
      )}
    </View>
  );
}

type PodiumProps = { topThree: any[] };

function StudentLeaderboardPodium({ topThree }: PodiumProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const studentColors = getStudentColors(isDark);
  const studentShadow = getStudentShadow(isDark);
  const ordered = useMemo(
    () => [
      { place: 2, entry: topThree[1], height: 62, width: 58, avatarSize: 54, avatarColor: '#F7D6F3', barColor: '#BFC0C8' },
      { place: 1, entry: topThree[0], height: 80, width: 74, avatarSize: 68, avatarColor: '#FFE47A', barColor: '#FFD52F' },
      { place: 3, entry: topThree[2], height: 56, width: 58, avatarSize: 54, avatarColor: '#D9E0FF', barColor: '#D89548' },
    ],
    [topThree]
  );

  return (
    <View className="flex-row items-end justify-between gap-[10px]">
      {ordered.map(({ place, entry, height, width, avatarSize, avatarColor, barColor }) => (
        <View key={place} className="flex-1 items-center">
          <View className="items-center justify-end" style={place === 1 ? { height: 82 } : { height: 68 }}>
            <StudentAvatar
              label={entry?.name ?? `${place}`}
              size={avatarSize}
              index={place}
              style={{ backgroundColor: avatarColor, borderWidth: 3, borderColor: studentColors.white, ...studentShadow }}
            />
          </View>
          <View className="h-11 items-center justify-center my-1">
            <Text 
              numberOfLines={2} 
              className="font-sans text-xs font-bold text-center" 
              style={{ color: studentColors.white, width: 100 }}
            >
              {entry?.name ?? `#${place}`}
            </Text>
          </View>
          <View className="items-center justify-end" style={{ width, height }}>
            <View className="rounded-t-[10px] items-center justify-center" style={{ width, height, backgroundColor: barColor }}>
              <Text className="font-sans text-[42px] font-bold" style={{ color: studentColors.white }}>{place}</Text>
            </View>
          </View>
          <Text className="font-sans text-xs font-medium leading-[18px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {entry ? `${Math.round(entry.points ?? entry.score ?? 0)} pts` : '--'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export { StudentLeaderboardRow, StudentLeaderboardPodium };
