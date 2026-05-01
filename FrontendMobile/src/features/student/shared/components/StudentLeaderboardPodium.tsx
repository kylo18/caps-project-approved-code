// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Podium component showing the top 3 students in leaderboard.
//          Displays avatars, bars, names, and point totals.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet, Text, View } from 'react-native';
import { studentColors, studentShadow } from '../studentTheme';
import { StudentAvatar } from './StudentAvatar';
import { LeaderboardEntry } from './StudentLeaderboardRow';

export type StudentLeaderboardPodiumProps = {
  topThree: (LeaderboardEntry | undefined)[];
};

const PODIUM_CONFIG = [
  {
    place: 2,
    height: 92,
    width: 58,
    avatarSize: 54,
    avatarColor: '#F7D6F3',
    barColor: '#BFC0C8',
    topColor: '#D7D8DE',
  },
  {
    place: 1,
    height: 122,
    width: 74,
    avatarSize: 68,
    avatarColor: '#FFE47A',
    barColor: '#FFD52F',
    topColor: '#FFE985',
  },
  {
    place: 3,
    height: 82,
    width: 58,
    avatarSize: 54,
    avatarColor: '#D9E0FF',
    barColor: '#D89548',
    topColor: '#E5AB66',
  },
] as const;

export function StudentLeaderboardPodium({ topThree }: StudentLeaderboardPodiumProps) {
  return (
    <View style={styles.podiumWrap}>
      {PODIUM_CONFIG.map(({ place, height, width, avatarSize, avatarColor, barColor, topColor }) => {
        const entry = topThree[place - 1] as LeaderboardEntry | undefined;
        return (
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
              style={[styles.podiumTopShadow, { width: width + 6 }]}
            />
            <View style={[styles.podiumTopSurface, { width, backgroundColor: topColor }]} />
            <View
              style={[styles.podiumBar, { width, height: height - 10, backgroundColor: barColor }]}
            >
              <Text style={styles.podiumBarText}>{place}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.podiumName}>
            {entry
              ? entry.firstName ?? entry.name ?? `#${place}`
              : `#${place}`}
          </Text>
          <Text style={styles.podiumPoints}>
            {entry ? `${Math.round(entry.points ?? entry.score ?? 0)} pts` : '--'}
          </Text>
        </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});