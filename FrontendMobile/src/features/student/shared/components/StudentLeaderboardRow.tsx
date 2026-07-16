// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Leaderboard row component — single student entry with rank, avatar,
//          name, points/score, and optional medal icon.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { studentColors, studentShadow } from '../ui/studentTokens';
import { StudentAvatar } from './StudentAvatar';

export interface LeaderboardEntry {
  name?: string;
  firstName?: string;
  lastName?: string;
  rank?: number;
  points?: number;
  score?: number;
  [key: string]: unknown;
}

export type StudentLeaderboardRowProps = {
  entry: LeaderboardEntry;
  subtitle: string;
  showMedal?: boolean;
  emphasize?: boolean;
  trailingLabel?: string;
};

export function StudentLeaderboardRow({
  entry,
  subtitle,
  showMedal = false,
  emphasize = false,
  trailingLabel,
}: StudentLeaderboardRowProps) {
  const rank = Number(entry?.rank ?? 0);
  const medalColor =
    rank === 1
      ? studentColors.gold
      : rank === 2
      ? studentColors.silver
      : rank === 3
      ? studentColors.bronze
      : studentColors.border;
  const medalIcon = rank <= 3 ? 'ribbon' : 'ellipse-outline';

  return (
    <View
      className={`flex-row items-center gap-3 rounded-[20px] border-2 px-3 py-2.5 ${emphasize ? 'bg-[#FFF1E9]' : 'bg-white'}`}
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      {/* Rank */}
      <View className="w-[26px] items-center">
        <View className={`w-6 h-6 rounded-full items-center justify-center ${emphasize ? 'bg-[#FFF1E9]' : 'bg-[#F8F6FF]'}`}>
          <Text className="font-sans text-xs font-medium" style={{ color: studentColors.textSoft }}>
            {rank}
          </Text>
        </View>
      </View>

      {/* Avatar */}
      <StudentAvatar label={entry?.name ?? 'ST'} size={48} index={rank} />

      {/* Name + subtitle */}
      <View className="flex-1 gap-0.5">
        <Text 
          numberOfLines={2} 
          adjustsFontSizeToFit 
          minimumFontScale={0.8}
          className="font-sans text-base font-medium leading-6" 
          style={{ color: studentColors.text }}
        >
          {entry?.name ?? 'Student'}
        </Text>
        <Text numberOfLines={1} className="font-sans text-xs font-normal leading-[18px]" style={{ color: studentColors.textSoft }}>
          {subtitle}
        </Text>
      </View>

      {/* Medal or score */}
      {showMedal ? (
        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${medalColor}33` }}>
          <Ionicons name={medalIcon as keyof typeof Ionicons.glyphMap} size={18} color={medalColor} />
        </View>
      ) : (
        <View className="items-end">
          <Text className="font-sans text-base font-bold leading-5" style={{ color: studentColors.text }}>
            {trailingLabel ?? `${Math.round(entry?.points ?? entry?.score ?? 0)}`}
          </Text>
          <Text className="font-sans text-[10px] font-medium leading-3 tracking-[1.6px]" style={{ color: studentColors.textSoft }}>PTS</Text>
        </View>
      )}
    </View>
  );
}