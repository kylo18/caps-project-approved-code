// ─────────────────────────────────────────────────────────────────────────────
// StudentLeaderboard — podium + row list for rankings.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StudentAvatar } from './StudentAvatar';

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

const studentColors = {
  gold: '#FFD45C',
  silver: '#C9CBD7',
  bronze: '#D89757',
  white: '#FFFFFF',
  text: '#0C092A',
  textSoft: '#858494',
  border: '#EFEEFC',
  surfaceSoft: '#FFF1E9',
  pale: '#F8F6FF',
};

const studentShadow = Platform.select({
  android: { elevation: 5 },
  default: {
    shadowColor: '#062B2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
});

// ── Row ────────────────────────────────────────────────────────────────────

export function StudentLeaderboardRow({
  entry,
  subtitle,
  showMedal = false,
  emphasize = false,
  trailingLabel,
}: StudentLeaderboardRowProps) {
  const rank = Number(entry?.rank ?? 0);
  const medalColor =
    rank === 1 ? studentColors.gold
    : rank === 2 ? studentColors.silver
    : rank === 3 ? studentColors.bronze
    : studentColors.border;
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
          <Ionicons name={medalIcon as keyof typeof Ionicons.glyphMap} size={18} color={medalColor} />
        </View>
      ) : (
        <View style={styles.leaderboardTrailing}>
          <Text style={styles.leaderboardTrailingValue}>
            {trailingLabel ?? `${entry?.points ?? entry?.score ?? 0}`}
          </Text>
          <Text style={styles.leaderboardTrailingText}>PTS</Text>
        </View>
      )}
    </View>
  );
}

// ── Podium ─────────────────────────────────────────────────────────────────

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
            <View style={[styles.podiumTopShadow, { width: width + 6, top: 4 }]} />
            <View style={[styles.podiumTopSurface, { width, backgroundColor: topColor }]} />
            <View style={[styles.podiumBar, { width, height: height - 10, backgroundColor: barColor }]}>
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

// ── Styles ─────────────────────────────────────────────────────────────────

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
});