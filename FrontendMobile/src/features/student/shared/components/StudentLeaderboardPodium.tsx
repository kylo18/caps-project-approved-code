// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Podium component showing the top 3 students in leaderboard.
//          Displays avatars, bars, names, and point totals.
// ─────────────────────────────────────────────────────────────────────────────

import { Text, View } from 'react-native';
import { studentColors, studentShadow } from '../ui/studentTokens';
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
    <View className="flex-row items-end justify-between gap-[10px]">
      {PODIUM_CONFIG.map(({ place, height, width, avatarSize, avatarColor, barColor, topColor }) => {
        const entry = topThree[place - 1] as LeaderboardEntry | undefined;
        return (
          <View key={place} className="flex-1 items-center">
            <View className="h-[74px] items-center justify-end mb-2" style={place === 1 ? { height: 88 } : {}}>
              <StudentAvatar
                label={entry?.name ?? `${place}`}
                size={avatarSize}
                index={place}
                style={{ borderWidth: 3, borderColor: studentColors.white, ...studentShadow }}
              />
            </View>
            <View className="items-center justify-end" style={{ width, height }}>
              <View className="absolute top-0 rounded-full" style={{ width: width + 6, height: 10, backgroundColor: 'rgba(12,9,42,0.14)' }} />
              <View className="absolute rounded-full" style={{ width, height: 12, backgroundColor: topColor }} />
              <View className="rounded-t-[10px] items-center justify-center" style={{ width, height: height - 10, backgroundColor: barColor }}>
                <Text className="font-sans text-[42px] font-bold" style={{ color: studentColors.white }}>{place}</Text>
              </View>
            </View>
            <Text 
              numberOfLines={2} 
              adjustsFontSizeToFit 
              minimumFontScale={0.7}
              className="font-sans text-xs font-medium leading-4 mt-3 max-w-[88px] text-center" 
              style={{ color: studentColors.white }}
            >
              {entry ? entry.name ?? `#${place}` : `#${place}`}
            </Text>
            <Text className="font-sans text-xs font-medium leading-[18px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {entry ? `${Math.round(entry.points ?? entry.score ?? 0)} pts` : '--'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}