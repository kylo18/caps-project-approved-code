// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Leaderboard row component — single student entry with rank, avatar,
//          name, points/score, and optional medal icon.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { studentColors, studentShadow } from '../studentTheme';
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
      style={[
        styles.leaderboardRow,
        emphasize ? styles.leaderboardRowEmphasis : null,
      ]}
    >
      {/* Rank */}
      <View style={styles.leaderboardRank}>
        <View
          style={[
            styles.rankBubble,
            {
              backgroundColor: emphasize
                ? studentColors.surfaceSoft
                : studentColors.pale,
            },
          ]}
        >
          <Text style={styles.rankBubbleText}>{rank}</Text>
        </View>
      </View>

      {/* Avatar */}
      <StudentAvatar
        label={entry?.name ?? 'ST'}
        size={48}
        index={rank}
      />

      {/* Name + subtitle */}
      <View style={styles.leaderboardContent}>
        <Text numberOfLines={1} style={styles.leaderboardName}>
          {entry?.name ?? 'Student'}
        </Text>
        <Text numberOfLines={1} style={styles.leaderboardMeta}>
          {subtitle}
        </Text>
      </View>

      {/* Medal or score */}
      {showMedal ? (
        <View style={[styles.medalBadge, { backgroundColor: `${medalColor}33` }]}>
          <Ionicons
            name={medalIcon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={medalColor}
          />
        </View>
      ) : (
        <View style={styles.leaderboardTrailing}>
          <Text style={styles.leaderboardTrailingValue}>
            {trailingLabel ?? `${Math.round(entry?.points ?? entry?.score ?? 0)}`}
          </Text>
          <Text style={styles.leaderboardTrailingText}>PTS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...studentShadow,
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
});